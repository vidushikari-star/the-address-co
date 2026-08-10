import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { isInstagramPublishingEnabled } from "@/lib/marketing/feature-flags"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"

type Context = { params: Promise<{ id: string }> }

/** Queues publishing only. It never calls Meta during an HTTP request. */
export async function POST(_request: Request, context: Context) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  if (!isInstagramPublishingEnabled()) {
    return NextResponse.json({ error: "Instagram publishing is disabled by feature flag." }, { status: 403 })
  }

  const { id } = await context.params
  const content = await MarketingRepository.getContentById(id)
  if (!content) return NextResponse.json({ error: "Content not found." }, { status: 404 })
  if (content.content.status !== "approved") {
    return NextResponse.json({ error: "Only explicitly approved content can be published." }, { status: 409 })
  }
  if (!content.assets.some(asset => asset.kind === "rendered_media")) {
    return NextResponse.json({ error: "A rendered asset is required before publishing." }, { status: 409 })
  }

  await MarketingRepository.enqueueJob({
    contentId: id,
    type: "publish_instagram",
    idempotencyKey: `publish-now:${id}`,
  })
  await MarketingRepository.addAuditLog({ actorId: access.user.id, contentId: id, action: "publication.queued" })
  return NextResponse.json({ queued: true }, { status: 202 })
}
