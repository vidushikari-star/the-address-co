import { validateInstagramPublishability } from "@/lib/marketing/content-delivery"
import { isInstagramPublishingEnabled, isMarketingSchedulingEnabled } from "@/lib/marketing/feature-flags"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"

export class SchedulerService {
  static async schedule(input: {
    contentId: string
    scheduledFor: string
    timezone: string
    adminId: string
  }) {
    if (!isMarketingSchedulingEnabled()) {
      throw new Error("Marketing scheduling is disabled in this environment.")
    }
    const scheduledFor = new Date(input.scheduledFor)
    if (Number.isNaN(scheduledFor.valueOf()) || scheduledFor <= new Date()) {
      throw new Error("Choose a future publication time.")
    }

    let record: Awaited<ReturnType<typeof MarketingRepository.getContentById>> | undefined
    try {
      record = await MarketingRepository.getContentById(input.contentId)
      if (!record) throw new Error("Content not found.")
      if (record.content.status !== "approved") {
        throw new Error("Only approved content can be scheduled.")
      }
      const publishabilityError = validateInstagramPublishability(record.content, record.assets)
      if (publishabilityError) throw new Error(publishabilityError)
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

      return await MarketingRepository.scheduleApprovedContent({
        contentId: input.contentId,
        scheduledFor: scheduledFor.toISOString(),
        timezone: input.timezone,
        createdBy: input.adminId,
      })
    } catch (error) {
      if (record?.content.contentType === "carousel") {
        const reason = error instanceof Error ? error.message.replace(/https?:\/\/\S+/gi, "[url]").slice(0, 500) : "Unknown scheduling failure."
        console.error(`[marketing-carousel] content_id=${input.contentId} stage=schedule_eligibility status=failed reason=${reason}`)
      }
      throw error
    }
  }
}
