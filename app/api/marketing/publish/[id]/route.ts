import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { hasPublishableMedia } from "@/lib/marketing/content-delivery"
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
  const isRetry = await _request.json().catch(() => null)
    .then(body => Boolean(body && typeof body === "object" && (body as { retry?: unknown }).retry === true))
  if (isRetry) {
    if (content.content.status !== "failed") {
      return NextResponse.json({ error: "Only a failed publication can be retried." }, { status: 409 })
    }
    try {
      await MarketingRepository.prepareSafePublicationRetry({ contentId: id, updatedBy: access.user.id })
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "This publication cannot be retried automatically." }, { status: 409 })
    }
  } else if (content.content.status !== "approved") {
    return NextResponse.json({ error: "Only explicitly approved content can be published." }, { status: 409 })
  }
  if (!hasPublishableMedia(content.content, content.assets)) {
    return NextResponse.json({ error: "Required approved media is not ready for publishing." }, { status: 409 })
  }

  await MarketingRepository.enqueueJob({
    contentId: id,
    type: "publish_instagram",
    input: { publishTest: true },
    idempotencyKey: isRetry ? `publish-retry:${id}:${crypto.randomUUID()}` : `publish-test:${id}`,
    maxAttempts: 10,
  })
  await MarketingRepository.addAuditLog({ actorId: access.user.id, contentId: id, action: isRetry ? "publication.retry_queued" : "publication.test_queued" })
  return NextResponse.json({ queued: true, controlledTest: !isRetry }, { status: 202 })
}
