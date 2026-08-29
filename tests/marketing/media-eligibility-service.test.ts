import { describe, expect, it } from "vitest"

import { MediaEligibilityService } from "@/lib/marketing/services/media-eligibility-service"
import type { MarketingAsset } from "@/lib/marketing/types"

function asset(id: string, mediaType: MarketingAsset["mediaType"], sortOrder: number, metadata: Record<string, unknown> = {}): MarketingAsset {
  return {
    id,
    contentId: "content-1",
    propertyImageId: id,
    kind: "original_reference",
    mediaType,
    sourceUrl: `https://project.supabase.co/storage/v1/object/sign/${id}.${mediaType === "video" ? "mp4" : "jpg"}`,
    metadata,
    sortOrder,
    createdAt: "2026-08-28T00:00:00.000Z",
  }
}

describe("MediaEligibilityService", () => {
  it("accepts exactly one verified still image for Feed and preserves the selected ID", () => {
    const image = asset("image-a", "image", 0, { probedMediaType: "image", mimeType: "image/jpeg", isCover: true })
    expect(MediaEligibilityService.validate({ format: "feed_single", selection: { mode: "curated", assetIds: [image.id] }, assets: [image] })).toMatchObject({ error: null, assets: [image] })
  })

  it("rejects Feed video before generation or rendering", () => {
    const video = asset("video-a", "video", 0, { probedMediaType: "video", mimeType: "video/mp4" })
    expect(MediaEligibilityService.validate({ format: "feed_single", selection: { mode: "curated", assetIds: [video.id] }, assets: [video] }).error).toContain("still image")
  })

  it("accepts ordered 2–10 image Carousels and rejects video or invalid counts", () => {
    const images = [asset("cover", "image", 2, { isCover: true }), asset("detail", "image", 0)]
    const automatic = MediaEligibilityService.automaticSelection("carousel", images)
    expect(automatic.assetIds).toEqual(["cover", "detail"])
    expect(MediaEligibilityService.validate({ format: "carousel", selection: automatic, assets: images }).error).toBeNull()
    expect(MediaEligibilityService.validate({ format: "carousel", selection: { mode: "curated", assetIds: ["cover"] }, assets: images }).error).toContain("2–10")
    expect(MediaEligibilityService.validate({ format: "carousel", selection: { mode: "curated", assetIds: ["cover", "video"] }, assets: [...images, asset("video", "video", 3)] }).error).toContain("still images")
  })

  it("keeps Story image-only and permits verified image/video Reel sources", () => {
    const image = asset("image-a", "image", 0, { probedMediaType: "image" })
    const video = asset("video-a", "video", 1, { probedMediaType: "video", codec: "h264", container: "mp4" })
    expect(MediaEligibilityService.validate({ format: "story", selection: { mode: "curated", assetIds: [image.id] }, assets: [image] }).error).toBeNull()
    expect(MediaEligibilityService.validate({ format: "story", selection: { mode: "curated", assetIds: [video.id] }, assets: [video] }).error).toContain("still image")
    expect(MediaEligibilityService.validate({ format: "reel", selection: { mode: "curated", assetIds: [image.id, video.id] }, assets: [image, video] }).error).toBeNull()
  })

  it("rejects spoofed, missing, and deleted selected assets actionably", () => {
    const spoofed = asset("spoofed", "image", 0, { probedMediaType: "video", mimeType: "video/mp4" })
    const deleted = asset("deleted", "image", 1, { available: false })
    expect(MediaEligibilityService.validate({ format: "feed_single", selection: { mode: "curated", assetIds: [spoofed.id] }, assets: [spoofed] }).error).toContain("type verification")
    expect(MediaEligibilityService.validate({ format: "feed_single", selection: { mode: "curated", assetIds: [deleted.id] }, assets: [deleted] }).error).toContain("no longer available")
    expect(MediaEligibilityService.validate({ format: "feed_single", selection: { mode: "curated", assetIds: ["missing"] }, assets: [] }).error).toContain("no longer available")
  })
})
