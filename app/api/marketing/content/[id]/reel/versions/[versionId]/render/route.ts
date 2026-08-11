import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"

type Context = { params: Promise<{ id: string; versionId: string }> }

export async function POST(_request: Request, context: Context) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  try {
    const { id, versionId } = await context.params
    const [record, version] = await Promise.all([MarketingRepository.getContentById(id), MarketingRepository.getReelVersion(versionId)])
    if (!record || !version || version.contentId !== id) return NextResponse.json({ error: "Reel version not found." }, { status: 404 })
    if (record.content.status !== "approved" || version.status !== "approved") {
      return NextResponse.json({ error: "Approve this revised Reel version before rendering it." }, { status: 409 })
    }
    await MarketingRepository.queueReelRender({
      contentId: id,
      updatedBy: access.user.id,
      jobInput: { resumeApproved: true, reelVersionId: version.id },
      idempotencyKey: `render-reel-version:${id}:${version.id}:${crypto.randomUUID()}`,
    })
    await MarketingRepository.markReelVersionRendering(version.id)
    await MarketingRepository.addAuditLog({ actorId: access.user.id, contentId: id, action: "reel_version.render_requested", metadata: { versionId: version.id } })
    return NextResponse.json({ queued: true }, { status: 202 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to queue the Reel version render." }, { status: 400 })
  }
}
