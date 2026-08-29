import { legacyContractForContentType } from "@/lib/marketing/content-contract"
import type { MarketingContentType, MarketingFormat } from "@/lib/marketing/types"

/** Canonical delivery formats. `feed_single` replaces the ambiguous old name. */
export type InstagramFormatId = MarketingFormat

export type InstagramFormatContract = {
  id: InstagramFormatId
  /** Existing rendered-media metadata may contain this historic label. */
  legacyId: "single_image" | "carousel" | "reel" | "story"
  label: string
  allowedSourceMedia: ReadonlyArray<"image" | "video">
  outputMediaType: "image" | "video"
  width: number
  height: number
  aspectRatio: "4:5" | "9:16"
  minimumMediaCount: number
  maximumMediaCount: number
  renderingRequired: boolean
  captionRequired: boolean
  captionSeparate: boolean
  coreTextBurnedIntoMedia: boolean
  deterministicLogoAllowed: boolean
  safeZoneRules: string
  approvalRequirement: string
  schedulingRequirement: string
  publisherPath: "image" | "carousel" | "reel" | "story"
}

/**
 * The authoritative delivery registry for generation, validation, rendering,
 * review, scheduling, and publishing. Objectives never select a renderer.
 */
export const INSTAGRAM_FORMAT_CONTRACT = Object.freeze({
  feed_single: Object.freeze({
    id: "feed_single",
    legacyId: "single_image",
    label: "Instagram Feed Post",
    allowedSourceMedia: ["image"] as const,
    outputMediaType: "image",
    width: 1080,
    height: 1350,
    aspectRatio: "4:5",
    minimumMediaCount: 1,
    maximumMediaCount: 1,
    renderingRequired: true,
    captionRequired: true,
    captionSeparate: true,
    coreTextBurnedIntoMedia: false,
    deterministicLogoAllowed: true,
    safeZoneRules: "Property photography remains clean; the separate caption is never painted into pixels.",
    approvalRequirement: "A rendered 1080×1350 image and complete separate caption are required.",
    schedulingRequirement: "A valid rendered 4:5 image is required.",
    publisherPath: "image",
  }),
  carousel: Object.freeze({
    id: "carousel",
    legacyId: "carousel",
    label: "Instagram Carousel",
    allowedSourceMedia: ["image"] as const,
    outputMediaType: "image",
    width: 1080,
    height: 1350,
    aspectRatio: "4:5",
    minimumMediaCount: 2,
    maximumMediaCount: 10,
    renderingRequired: true,
    captionRequired: true,
    captionSeparate: true,
    coreTextBurnedIntoMedia: false,
    deterministicLogoAllowed: true,
    safeZoneRules: "Each ordered child uses a clean 4:5 property image; caption remains separate.",
    approvalRequirement: "2–10 ordered rendered 1080×1350 image children and one complete caption are required.",
    schedulingRequirement: "Every selected child must resolve to its matching rendered image in approved order.",
    publisherPath: "carousel",
  }),
  story: Object.freeze({
    id: "story",
    legacyId: "story",
    label: "Instagram Story",
    allowedSourceMedia: ["image"] as const,
    outputMediaType: "image",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    minimumMediaCount: 1,
    maximumMediaCount: 1,
    renderingRequired: true,
    captionRequired: false,
    captionSeparate: false,
    coreTextBurnedIntoMedia: true,
    deterministicLogoAllowed: true,
    safeZoneRules: "Deterministic Story copy and logo stay inside named mobile safe zones.",
    approvalRequirement: "A rendered 1080×1920 Story with concise visual copy is required.",
    schedulingRequirement: "A valid rendered 9:16 Story image is required; metadata-only Stories cannot schedule.",
    publisherPath: "story",
  }),
  reel: Object.freeze({
    id: "reel",
    legacyId: "reel",
    label: "Instagram Reel",
    allowedSourceMedia: ["image", "video"] as const,
    outputMediaType: "video",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    minimumMediaCount: 1,
    maximumMediaCount: 12,
    renderingRequired: true,
    captionRequired: true,
    captionSeparate: true,
    coreTextBurnedIntoMedia: true,
    deterministicLogoAllowed: true,
    safeZoneRules: "Use the controlled Reel mobile-safe layout for concise deterministic overlays only.",
    approvalRequirement: "A rendered 1080×1920 H.264/yuv420p MP4 and separate caption are required.",
    schedulingRequirement: "The approved current Reel version must have a rendered MP4.",
    publisherPath: "reel",
  }),
} satisfies Record<InstagramFormatId, InstagramFormatContract>)

/**
 * Accepts a canonical format or one explicit historic database type. There is
 * intentionally no fallback: values outside the finite mapping fail fast.
 */
export function getInstagramFormat(formatOrLegacyType: InstagramFormatId | MarketingContentType): InstagramFormatContract {
  const format = Object.hasOwn(INSTAGRAM_FORMAT_CONTRACT, formatOrLegacyType)
    ? formatOrLegacyType as InstagramFormatId
    : legacyContractForContentType(formatOrLegacyType as MarketingContentType).format
  const contract = INSTAGRAM_FORMAT_CONTRACT[format]
  if (!contract) throw new Error(`Unsupported Marketing delivery format: ${String(formatOrLegacyType)}.`)
  return contract
}
