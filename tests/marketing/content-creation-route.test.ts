import { beforeEach, describe, expect, it, vi } from "vitest"

const repository = vi.hoisted(() => ({
  getPropertySnapshot: vi.fn(),
  getContentByIdempotencyKey: vi.fn(),
  getInstagramAccount: vi.fn(),
  getContentById: vi.fn(),
  createContent: vi.fn(),
  addSourceAssets: vi.fn(),
  updateContent: vi.fn(),
  addAuditLog: vi.fn(),
}))

vi.mock("@/lib/auth/marketing", () => ({
  requireMarketingApiAccess: vi.fn().mockResolvedValue({ user: { id: "admin-1" }, error: null, status: null }),
}))
vi.mock("@/lib/marketing/repositories/marketing-repository", () => ({ MarketingRepository: repository }))

import { PATCH, POST } from "@/app/api/marketing/content/route"

const propertyId = "1e149a39-7321-42d1-900c-7389c0da37a3"
const requestId = "b2041f1f-89e9-4a59-a8de-00169502f523"

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
      { id: "image-3", type: "image", url: "https://images.example/3.jpg", isCover: false },
    ],
  })
  repository.getContentByIdempotencyKey.mockResolvedValue(null)
  repository.getInstagramAccount.mockResolvedValue(null)
  repository.createContent.mockResolvedValue({ id: "content-1", contentType: "carousel", composition: {} })
  repository.getContentById.mockResolvedValue({ content: { id: "content-1", contentType: "carousel", status: "draft" }, assets: [] })
  repository.addSourceAssets.mockResolvedValue([0, 1, 2].map(index => ({
    id: `asset-image-${index}`,
    kind: "original_reference",
    mediaType: "image",
    sourceUrl: `https://images.example/${index}.jpg`,
    sortOrder: index,
  })).concat({
    id: "asset-video",
    kind: "original_reference",
    mediaType: "video",
    sourceUrl: "https://images.example/tour.mp4",
    sortOrder: 3,
  }))
  repository.updateContent.mockResolvedValue({ id: "content-1", contentType: "carousel" })
  repository.addAuditLog.mockResolvedValue(undefined)
})

describe("POST /api/marketing/content", () => {
  it("selects only Carousel images in deterministic order without mutating CRM media", async () => {
    const response = await POST(new Request("http://localhost/api/marketing/content", {
      method: "POST",
      body: JSON.stringify({ propertyId, contentType: "carousel", creativeDirection: "luxury_editorial", idempotencyKey: requestId }),
    }))

    expect(response.status).toBe(202)
    expect(repository.addSourceAssets).toHaveBeenCalledWith("content-1", expect.objectContaining({ id: propertyId }))
    expect(repository.updateContent).toHaveBeenCalledWith("content-1", {
      composition: expect.objectContaining({
        format: "carousel",
        selectedAssetIds: ["asset-image-0", "asset-image-1", "asset-image-2"],
      }),
    }, "admin-1")
    expect(repository.addAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "content.created" }))
  })

  it("does not create a Carousel from a gallery with fewer than two eligible images", async () => {
    repository.getPropertySnapshot.mockResolvedValue({
      id: propertyId,
      title: "Villa Verde",
      amenities: [],
      features: [],
      media: [
        { id: "image-1", type: "image", url: "https://images.example/1.jpg", isCover: true },
        { id: "video-1", type: "video", url: "https://images.example/tour.mp4", isCover: false },
      ],
    })

    const response = await POST(new Request("http://localhost/api/marketing/content", {
      method: "POST",
      body: JSON.stringify({ propertyId, contentType: "carousel", creativeDirection: "luxury_editorial", idempotencyKey: requestId }),
    }))

    expect(response.status).toBe(409)
    expect(repository.createContent).not.toHaveBeenCalled()
  })

  it("continues to make property video available when creating a Reel", async () => {
    repository.createContent.mockResolvedValueOnce({ id: "content-1", contentType: "reel", composition: {} })
    const response = await POST(new Request("http://localhost/api/marketing/content", {
      method: "POST",
      body: JSON.stringify({ propertyId, contentType: "reel", creativeDirection: "luxury_editorial", idempotencyKey: requestId }),
    }))

    expect(response.status).toBe(202)
    expect(repository.addSourceAssets).toHaveBeenCalledWith("content-1", expect.objectContaining({
      media: expect.arrayContaining([expect.objectContaining({ type: "video" })]),
    }))
  })

  it("rejects a manipulated generic content update that tries to replace Carousel media", async () => {
    const response = await PATCH(new Request("http://localhost/api/marketing/content", {
      method: "PATCH",
      body: JSON.stringify({ id: "content-1", composition: { selectedAssetIds: ["asset-video"] } }),
    }))

    expect(response.status).toBe(409)
    expect(repository.updateContent).not.toHaveBeenCalled()
  })
})
