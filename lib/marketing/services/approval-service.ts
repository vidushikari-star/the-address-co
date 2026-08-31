import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { getInstagramFormat } from "@/lib/marketing/instagram-format"
import { validateInstagramPublishability } from "@/lib/marketing/content-delivery"
import { resolveMarketingContract } from "@/lib/marketing/content-contract"
import { creativeOutputSchemaForFormat } from "@/lib/marketing/schemas"
import { marketingRenderedCopyForFormat, validateMarketingFacts } from "@/lib/marketing/fact-contract"
import type { PropertyFactSnapshot } from "@/lib/marketing/types"

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
    const contract = resolveMarketingContract(record.content)
    const format = getInstagramFormat(contract.format)
    if (format.captionRequired && !hasReviewableCopy(record.content)) {
      throw new Error("Generate or complete headline, hook, caption, CTA, and hashtags before approval.")
    }
    const creative = creativeOutputSchemaForFormat(contract.format).safeParse(record.content.creative)
    if (creative.success) {
      const property = record.content.propertySnapshot as PropertyFactSnapshot
      const renderedOutput = {
        headline: record.content.headline ?? creative.data.headline,
        hook: record.content.hook ?? creative.data.hook,
        caption: record.content.caption ?? creative.data.caption,
        shortCaption: record.content.shortCaption ?? creative.data.shortCaption,
        cta: record.content.cta ?? creative.data.cta,
        altText: record.content.altText ?? creative.data.altText,
        coverText: creative.data.coverText,
        onScreenText: creative.data.onScreenText,
        carouselSlides: creative.data.carouselSlides,
        storyCopy: creative.data.storyCopy,
      }
      validateMarketingFacts({
        format: contract.format,
        propertySnapshot: property,
        factsUsed: creative.data.factsUsed,
        provenance: creative.data.claimProvenance,
        renderedCopy: marketingRenderedCopyForFormat(contract.format, renderedOutput),
      })
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
