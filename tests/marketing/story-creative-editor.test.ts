import { describe, expect, it } from "vitest"

import { storySourceImageOptions } from "@/components/marketing/story-creative-editor"
import type { MarketingAsset } from "@/lib/marketing/types"

const base = {
  contentId: "content-1",
  sortOrder: 0,
  createdAt: "2026-08-18T00:00:00.000Z",
  metadata: {},
}

describe("Story source image picker", () => {
  it("offers only original property images with visual, ordinal labels", () => {
    const options = storySourceImageOptions([
      { ...base, id: "property-image-uuid", kind: "original_reference", mediaType: "image", sourceUrl: "https://images.example/one.jpg" },
      { ...base, id: "property-video-uuid", kind: "original_reference", mediaType: "video", sourceUrl: "https://images.example/one.mp4" },
      { ...base, id: "rendered-story-uuid", kind: "rendered_media", mediaType: "image", storagePath: "rendered/story.jpg" },
    ] as MarketingAsset[])

    expect(options).toHaveLength(1)
    expect(options[0]).toMatchObject({ label: "Image 1", asset: { id: "property-image-uuid" } })
    expect(options[0].label).not.toContain("uuid")
  })
})
