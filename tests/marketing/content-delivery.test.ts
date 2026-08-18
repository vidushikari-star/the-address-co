import { describe, expect, it } from "vitest"

import { carouselAssetValidationError, carouselAssets, contentRequiresRendering, hasPublishableMedia, publishableAssets } from "@/lib/marketing/content-delivery"
import type { MarketingAsset, MarketingContent } from "@/lib/marketing/types"

function asset(id: string, sortOrder: number): MarketingAsset {
  return {
    id,
    contentId: "content-1",
    kind: "original_reference",
    mediaType: "image",
    sourceUrl: `https://images.example/${id}.jpg`,
    metadata: { isCover: id === "cover" },
    sortOrder,
    createdAt: "2026-08-10T00:00:00.000Z",
  }
}

function carousel(selectedAssetIds: string[]): Pick<MarketingContent, "contentType" | "composition" | "activeReelVersionId"> {
  return {
    contentType: "carousel",
    activeReelVersionId: null,
    composition: { format: "carousel", selectedAssetIds },
  }
}

describe("Carousel content delivery", () => {
  it("keeps the exact persisted selected assets in composition order for review and publishing", () => {
    const assets = [asset("three", 3), asset("cover", 0), asset("one", 1), asset("two", 2), asset("unused", 4)]
    const content = carousel(["cover", "two", "one", "three"])

    expect(carouselAssets(content, assets).map(item => item.id)).toEqual(["cover", "two", "one", "three"])
    expect(publishableAssets(content, assets).map(item => item.id)).toEqual(["cover", "two", "one", "three"])
    expect(hasPublishableMedia(content, assets)).toBe(true)
    expect(contentRequiresRendering(content)).toBe(false)
  })

  it("does not silently substitute all property media when an explicit Carousel relation is broken", () => {
    const content = carousel(["cover", "missing"])
    const assets = [asset("cover", 0), asset("unrelated", 1)]

    expect(carouselAssets(content, assets).map(item => item.id)).toEqual(["cover"])
    expect(carouselAssetValidationError(content, assets)).toBe("Carousel cannot continue because 1 selected image could not be resolved.")
    expect(hasPublishableMedia(content, assets)).toBe(false)
  })

  it("accepts legacy Carousels only from their already-snapshotted content assets in deterministic sort order", () => {
    const content = carousel([])
    const assets = [asset("third", 3), asset("first", 1), asset("second", 2)]

    expect(carouselAssets(content, assets).map(item => item.id)).toEqual(["first", "second", "third"])
  })

  it("detects legacy mixed-media Carousels instead of silently publishing their video", () => {
    const content = carousel(["cover", "video"])
    const assets = [
      asset("cover", 0),
      { ...asset("video", 1), mediaType: "video" as const, sourceUrl: "https://images.example/video.mp4" },
    ]

    expect(carouselAssetValidationError(content, assets)).toBe("This Carousel contains unsupported video media. Remove the video before continuing.")
    expect(hasPublishableMedia(content, assets)).toBe(false)
  })
})
