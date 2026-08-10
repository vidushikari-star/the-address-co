import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { ReelCompositionSchema } from "@/lib/marketing/schemas"

type Context = { params: Promise<{ id: string }> }

export async function POST(_request: Request, context: Context) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  try {
    const { id } = await context.params
    const record = await MarketingRepository.getContentById(id)
    if (!record) return NextResponse.json({ error: "Content not found." }, { status: 404 })
    if (["approved", "scheduled", "publishing", "published"].includes(record.content.status)) {
      return NextResponse.json({ error: "Approved or published content must be returned to changes before rerendering." }, { status: 409 })
    }
    if (record.content.contentType !== "reel") {
      return NextResponse.json({ error: "Only Reel rendering is currently requested by this endpoint." }, { status: 400 })
    }
    ReelCompositionSchema.parse(record.content.composition)

    await MarketingRepository.transitionContent({
      id,
      from: ["draft", "changes_requested", "ready_for_review", "failed"],
      to: "rendering",
      updatedBy: access.user.id,
    })
    await MarketingRepository.enqueueJob({
      contentId: id,
      type: "render_reel",
      idempotencyKey: `render-reel:${id}:${crypto.randomUUID()}`,
    })
    await MarketingRepository.addAuditLog({ actorId: access.user.id, contentId: id, action: "render.requested" })
    return NextResponse.json({ queued: true }, { status: 202 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to queue render." }, { status: 400 })
  }
}
