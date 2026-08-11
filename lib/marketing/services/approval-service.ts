import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { carouselAssetValidationError } from "@/lib/marketing/content-delivery"
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
    if (!hasReviewableCopy(record.content)) {
      throw new Error("Generate or complete headline, hook, caption, CTA, and hashtags before approval.")
    }
    if (record.content.contentType === "carousel") {
      const mediaError = carouselAssetValidationError(record.content, record.assets)
      if (mediaError) throw new Error(mediaError)
    }

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
