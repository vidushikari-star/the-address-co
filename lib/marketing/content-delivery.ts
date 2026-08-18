import type { MarketingAsset, MarketingContent } from "@/lib/marketing/types"
import { getInstagramFormat, type InstagramFormatId } from "@/lib/marketing/instagram-format"
import { StoryCompositionSchema } from "@/lib/marketing/schemas"
import { storyLayoutError } from "@/lib/marketing/story-layout"

function stableAssets(assets: MarketingAsset[]) {
  return [...assets].sort((left, right) =>
    Number(left.sortOrder ?? 0) - Number(right.sortOrder ?? 0) ||
    String(left.createdAt ?? "").localeCompare(String(right.createdAt ?? "")) ||
    String(left.id ?? "").localeCompare(String(right.id ?? ""))
  )
}

/** The deterministic default for a newly created Carousel; videos are never selected. */
export function defaultCarouselImageAssets(assets: MarketingAsset[]) {
  const images = stableAssets(assets).filter(asset =>
    asset.kind === "original_reference" &&
    asset.mediaType === "image" &&
    typeof asset.sourceUrl === "string" &&
    /^https:\/\//i.test(asset.sourceUrl)
  )
  const cover = images.find(asset => asset.metadata?.isCover === true)
  return (cover
    ? [cover, ...images.filter(asset => asset.id !== cover.id)]
    : images
  ).slice(0, 10)
}

function selectedAssetIds(content: Pick<MarketingContent, "composition">) {
  const composition = content.composition as { selectedAssetIds?: unknown }
  return Array.isArray(composition.selectedAssetIds)
    ? composition.selectedAssetIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : []
}

/**
 * The one authoritative resolver for Carousel review and publication.
 *
 * A Carousel's composition stores the ordered membership of the existing
 * content-to-asset relation. Older records did not have that field; for those
 * records only, retain the already-snapshotted content assets in their stored
 * order rather than looking up every current property image. The caller must
 * validate the returned set before use: returning a legacy video here lets us
 * surface a repairable validation error instead of silently dropping media.
 */
export function getOrderedCarouselMedia(
  content: Pick<MarketingContent, "composition">,
  assets: MarketingAsset[],
) {
  const originals = stableAssets(assets).filter(asset =>
    asset.kind === "original_reference" &&
    (asset.mediaType === "image" || asset.mediaType === "video") &&
    Boolean(asset.sourceUrl)
  )
  const selected = selectedAssetIds(content)
  if (!selected.length) return originals

  const byId = new Map(originals.map(asset => [asset.id, asset]))
  return selected.map(id => byId.get(id)).filter((asset): asset is MarketingAsset => Boolean(asset))
}

/** @deprecated Use getOrderedCarouselMedia for new code. */
export const carouselAssets = getOrderedCarouselMedia

/** A human-readable, safe explanation for an invalid ordered Carousel set. */
export function carouselAssetValidationError(
  content: Pick<MarketingContent, "composition">,
  assets: MarketingAsset[],
) {
  const selected = selectedAssetIds(content)
  if (selected.length && new Set(selected).size !== selected.length) {
    return "Carousel media contains duplicate selected assets."
  }

  const media = getOrderedCarouselMedia(content, assets)
  if (selected.length && media.length !== selected.length) {
    return `Carousel cannot continue because ${selected.length - media.length} selected image${selected.length - media.length === 1 ? "" : "s"} could not be resolved.`
  }
  if (media.length < 2 || media.length > 10) {
    return "A Carousel requires 2–10 selected images."
  }
  if (media.some(asset => asset.mediaType === "video")) {
    return "This Carousel contains unsupported video media. Remove the video before continuing."
  }
  if (media.some(asset => asset.mediaType !== "image")) {
    return "This Carousel contains unsupported non-image media. Remove it before continuing."
  }
  if (media.some(asset => !asset.sourceUrl || !/^https:\/\//i.test(asset.sourceUrl))) {
    return "Every selected Carousel image must have an accessible HTTPS source URL before continuing."
  }
  return null
}

export function contentRequiresRendering(content: Pick<MarketingContent, "contentType" | "composition">) {
  return getInstagramFormat(content.contentType).renderingRequired
}

function compositionRecord(content: Pick<MarketingContent, "composition">) {
  return content.composition && typeof content.composition === "object"
    ? content.composition as Record<string, unknown>
    : {}
}

function matchingRenderedAssets(input: {
  content: Pick<MarketingContent, "contentType" | "composition" | "activeReelVersionId">
  assets: MarketingAsset[]
  format: InstagramFormatId
}) {
  const composition = compositionRecord(input.content)
  const renderToken = typeof composition.renderToken === "string" ? composition.renderToken : null
  return stableAssets(input.assets).filter(asset => {
    if (asset.kind !== "rendered_media" || asset.mediaType !== getInstagramFormat(input.content.contentType).outputMediaType || !asset.storagePath) return false
    if (input.format === "reel") return asset.storagePath.toLowerCase().endsWith(".mp4") &&
      (!input.content.activeReelVersionId || asset.metadata.reelVersionId === input.content.activeReelVersionId)
    return Boolean(renderToken && asset.metadata.renderToken === renderToken && asset.metadata.instagramFormat === input.format)
  })
}

export function publishableAssets(content: Pick<MarketingContent, "contentType" | "composition" | "activeReelVersionId">, assets: MarketingAsset[]) {
  const format = getInstagramFormat(content.contentType)
  const rendered = matchingRenderedAssets({ content, assets, format: format.id })
  if (format.id !== "carousel") return rendered.slice(0, format.maximumMediaCount)

  const selected = getOrderedCarouselMedia(content, assets)
  const bySourceId = new Map(rendered.map(asset => [asset.metadata.sourceAssetId, asset]))
  return selected.map(asset => bySourceId.get(asset.id)).filter((asset): asset is MarketingAsset => Boolean(asset))
}

export function hasPublishableMedia(content: Pick<MarketingContent, "contentType" | "composition" | "activeReelVersionId">, assets: MarketingAsset[]) {
  const media = publishableAssets(content, assets)
  const format = getInstagramFormat(content.contentType)
  return media.length >= format.minimumMediaCount && media.length <= format.maximumMediaCount &&
    media.every(asset => asset.mediaType === format.outputMediaType)
}

/** A format-aware, actionable gate used by approval, schedule, and publish. */
export function validateInstagramPublishability(
  content: Pick<MarketingContent, "contentType" | "composition" | "activeReelVersionId" | "caption" | "hashtags">,
  assets: MarketingAsset[],
) {
  const format = getInstagramFormat(content.contentType)
  if (format.captionRequired && ![content.caption, content.hashtags.join(" ")].filter(Boolean).join(" ").trim()) {
    return "Complete the separate Instagram caption before continuing."
  }
  if (format.id === "carousel") {
    const sourceError = carouselAssetValidationError(content, assets)
    if (sourceError) return sourceError
  }
  if (format.id === "story") {
    const parsed = StoryCompositionSchema.safeParse(content.composition)
    if (!parsed.success) return "Story has no valid visual composition. Generate or edit its Story creative before continuing."
    const layoutError = storyLayoutError(parsed.data.storyCopy)
    if (layoutError) return layoutError
    const source = assets.find(asset => asset.id === parsed.data.sourceAssetId && asset.kind === "original_reference")
    if (!source || source.mediaType !== "image") return "Story source must be an available property image."
  }
  const media = publishableAssets(content, assets)
  if (media.length < format.minimumMediaCount || media.length > format.maximumMediaCount) {
    return format.id === "story"
      ? "Story has no valid rendered 9:16 creative."
      : format.id === "reel"
        ? "Rendered Reel MP4 is missing."
        : format.id === "carousel"
          ? "Every selected Carousel image needs a matching rendered 4:5 child."
          : "Feed image is outside the required rendered 4:5 output format."
  }
  const invalidOutput = media.find(asset =>
    asset.mediaType !== format.outputMediaType ||
    asset.metadata?.width !== format.width ||
    asset.metadata?.height !== format.height ||
    asset.metadata?.aspectRatio !== format.aspectRatio ||
    (format.id === "reel" && asset.metadata?.format !== "1080x1920-h264-mp4")
  )
  if (invalidOutput) {
    return format.id === "reel"
      ? "Rendered Reel must be a 1080×1920 H.264/yuv420p MP4."
      : `${format.label} output must be ${format.width}×${format.height} (${format.aspectRatio}).`
  }
  return null
}
