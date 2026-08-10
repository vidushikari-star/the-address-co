import type { MarketingAsset, PropertyFactSnapshot } from "@/lib/marketing/types"

export type MediaAnalysis = {
  assetId: string
  mediaType: "image" | "video"
  score: number
  likelyScene: "cover" | "property" | "video"
  recommendedForReel: boolean
  reason: string
}

/**
 * Selection is intentionally deterministic until a vision provider is enabled.
 * It preserves originals and gives a renderer safe, explicit input IDs only.
 */
export class MediaAnalysisService {
  static analyze(
    property: PropertyFactSnapshot,
    assets: MarketingAsset[]
  ): MediaAnalysis[] {
    const byPropertyMedia = new Map(property.media.map(media => [media.id, media]))

    return assets
      .filter(asset => asset.kind === "original_reference")
      .map((asset, index) => {
        const source = asset.propertyImageId
          ? byPropertyMedia.get(asset.propertyImageId)
          : undefined
        const isCover = source?.isCover ?? Boolean(asset.metadata.isCover)
        const mediaType: MediaAnalysis["mediaType"] = asset.mediaType === "video" ? "video" : "image"

        const likelyScene: MediaAnalysis["likelyScene"] = isCover
          ? "cover"
          : mediaType === "video" ? "video" : "property"

        return {
          assetId: asset.id,
          mediaType,
          score: (isCover ? 100 : 70) + (mediaType === "video" ? 10 : 0) - index,
          likelyScene,
          recommendedForReel: true,
          reason: isCover ? "Selected as the CRM cover asset." : "Selected from original property media.",
        }
      })
      .sort((left, right) => right.score - left.score)
  }
}
