import { beforeEach, describe, expect, it, vi } from "vitest"

const repository = vi.hoisted(() => ({
  getPropertySnapshot: vi.fn(),
  getContentByIdempotencyKey: vi.fn(),
  getInstagramAccount: vi.fn(),
  createContent: vi.fn(),
  addSourceAssets: vi.fn(),
  updateContent: vi.fn(),
  addAuditLog: vi.fn(),
}))

vi.mock("@/lib/auth/marketing", () => ({
  requireMarketingApiAccess: vi.fn().mockResolvedValue({ user: { id: "admin-1" }, error: null, status: null }),
}))
vi.mock("@/lib/marketing/repositories/marketing-repository", () => ({ MarketingRepository: repository }))

import { POST } from "@/app/api/marketing/content/route"

const propertyId = "1e149a39-7321-42d1-900c-7389c0da37a3"
const requestId = "b2041f1f-89e9-4a59-a8de-00169502f523"

beforeEach(() => {
  vi.clearAllMocks()
  repository.getPropertySnapshot.mockResolvedValue({ id: propertyId, title: "Villa Verde", amenities: [], features: [], media: [] })
  repository.getContentByIdempotencyKey.mockResolvedValue(null)
  repository.getInstagramAccount.mockResolvedValue(null)
  repository.createContent.mockResolvedValue({ id: "content-1", contentType: "carousel", composition: {} })
  repository.addSourceAssets.mockResolvedValue([0, 1, 2, 3, 4].map(index => ({
    id: `asset-${index}`,
    kind: "original_reference",
    mediaType: "image",
    sourceUrl: `https://images.example/${index}.jpg`,
    sortOrder: index,
  })))
  repository.updateContent.mockResolvedValue({ id: "content-1", contentType: "carousel" })
  repository.addAuditLog.mockResolvedValue(undefined)
})

describe("POST /api/marketing/content", () => {
  it("persists all five selected Carousel relations in deterministic order without mutating CRM media", async () => {
    const response = await POST(new Request("http://localhost/api/marketing/content", {
      method: "POST",
      body: JSON.stringify({ propertyId, contentType: "carousel", creativeDirection: "luxury_editorial", idempotencyKey: requestId }),
    }))

    expect(response.status).toBe(202)
    expect(repository.addSourceAssets).toHaveBeenCalledWith("content-1", expect.objectContaining({ id: propertyId }))
    expect(repository.updateContent).toHaveBeenCalledWith("content-1", {
      composition: expect.objectContaining({
        format: "carousel",
        selectedAssetIds: ["asset-0", "asset-1", "asset-2", "asset-3", "asset-4"],
      }),
    }, "admin-1")
    expect(repository.addAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "content.created" }))
  })
})
