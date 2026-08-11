import { hasPublishableMedia } from "@/lib/marketing/content-delivery"
import { isInstagramPublishingEnabled } from "@/lib/marketing/feature-flags"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"

export class SchedulerService {
  static async schedule(input: {
    contentId: string
    scheduledFor: string
    timezone: string
    adminId: string
  }) {
    const scheduledFor = new Date(input.scheduledFor)
    if (Number.isNaN(scheduledFor.valueOf()) || scheduledFor <= new Date()) {
      throw new Error("Choose a future publication time.")
    }

    const record = await MarketingRepository.getContentById(input.contentId)
    if (!record) throw new Error("Content not found.")
    if (record.content.status !== "approved") {
      throw new Error("Only approved content can be scheduled.")
    }
    if (!hasPublishableMedia(record.content, record.assets)) {
      throw new Error("Required publish media is not ready. Render the approved Reel before scheduling.")
    }
    if (record.content.contentType === "reel") {
      const versions = await MarketingRepository.listReelVersions(record.content.id)
      const approvedVersionAwaitingRender = versions.some(version => version.status === "approved" && !version.renderedAssetId)
      if (approvedVersionAwaitingRender) {
        throw new Error("Render the approved new Reel version and make it current before scheduling.")
      }
    }
    // Keep staging scheduling available while the kill switch is off. Once
    // production publishing is enabled, do not schedule work that cannot be
    // delivered by the configured professional account.
    if (isInstagramPublishingEnabled()) {
      const account = await MarketingRepository.getInstagramAccount()
      if (!account || !["connected", "expiring"].includes(account.status)) {
        throw new Error("Connect an Instagram professional account before scheduling.")
      }
      if (record.content.accountId && record.content.accountId !== account.id) {
        throw new Error("The selected Instagram account is no longer connected.")
      }
    }

    const content = await MarketingRepository.transitionContent({
      id: input.contentId,
      from: "approved",
      to: "scheduled",
      updatedBy: input.adminId,
      changes: { proposed_publish_at: scheduledFor.toISOString() },
    })

    await MarketingRepository.upsertSchedule({
      contentId: input.contentId,
      scheduledFor: scheduledFor.toISOString(),
      timezone: input.timezone,
      createdBy: input.adminId,
    })
    await MarketingRepository.enqueueJob({
      contentId: input.contentId,
      type: "publish_instagram",
      idempotencyKey: `scheduled-publish:${input.contentId}:${scheduledFor.toISOString()}`,
      runAfter: scheduledFor.toISOString(),
      // Reels can take time to process on Meta. The worker polls once per
      // minute with a bounded count instead of blocking a Vercel invocation.
      maxAttempts: 10,
    })
    await MarketingRepository.addAuditLog({
      actorId: input.adminId,
      contentId: input.contentId,
      action: "content.scheduled",
      metadata: { scheduledFor: scheduledFor.toISOString(), timezone: input.timezone },
    })

    return content
  }
}
