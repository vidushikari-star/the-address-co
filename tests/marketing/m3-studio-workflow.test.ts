import { describe, expect, it } from "vitest"

import {
  allowedStudioMedia,
  reorderStudioMedia,
  studioSelectionBounds,
  studioSelectionError,
} from "@/components/marketing/create-content-studio"

const media = [
  { id: "image-1", url: "https://images.example/1.jpg", type: "image" as const, isCover: true },
  { id: "image-2", url: "https://images.example/2.jpg", type: "image" as const, isCover: false },
  { id: "video-1", url: "https://images.example/1.mp4", type: "video" as const, isCover: false },
]

describe("M3 Studio media workflow", () => {
  it("keeps video out of Post, Carousel, and Story selection while allowing a Reel sequence", () => {
    expect(allowedStudioMedia("feed_single", media[2]!)).toBe(false)
    expect(allowedStudioMedia("carousel", media[2]!)).toBe(false)
    expect(allowedStudioMedia("story", media[2]!)).toBe(false)
    expect(allowedStudioMedia("reel", media[2]!)).toBe(true)
  })

  it("enforces visual selection counts before the request is sent", () => {
    expect(studioSelectionBounds("feed_single")).toEqual({ minimum: 1, maximum: 1 })
    expect(studioSelectionError("feed_single", ["video-1"], media)).toContain("still property images")
    expect(studioSelectionError("carousel", ["image-1"], media)).toContain("2–10")
    expect(studioSelectionError("story", ["image-1"], media)).toBeNull()
    expect(studioSelectionError("reel", ["video-1", "image-1"], media)).toBeNull()
  })

  it("preserves the user's explicit Carousel and Reel order with accessible move controls", () => {
    expect(reorderStudioMedia(["image-1", "image-2", "video-1"], "video-1", -1))
      .toEqual(["image-1", "video-1", "image-2"])
    expect(reorderStudioMedia(["image-1", "image-2"], "image-1", -1))
      .toEqual(["image-1", "image-2"])
  })
})
