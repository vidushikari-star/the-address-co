import type { MarketingReelVersion } from "@/lib/marketing/types"

/** The newest version whose rendered derivative does not yet exist. */
export function editableReelVersion(versions: MarketingReelVersion[]) {
  return versions.find(version =>
    !version.renderedAssetId && ["draft", "approved", "rendering", "failed"].includes(version.status)
  ) ?? null
}

/** The one version permitted to supply media for future scheduling/publishing. */
export function currentRenderedReelVersion(versions: MarketingReelVersion[]) {
  return versions.find(version => version.isCurrent && version.status === "rendered" && version.renderedAssetId) ?? null
}

export function reelVersionNeedsRender(version: MarketingReelVersion | null) {
  return Boolean(version && !version.renderedAssetId && ["draft", "approved", "failed"].includes(version.status))
}
