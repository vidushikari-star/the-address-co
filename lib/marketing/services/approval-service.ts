import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import type { z } from "zod"
import { getInstagramFormat } from "@/lib/marketing/instagram-format"
import { validateInstagramPublishability } from "@/lib/marketing/content-delivery"
import { resolveMarketingContract } from "@/lib/marketing/content-contract"
import { CreativeOutputSchema } from "@/lib/marketing/schemas"
import { detectUnsupportedNumericClaim, validateClaimProvenance } from "@/lib/marketing/fact-contract"
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

function reviewableCreativeCopy(content: {
  headline?: string | null
  hook?: string | null
  caption?: string | null
  cta?: string | null
  altText?: string | null
}, creative: z.infer<typeof CreativeOutputSchema>) {
  return [
    content.headline,
    content.hook,
    content.caption,
    content.cta,
    content.altText,
    creative.shortCaption,
    creative.coverText,
    ...creative.onScreenText,
    ...creative.carouselSlides,
    creative.storyCopy.headline,
    creative.storyCopy.supportingLine,
    ...creative.storyCopy.highlights,
    creative.storyCopy.priceLine,
    creative.storyCopy.cta,
  ].filter(Boolean).join(" ")
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
    const creative = CreativeOutputSchema.safeParse(record.content.creative)
    if (creative.success) {
      const copy = reviewableCreativeCopy(record.content, creative.data)
      const property = record.content.propertySnapshot as PropertyFactSnapshot
      validateClaimProvenance({ property, claims: creative.data.claimProvenance, factsUsed: creative.data.factsUsed, copy })
      const unsupportedNumericClaim = detectUnsupportedNumericClaim(copy, property)
      if (unsupportedNumericClaim) throw new Error(unsupportedNumericClaim)
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
