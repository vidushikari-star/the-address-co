import type { MarketingAsset, MarketingContent } from "@/lib/marketing/types"

function stableAssets(assets: MarketingAsset[]) {
  return [...assets].sort((left, right) =>
    Number(left.sortOrder ?? 0) - Number(right.sortOrder ?? 0) ||
    String(left.createdAt ?? "").localeCompare(String(right.createdAt ?? "")) ||
    String(left.id ?? "").localeCompare(String(right.id ?? ""))
  )
}

function selectedAssetIds(content: Pick<MarketingContent, "composition">) {
  const composition = content.composition as { selectedAssetIds?: unknown }
  return Array.isArray(composition.selectedAssetIds)
    ? composition.selectedAssetIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : []
}

/**
 * A Carousel's composition stores the ordered membership of the existing
 * content-to-asset relation. Older drafts did not have that field; for those
 * records only, retain the already-snapshotted content assets in their stored
 * order rather than looking up every current property image.
 */
export function carouselAssets(
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

/** A human-readable, safe explanation for an invalid ordered Carousel set. */
export function carouselAssetValidationError(
  content: Pick<MarketingContent, "composition">,
  assets: MarketingAsset[],
) {
  const selected = selectedAssetIds(content)
  if (selected.length && new Set(selected).size !== selected.length) {
    return "Carousel media contains duplicate selected assets."
  }

  const media = carouselAssets(content, assets)
  if (selected.length && media.length !== selected.length) {
    return `Carousel cannot be scheduled because ${selected.length - media.length} selected media asset${selected.length - media.length === 1 ? "" : "s"} could not be resolved.`
  }
  if (media.length < 2 || media.length > 10) {
    return "A Carousel requires 2–10 selected image or video assets."
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
  if (content.contentType === "carousel") return carouselAssets(content, assets)

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
