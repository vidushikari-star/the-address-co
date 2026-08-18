import { describe, expect, it } from "vitest"

import { carouselAssetValidationError, carouselAssets, contentRequiresRendering, hasPublishableMedia, publishableAssets, validateInstagramPublishability } from "@/lib/marketing/content-delivery"
import type { MarketingAsset, MarketingContent } from "@/lib/marketing/types"

const token = "1e149a39-7321-42d1-900c-7389c0da37a3"
const id = "b2041f1f-89e9-4a59-a8de-00169502f523"
const storySourceId = "34d1e601-18e9-4caa-9cc4-8af4c11888f1"

function source(id: string, sortOrder: number): MarketingAsset {
  return { id, contentId: "content-1", kind: "original_reference", mediaType: "image", sourceUrl: `https://images.example/${id}.jpg`, metadata: { isCover: id === "cover" }, sortOrder, createdAt: "2026-08-10T00:00:00.000Z" }
}

function rendered(sourceAssetId: string, sortOrder: number): MarketingAsset {
  return { id: `rendered-${sourceAssetId}`, contentId: "content-1", kind: "rendered_media", mediaType: "image", storagePath: `${sourceAssetId}.jpg`, metadata: { instagramFormat: "carousel", renderToken: token, sourceAssetId, width: 1080, height: 1350, aspectRatio: "4:5" }, sortOrder, createdAt: "2026-08-10T00:00:00.000Z" }
}

function carousel(selectedAssetIds: string[]): Pick<MarketingContent, "contentType" | "composition" | "activeReelVersionId" | "caption" | "hashtags"> {
  return { contentType: "carousel", activeReelVersionId: null, composition: { format: "carousel", selectedAssetIds, renderToken: token }, caption: "A caption", hashtags: ["#tag"] }
}

describe("Instagram format delivery", () => {
  it("keeps exact Carousel source order and publishes only matching 4:5 derivatives in that order", () => {
    const originals = [source("three", 3), source("cover", 0), source("one", 1), source("two", 2), source("unused", 4)]
    const content = carousel(["cover", "two", "one", "three"])
    const assets = [...originals, rendered("one", 2), rendered("three", 3), rendered("cover", 0), rendered("two", 1)]

    expect(carouselAssets(content, assets).map(item => item.id)).toEqual(["cover", "two", "one", "three"])
    expect(publishableAssets(content, assets).map(item => item.metadata.sourceAssetId)).toEqual(["cover", "two", "one", "three"])
    expect(hasPublishableMedia(content, assets)).toBe(true)
    expect(contentRequiresRendering(content)).toBe(true)
    expect(validateInstagramPublishability(content, assets)).toBeNull()
  })

  it("does not silently substitute all property media when an explicit Carousel relation is broken", () => {
    const content = carousel(["cover", "missing"])
    const assets = [source("cover", 0), source("unrelated", 1)]
    expect(carouselAssets(content, assets).map(item => item.id)).toEqual(["cover"])
    expect(carouselAssetValidationError(content, assets)).toBe("Carousel cannot continue because 1 selected image could not be resolved.")
    expect(hasPublishableMedia(content, assets)).toBe(false)
  })

  it("rejects legacy mixed-media Carousels before a rendered child can hide the bad source", () => {
    const content = carousel(["cover", "video"])
    const assets = [source("cover", 0), { ...source("video", 1), mediaType: "video" as const, sourceUrl: "https://images.example/video.mp4" }]
    expect(carouselAssetValidationError(content, assets)).toBe("This Carousel contains unsupported video media. Remove the video before continuing.")
    expect(validateInstagramPublishability(content, assets)).toContain("unsupported video")
  })

  it("blocks a Story with only text metadata until its matching 1080×1920 derived creative exists", () => {
    const story: Pick<MarketingContent, "contentType" | "composition" | "activeReelVersionId" | "caption" | "hashtags"> = {
      contentType: "story", activeReelVersionId: null, caption: null, hashtags: [],
      composition: { propertyId: id, format: "story", aspectRatio: "9:16", sourceAssetId: storySourceId, storyCopy: { headline: "Villa Verde", supportingLine: "Parra", highlights: ["Four bedrooms"], priceLine: "", cta: "Arrange a viewing" }, layoutStyle: "editorial_panel", typographyStyle: "modern_sans", renderToken: token, logo: { enabled: false, placement: "top_right", scale: "small", opacity: 0.8 } },
    }
    const sourceAsset = source(storySourceId, 0)
    expect(validateInstagramPublishability(story, [sourceAsset])).toBe("Story must be rendered before approval.")
    const output = { ...rendered(storySourceId, 0), metadata: { instagramFormat: "story", renderToken: token, sourceAssetId: storySourceId, width: 1080, height: 1920, aspectRatio: "9:16" } }
    expect(validateInstagramPublishability(story, [sourceAsset, output])).toBeNull()
  })

  it("rejects a prior Story derivative after its source or creative token changes", () => {
    const currentSourceId = "e5c7daaf-0b33-4988-97a2-f1b6855404cb"
    const story: Pick<MarketingContent, "contentType" | "composition" | "activeReelVersionId" | "caption" | "hashtags"> = {
      contentType: "story", activeReelVersionId: null, caption: null, hashtags: [],
      composition: { propertyId: id, format: "story", aspectRatio: "9:16", sourceAssetId: currentSourceId, storyCopy: { headline: "Villa Verde", supportingLine: "Parra", highlights: [], priceLine: "", cta: "Arrange a viewing" }, layoutStyle: "editorial_panel", typographyStyle: "modern_sans", renderToken: "4e27cccd-c24c-4e4d-9789-a505617e1fb1", logo: { enabled: false, placement: "top_right", scale: "small", opacity: 0.8 } },
    }
    const oldOutput = { ...rendered(storySourceId, 0), metadata: { instagramFormat: "story", renderToken: token, sourceAssetId: storySourceId, width: 1080, height: 1920, aspectRatio: "9:16" } }

    expect(validateInstagramPublishability(story, [source(currentSourceId, 1), oldOutput]))
      .toBe("Story creative changed after the last render. Render the updated Story before approval.")
  })

  it("reports a true missing Story headline instead of a generic render error", () => {
    const story: Pick<MarketingContent, "contentType" | "composition" | "activeReelVersionId" | "caption" | "hashtags"> = {
      contentType: "story", activeReelVersionId: null, caption: null, hashtags: [],
      composition: { format: "story", storyCopy: { headline: "", cta: "Arrange a viewing" } },
    }

    expect(validateInstagramPublishability(story, [])).toBe("Story headline is required.")
  })
})
