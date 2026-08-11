import type { MarketingAsset, MarketingContent } from "@/lib/marketing/types"

/**
 * The current studio only creates multi-scene video compositions for Reels.
 * Other content types can publish their original CRM media directly unless a
 * future branded-derivative workflow explicitly adds a render requirement.
 */
export function contentRequiresRendering(content: Pick<MarketingContent, "contentType" | "composition">) {
  if (content.contentType === "reel") return true

  const composition = content.composition as { format?: unknown; scenes?: unknown; audio?: { type?: unknown } }
  return composition.format === "reel" ||
    (Array.isArray(composition.scenes) && composition.scenes.length > 1) ||
    composition.audio?.type === "royalty_free" || composition.audio?.type === "original"
}

export function publishableAssets(content: Pick<MarketingContent, "contentType" | "composition" | "activeReelVersionId">, assets: MarketingAsset[]) {
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
  const media = publishableAssets(content, assets)
  if (contentRequiresRendering(content)) return media.some(asset => asset.mediaType === "video")
  if (content.contentType === "carousel") return media.length >= 2 && media.length <= 10
  if (content.contentType === "story") return media.some(asset => asset.mediaType === "image" || asset.mediaType === "video")
  return media.some(asset => asset.mediaType === "image")
}
