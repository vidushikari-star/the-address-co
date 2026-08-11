import { describe, expect, it } from "vitest"

import { currentRenderedReelVersion, editableReelVersion, reelVersionNeedsRender } from "@/lib/marketing/reel-version-state"
import type { MarketingReelVersion, ReelComposition } from "@/lib/marketing/types"

const composition: ReelComposition = {
  propertyId: "1e149a39-7321-42d1-900c-7389c0da37a3", format: "reel", aspectRatio: "9:16", duration: 10,
  scenes: [], caption: "", hashtags: [], cta: "", coverText: "", audio: { type: "none", label: "Silent Reel" },
}

function version(number: number, status: MarketingReelVersion["status"], overrides: Partial<MarketingReelVersion> = {}): MarketingReelVersion {
  return { id: `version-${number}`, contentId: "content", versionNumber: number, status, isCurrent: false, composition, sourceAssetIds: [], logoSettings: null, audioSettings: composition.audio, renderedAssetId: null, userPrompt: null, lastError: null, createdAt: "2026-08-11T00:00:00.000Z", createdBy: null, approvedAt: null, renderedAt: null, ...overrides }
}

describe("Reel version preview state", () => {
  it("selects the newer unrendered draft as the honest storyboard preview", () => {
    const rendered = version(1, "rendered", { isCurrent: true, renderedAssetId: "asset-v1" })
    const draft = version(2, "draft")
    expect(editableReelVersion([draft, rendered])).toMatchObject({ id: "version-2", status: "draft" })
    expect(reelVersionNeedsRender(draft)).toBe(true)
  })

  it("keeps the previous rendered derivative as the only active scheduling version", () => {
    const rendered = version(1, "rendered", { isCurrent: true, renderedAssetId: "asset-v1" })
    const revised = version(2, "approved")
    expect(currentRenderedReelVersion([revised, rendered])).toMatchObject({ id: "version-1", renderedAssetId: "asset-v1" })
    expect(editableReelVersion([revised, rendered])).toMatchObject({ id: "version-2" })
  })
})
