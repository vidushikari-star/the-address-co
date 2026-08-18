import type {
  MarketingContentType,
} from "@/lib/marketing/types"

export type InstagramFormatId =
  | "single_image"
  | "carousel"
  | "reel"
  | "story"

export type InstagramFormatContract = {
  id: InstagramFormatId
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
  safeZoneRules: string
  approvalRequirement: string
  schedulingRequirement: string
  publisherPath: "image" | "carousel" | "reel" | "story"
}

/**
 * The only format contract used by generation, render validation, scheduling,
 * preview, and Meta publishing. Other Marketing labels intentionally map to a
 * single-image Instagram delivery rather than inventing a fifth delivery type.
 */
export const INSTAGRAM_FORMAT_CONTRACT = Object.freeze({
  single_image: Object.freeze({
    id: "single_image",
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
    safeZoneRules: "Optional concise branded overlay only; the feed caption stays separate.",
    approvalRequirement: "A rendered 1080×1350 image and complete separate caption are required.",
    schedulingRequirement: "A valid rendered 4:5 image is required.",
    publisherPath: "image",
  }),
  carousel: Object.freeze({
    id: "carousel",
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
    safeZoneRules: "Each ordered child uses the same 4:5 image canvas; only concise slide overlays are permitted.",
    approvalRequirement: "2–10 ordered rendered 1080×1350 image children and one complete caption are required.",
    schedulingRequirement: "Every selected child must resolve to its matching rendered image in the approved order.",
    publisherPath: "carousel",
  }),
  reel: Object.freeze({
    id: "reel",
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
    safeZoneRules: "Use the existing Reel mobile-safe layout for concise overlays only.",
    approvalRequirement: "A rendered 1080×1920 H.264/yuv420p MP4 and separate caption are required.",
    schedulingRequirement: "The approved current Reel version must have a rendered MP4.",
    publisherPath: "reel",
  }),
  story: Object.freeze({
    id: "story",
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
    safeZoneRules: "Headline, supporting line, highlights, price, CTA, and logo must stay inside named Story safe zones.",
    approvalRequirement: "A rendered 1080×1920 Story with its concise visual copy is required.",
    schedulingRequirement: "A valid rendered 9:16 Story image is required; metadata-only Stories cannot schedule.",
    publisherPath: "story",
  }),
} satisfies Record<InstagramFormatId, InstagramFormatContract>)

export function getInstagramFormat(
  contentType: MarketingContentType
): InstagramFormatContract {
  if (contentType === "carousel") {
    return INSTAGRAM_FORMAT_CONTRACT.carousel
  }

  if (contentType === "reel") {
    return INSTAGRAM_FORMAT_CONTRACT.reel
  }

  if (contentType === "story") {
    return INSTAGRAM_FORMAT_CONTRACT.story
  }

  return INSTAGRAM_FORMAT_CONTRACT.single_image
}
