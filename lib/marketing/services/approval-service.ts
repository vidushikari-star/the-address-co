import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { getInstagramFormat } from "@/lib/marketing/instagram-format"
import { validateInstagramPublishability } from "@/lib/marketing/content-delivery"
function hasReviewableCopy(content: {
  headline?: string | null
  hook?: string | null
  caption?: string | null
  cta?: string | null
  hashtags: string[]
}) {
  return Boolean(
    content.headline?.trim() && content.hook?.trim() && content.caption?.trim() &&
    content.cta?.trim() && content.hashtags.length
  )
}

export class ApprovalService {
  static async approve(contentId: string, adminId: string, note?: string) {
    const record = await MarketingRepository.getContentById(contentId)
    if (!record) throw new Error("Content not found.")
    const format = getInstagramFormat(record.content.contentType)
    if (format.captionRequired && !hasReviewableCopy(record.content)) {
      throw new Error("Generate or complete headline, hook, caption, CTA, and hashtags before approval.")
    }
    const publishabilityError = validateInstagramPublishability(record.content, record.assets)
    if (publishabilityError) throw new Error(publishabilityError)

    return MarketingRepository.applyApproval({
      contentId,
      decision: "approved",
      note,
      decidedBy: adminId,
    })
  }

  static async requestChanges(contentId: string, adminId: string, note?: string) {
    return MarketingRepository.applyApproval({
      contentId,
      decision: "changes_requested",
      note,
      decidedBy: adminId,
    })
  }

  static async reject(contentId: string, adminId: string, note?: string) {
    return MarketingRepository.applyApproval({
      contentId,
      decision: "rejected",
      note,
      decidedBy: adminId,
    })
  }
}
