import { beforeEach, describe, expect, it, vi } from "vitest"

const repository = vi.hoisted(() => ({
  getPropertySnapshot: vi.fn(),
  getInstagramAccount: vi.fn(),
  createContent: vi.fn(),
  addSourceAssets: vi.fn(),
  updateContent: vi.fn(),
  enqueueJob: vi.fn(),
  addAuditLog: vi.fn(),
}))

vi.mock("@/lib/auth/marketing", () => ({
  requireMarketingApiAccess: vi.fn().mockResolvedValue({ user: { id: "admin-1" }, error: null, status: null }),
}))
vi.mock("@/lib/marketing/repositories/marketing-repository", () => ({ MarketingRepository: repository }))

import { POST } from "@/app/api/marketing/assistant/route"

const propertyId = "1e149a39-7321-42d1-900c-7389c0da37a3"

beforeEach(() => {
  vi.clearAllMocks()
  repository.getPropertySnapshot.mockResolvedValue({
    id: propertyId,
    title: "Villa Verde",
    amenities: [],
    features: [],
    media: [
      { id: "image-1", type: "image", url: "https://images.example/1.jpg", isCover: true },
      { id: "video-1", type: "video", url: "https://images.example/tour.mp4", isCover: false },
      { id: "image-2", type: "image", url: "https://images.example/2.jpg", isCover: false },
    ],
  })
  repository.getInstagramAccount.mockResolvedValue(null)
  repository.createContent.mockResolvedValue({ id: "content-1", contentType: "carousel", composition: {} })
  repository.addSourceAssets.mockResolvedValue([
    { id: "asset-image-1", kind: "original_reference", mediaType: "image", sourceUrl: "https://images.example/1.jpg", metadata: { isCover: true }, sortOrder: 0, createdAt: "2026-08-10T00:00:00.000Z" },
    { id: "asset-video", kind: "original_reference", mediaType: "video", sourceUrl: "https://images.example/tour.mp4", metadata: {}, sortOrder: 1, createdAt: "2026-08-10T00:00:00.000Z" },
    { id: "asset-image-2", kind: "original_reference", mediaType: "image", sourceUrl: "https://images.example/2.jpg", metadata: {}, sortOrder: 2, createdAt: "2026-08-10T00:00:00.000Z" },
  ])
  repository.updateContent.mockResolvedValue({ id: "content-1", contentType: "carousel" })
  repository.enqueueJob.mockResolvedValue(undefined)
  repository.addAuditLog.mockResolvedValue(undefined)
})

describe("assistant Carousel creation", () => {
  it("automatically persists only ordered image assets when a prompt requests a Carousel", async () => {
    const response = await POST(new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ propertyId, prompt: "Create an elegant Carousel for this villa" }),
    }))

    expect(response.status).toBe(202)
    expect(repository.updateContent).toHaveBeenCalledWith("content-1", expect.objectContaining({
      composition: expect.objectContaining({ selectedAssetIds: ["asset-image-1", "asset-image-2"] }),
    }), "admin-1")
  })

  it("rejects an assistant Carousel request when the gallery has only one image", async () => {
    repository.getPropertySnapshot.mockResolvedValue({
      id: propertyId, title: "Villa Verde", amenities: [], features: [],
      media: [{ id: "image-1", type: "image", url: "https://images.example/1.jpg", isCover: true }, { id: "video-1", type: "video", url: "https://images.example/tour.mp4", isCover: false }],
    })

    const response = await POST(new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ propertyId, prompt: "Create a Carousel" }),
    }))

    expect(response.status).toBe(409)
    expect(repository.createContent).not.toHaveBeenCalled()
  })
})
