import type { MarketingAsset, MarketingContent } from "@/lib/marketing/types"

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

/**
 * The current studio only creates multi-scene video compositions for Reels.
 * Other content types can publish their original CRM media directly unless a
 * future branded-derivative workflow explicitly adds a render requirement.
 */
export function contentRequiresRendering(content: Pick<MarketingContent, "contentType" | "composition">) {
  // A multi-asset Carousel is still a collection of original media. Its
  // selectedAssetIds must never make it inherit the Reel/FFmpeg workflow.
  return content.contentType === "reel"
}

export function publishableAssets(content: Pick<MarketingContent, "contentType" | "composition" | "activeReelVersionId">, assets: MarketingAsset[]) {
  if (content.contentType === "carousel") return getOrderedCarouselMedia(content, assets)

  return contentRequiresRendering(content)
    // Railway validates the encoded output with FFprobe before creating this
    // asset. Publishing only accepts that private, completed MP4; it never
    // uploads an original property video as a substitute for a Reel render.
    ? assets.filter(asset => asset.kind === "rendered_media" && asset.mediaType === "video" && asset.storagePath?.toLowerCase().endsWith(".mp4") && (
        !content.activeReelVersionId || asset.metadata.reelVersionId === content.activeReelVersionId
      ))
    : assets.filter(asset => asset.kind === "original_reference" && Boolean(asset.sourceUrl))
}

export function hasPublishableMedia(content: Pick<MarketingContent, "contentType" | "composition" | "activeReelVersionId">, assets: MarketingAsset[]) {
  if (content.contentType === "carousel") return !carouselAssetValidationError(content, assets)

  const media = publishableAssets(content, assets)
  if (contentRequiresRendering(content)) return media.some(asset => asset.mediaType === "video")
  if (content.contentType === "story") return media.some(asset => asset.mediaType === "image" || asset.mediaType === "video")
  return media.some(asset => asset.mediaType === "image")
}
