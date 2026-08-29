import { getInstagramFormat } from "@/lib/marketing/instagram-format"
import type { MarketingFormat } from "@/lib/marketing/types"

/**
 * Platform-facing requirements only. Product policy (for example image-only
 * Carousels) remains in the format registry and can be stricter than Meta.
 * Values here are limited to outputs this renderer already validates.
 */
export type InstagramPlatformCapability = {
  format: MarketingFormat
  publishingSurface: "feed" | "story" | "reel"
  renderedMediaType: "image" | "video"
  requiredOutput: { width: number; height: number; aspectRatio: "4:5" | "9:16" }
  accountRequirement: "connected_instagram_account"
  approvalRequired: boolean
  scheduledPublishingRequired: boolean
}

export function getInstagramPlatformCapability(format: MarketingFormat): InstagramPlatformCapability {
  const contract = getInstagramFormat(format)
  return {
    format,
    publishingSurface: contract.publisherPath === "carousel" || contract.publisherPath === "image" ? "feed" : contract.publisherPath,
    renderedMediaType: contract.outputMediaType,
    requiredOutput: { width: contract.width, height: contract.height, aspectRatio: contract.aspectRatio },
    accountRequirement: "connected_instagram_account",
    approvalRequired: true,
    scheduledPublishingRequired: true,
  }
}
