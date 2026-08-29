import { getInstagramFormat } from "@/lib/marketing/instagram-format"
import type { MarketingAsset, MarketingFormat, MarketingMediaCapability, MarketingMediaSelection } from "@/lib/marketing/types"

function stableAssets(assets: MarketingAsset[]) {
  return [...assets].sort((left, right) =>
    left.sortOrder - right.sortOrder || left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id)
  )
}

function metadata(asset: MarketingAsset) {
  return asset.metadata && typeof asset.metadata === "object" ? asset.metadata : {}
}

function mediaCapability(asset: MarketingAsset): MarketingMediaCapability {
  const raw = metadata(asset)
  const probed = raw.probedMediaType
  const width = raw.width
  const height = raw.height
  return {
    assetId: asset.id,
    propertyId: typeof raw.propertyId === "string" ? raw.propertyId : null,
    declaredMediaType: asset.mediaType,
    probedMediaType: probed === "image" || probed === "video" ? probed : undefined,
    mimeType: typeof raw.mimeType === "string" ? raw.mimeType : undefined,
    width: typeof width === "number" && width > 0 ? width : undefined,
    height: typeof height === "number" && height > 0 ? height : undefined,
    aspectRatio: typeof width === "number" && typeof height === "number" && width > 0 && height > 0 ? Number((width / height).toFixed(6)) : undefined,
    orientation: typeof width === "number" && typeof height === "number"
      ? width === height ? "square" : width > height ? "landscape" : "portrait"
      : undefined,
    fileSize: typeof raw.fileSize === "number" && raw.fileSize >= 0 ? raw.fileSize : undefined,
    durationSeconds: typeof raw.durationSeconds === "number" && raw.durationSeconds > 0 ? raw.durationSeconds : undefined,
    codec: typeof raw.codec === "string" ? raw.codec : undefined,
    container: typeof raw.container === "string" ? raw.container : undefined,
    available: raw.available !== false && Boolean(asset.sourceUrl || asset.signedUrl),
    sourceFingerprint: typeof raw.sourceFingerprint === "string" ? raw.sourceFingerprint : undefined,
  }
}

function capabilityError(asset: MarketingAsset, format: MarketingFormat) {
  const capability = mediaCapability(asset)
  if (asset.kind !== "original_reference") return "Selected media is not an original property reference."
  if (!capability.available) return "A selected property asset is no longer available. Re-select media before generating or rendering."
  if (capability.declaredMediaType !== "image" && capability.declaredMediaType !== "video") return "Selected media has an unsupported asset type."
  if (capability.probedMediaType && capability.probedMediaType !== capability.declaredMediaType) {
    return "Selected media failed type verification. Re-upload or choose a verified property asset."
  }
  if (capability.mimeType && !capability.mimeType.startsWith(`${capability.declaredMediaType}/`)) {
    return "Selected media MIME metadata does not match its verified asset type."
  }
  const contract = getInstagramFormat(format)
  if (!contract.allowedSourceMedia.includes(capability.declaredMediaType)) {
    return format === "feed_single"
      ? "Feed posts require one verified still image; video is not supported."
      : format === "carousel"
        ? "Carousels require verified still images only; remove video media."
        : format === "story"
          ? "Stories currently require one verified still image."
          : "This media type is not supported by the Reel renderer."
  }
  if (format === "reel" && capability.declaredMediaType === "video" && capability.codec && !["h264", "hevc", "vp8", "vp9", "av1"].includes(capability.codec.toLowerCase())) {
    return "Selected video uses a codec the Reel renderer does not support."
  }
  return null
}

export class MediaEligibilityService {
  static capabilityFor(asset: MarketingAsset) {
    return mediaCapability(asset)
  }

  /** Deterministic temporary recommendation; it never overrides curated media. */
  static automaticSelection(format: MarketingFormat, assets: MarketingAsset[]): MarketingMediaSelection {
    const contract = getInstagramFormat(format)
    const candidates = stableAssets(assets).filter(asset => {
      const error = capabilityError(asset, format)
      return !error && contract.allowedSourceMedia.includes(asset.mediaType as "image" | "video")
    })
    const cover = candidates.find(asset => metadata(asset).isCover === true)
    const ordered = cover ? [cover, ...candidates.filter(asset => asset.id !== cover.id)] : candidates
    return { mode: "automatic", assetIds: ordered.slice(0, contract.maximumMediaCount).map(asset => asset.id) }
  }

  static validate(input: {
    format: MarketingFormat
    selection: MarketingMediaSelection
    assets: MarketingAsset[]
  }): { assets: MarketingAsset[]; error: string | null } {
    const contract = getInstagramFormat(input.format)
    const ids = input.selection.assetIds
    if (!ids.length) {
      const availableVideo = input.assets.some(asset => asset.kind === "original_reference" && asset.mediaType === "video" && metadata(asset).available !== false)
      if (availableVideo && input.format === "feed_single") return { assets: [], error: "Feed posts require one verified still image; video is not supported." }
      if (availableVideo && input.format === "carousel") return { assets: [], error: "Carousels require verified still images only; remove video media." }
      if (availableVideo && input.format === "story") return { assets: [], error: "Stories currently require one verified still image." }
      return { assets: [], error: `${contract.label} requires selected source media before generation.` }
    }
    if (new Set(ids).size !== ids.length) return { assets: [], error: "Selected media contains duplicate assets." }
    if (ids.length < contract.minimumMediaCount || ids.length > contract.maximumMediaCount) {
      const count = contract.minimumMediaCount === contract.maximumMediaCount
        ? `exactly ${contract.minimumMediaCount}`
        : `${contract.minimumMediaCount}–${contract.maximumMediaCount}`
      return { assets: [], error: `${contract.label} requires ${count} selected source asset${contract.maximumMediaCount === 1 ? "" : "s"}.` }
    }
    const byId = new Map(input.assets.map(asset => [asset.id, asset]))
    const selected = ids.map(id => byId.get(id)).filter((asset): asset is MarketingAsset => Boolean(asset))
    if (selected.length !== ids.length) {
      return { assets: [], error: "A selected property asset is no longer available. Re-select media before generating or rendering." }
    }
    const error = selected.map(asset => capabilityError(asset, input.format)).find(Boolean) ?? null
    return { assets: selected, error }
  }

  static assert(input: { format: MarketingFormat; selection: MarketingMediaSelection; assets: MarketingAsset[] }) {
    const result = this.validate(input)
    if (result.error) throw new Error(result.error)
    return result.assets
  }
}
