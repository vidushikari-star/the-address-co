import { beforeEach, describe, expect, it, vi } from "vitest"

const repository = vi.hoisted(() => ({
  getPropertySnapshot: vi.fn(),
  getContentByIdempotencyKey: vi.fn(),
  getInstagramAccount: vi.fn(),
  getActiveBrandLogo: vi.fn(),
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
const curatedImageIds = [
  "c2041f1f-89e9-4a59-a8de-00169502f523",
  "d2041f1f-89e9-4a59-a8de-00169502f523",
]
const curatedVideoId = "e2041f1f-89e9-4a59-a8de-00169502f523"

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
  repository.getActiveBrandLogo.mockResolvedValue(null)
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
      body: JSON.stringify({ propertyId, format: "carousel", objective: "interiors", creativeDirection: "luxury_editorial", idempotencyKey: requestId }),
    }))

    expect(response.status).toBe(202)
    expect(repository.addSourceAssets).toHaveBeenCalledWith("content-1", expect.objectContaining({ id: propertyId }))
    expect(repository.updateContent).toHaveBeenCalledWith("content-1", {
      composition: expect.objectContaining({
        format: "carousel",
        selectedAssetIds: ["asset-image-0", "asset-image-1", "asset-image-2"],
        marketingContract: expect.objectContaining({ format: "carousel", objective: "interiors", mediaSelection: { mode: "automatic", assetIds: ["asset-image-0", "asset-image-1", "asset-image-2"] }, brandTreatment: expect.objectContaining({ logo: expect.objectContaining({ enabled: false }) }) }),
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
      body: JSON.stringify({ propertyId, format: "carousel", objective: "interiors", creativeDirection: "luxury_editorial", idempotencyKey: requestId }),
    }))

    expect(response.status).toBe(409)
    expect(repository.createContent).not.toHaveBeenCalled()
  })

  it("continues to make property video available when creating a Reel", async () => {
    repository.createContent.mockResolvedValueOnce({ id: "content-1", contentType: "reel", composition: {} })
    const response = await POST(new Request("http://localhost/api/marketing/content", {
      method: "POST",
      body: JSON.stringify({ propertyId, format: "reel", objective: "property_spotlight", creativeDirection: "luxury_editorial", idempotencyKey: requestId }),
    }))

    expect(response.status).toBe(202)
    expect(repository.addSourceAssets).toHaveBeenCalledWith("content-1", expect.objectContaining({
      media: expect.arrayContaining([expect.objectContaining({ type: "video" })]),
    }))
  })

  it("persists a Create Studio Story selection as the story storage type and V2 delivery contract", async () => {
    repository.createContent.mockResolvedValueOnce({ id: "content-1", contentType: "story", composition: {} })
    repository.getPropertySnapshot.mockResolvedValue({
      id: propertyId,
      title: "Villa Verde",
      amenities: [],
      features: [],
      media: [{ id: curatedImageIds[0], type: "image", url: "https://images.example/1.jpg", isCover: true }],
    })
    repository.addSourceAssets.mockResolvedValue([
      { id: "asset-1", propertyImageId: curatedImageIds[0], kind: "original_reference", mediaType: "image", sourceUrl: "https://images.example/1.jpg", sortOrder: 0 },
    ])

    const response = await POST(new Request("http://localhost/api/marketing/content", {
      method: "POST",
      body: JSON.stringify({ propertyId, format: "story", objective: "property_spotlight", propertyMediaIds: [curatedImageIds[0]], idempotencyKey: requestId }),
    }))

    expect(response.status).toBe(202)
    expect(repository.createContent).toHaveBeenCalledWith(expect.objectContaining({
      format: "story",
      objective: "property_spotlight",
    }))
    expect(repository.updateContent).toHaveBeenCalledWith("content-1", expect.objectContaining({
      composition: expect.objectContaining({
        marketingContract: expect.objectContaining({ format: "story", objective: "property_spotlight" }),
      }),
    }), "admin-1")
    expect(repository.addAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({ contentType: "story", format: "story" }),
    }))
  })

  it("persists an M3 curated selection in the exact user order before generation", async () => {
    repository.getPropertySnapshot.mockResolvedValue({
      id: propertyId,
      title: "Villa Verde",
      amenities: [],
      features: [],
      media: [
        { id: curatedImageIds[0], type: "image", url: "https://images.example/1.jpg", isCover: true },
        { id: curatedImageIds[1], type: "image", url: "https://images.example/2.jpg", isCover: false },
        { id: curatedVideoId, type: "video", url: "https://images.example/tour.mp4", isCover: false },
      ],
    })
    repository.addSourceAssets.mockResolvedValue([
      { id: "asset-1", propertyImageId: curatedImageIds[0], kind: "original_reference", mediaType: "image", sourceUrl: "https://images.example/1.jpg", sortOrder: 0 },
      { id: "asset-2", propertyImageId: curatedImageIds[1], kind: "original_reference", mediaType: "image", sourceUrl: "https://images.example/2.jpg", sortOrder: 1 },
      { id: "asset-video", propertyImageId: curatedVideoId, kind: "original_reference", mediaType: "video", sourceUrl: "https://images.example/tour.mp4", sortOrder: 2 },
    ])

    const response = await POST(new Request("http://localhost/api/marketing/content", {
      method: "POST",
      body: JSON.stringify({ propertyId, format: "carousel", objective: "interiors", propertyMediaIds: [curatedImageIds[1], curatedImageIds[0]], idempotencyKey: requestId }),
    }))

    expect(response.status).toBe(202)
    expect(repository.updateContent).toHaveBeenCalledWith("content-1", expect.objectContaining({
      composition: expect.objectContaining({
        selectedAssetIds: ["asset-2", "asset-1"],
        marketingContract: expect.objectContaining({ mediaSelection: { mode: "curated", assetIds: ["asset-2", "asset-1"] } }),
      }),
    }), "admin-1")
  })

  it("rejects an M3 Post request that tries to curate a video before creating a draft", async () => {
    repository.getPropertySnapshot.mockResolvedValue({
      id: propertyId,
      title: "Villa Verde",
      amenities: [],
      features: [],
      media: [{ id: curatedVideoId, type: "video", url: "https://images.example/tour.mp4", isCover: false }],
    })

    const response = await POST(new Request("http://localhost/api/marketing/content", {
      method: "POST",
      body: JSON.stringify({ propertyId, format: "feed_single", objective: "property_spotlight", propertyMediaIds: [curatedVideoId], idempotencyKey: requestId }),
    }))

    expect(response.status).toBe(409)
    expect(repository.createContent).not.toHaveBeenCalled()
  })

  it("keeps a Post logo off by default and persists an explicitly enabled deterministic brand treatment", async () => {
    repository.getActiveBrandLogo.mockResolvedValue({ id: "f2041f1f-89e9-4a59-a8de-00169502f523" })
    repository.getPropertySnapshot.mockResolvedValue({
      id: propertyId,
      title: "Villa Verde",
      amenities: [],
      features: [],
      media: [{ id: curatedImageIds[0], type: "image", url: "https://images.example/1.jpg", isCover: true }],
    })
    repository.addSourceAssets.mockResolvedValue([
      { id: "asset-1", propertyImageId: curatedImageIds[0], kind: "original_reference", mediaType: "image", sourceUrl: "https://images.example/1.jpg", sortOrder: 0 },
    ])

    const response = await POST(new Request("http://localhost/api/marketing/content", {
      method: "POST",
      body: JSON.stringify({ propertyId, format: "feed_single", objective: "property_spotlight", propertyMediaIds: [curatedImageIds[0]], brandTreatment: { enabled: true, placement: "bottom_left", scale: "small", opacity: 0.6 }, idempotencyKey: requestId }),
    }))

    expect(response.status).toBe(202)
    expect(repository.updateContent).toHaveBeenCalledWith("content-1", expect.objectContaining({
      composition: expect.objectContaining({ marketingContract: expect.objectContaining({
        brandTreatment: { version: "v1", logo: { enabled: true, assetId: "f2041f1f-89e9-4a59-a8de-00169502f523", placement: "bottom_left", scale: "small", opacity: 0.6 } },
      }) }),
    }), "admin-1")
  })

  it("rejects an unknown format instead of silently creating a Feed post", async () => {
    const response = await POST(new Request("http://localhost/api/marketing/content", {
      method: "POST",
      body: JSON.stringify({ propertyId, format: "unknown", objective: "property_spotlight", idempotencyKey: requestId }),
    }))

    expect(response.status).toBe(400)
    expect(repository.createContent).not.toHaveBeenCalled()
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
