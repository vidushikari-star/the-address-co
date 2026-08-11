import { beforeEach, describe, expect, it, vi } from "vitest"

const access = vi.hoisted(() => ({ requireMarketingApiAccess: vi.fn() }))
const repository = vi.hoisted(() => ({ updateCarouselMedia: vi.fn() }))
const cache = vi.hoisted(() => ({ revalidatePath: vi.fn() }))

vi.mock("@/lib/auth/marketing", () => access)
vi.mock("@/lib/marketing/repositories/marketing-repository", () => ({ MarketingRepository: repository }))
vi.mock("next/cache", () => cache)

import { PATCH } from "@/app/api/marketing/content/[id]/carousel-media/route"

const contentId = "1e149a39-7321-42d1-900c-7389c0da37a3"
const imageIds = [
  "b2041f1f-89e9-4a59-a8de-00169502f523",
  "d2041f1f-89e9-4a59-a8de-00169502f523",
]

beforeEach(() => {
  vi.clearAllMocks()
  access.requireMarketingApiAccess.mockResolvedValue({ user: { id: "admin-1" }, error: null, status: null })
  repository.updateCarouselMedia.mockResolvedValue({ id: contentId, status: "draft" })
})

describe("Carousel media route", () => {
  it("persists an ordered Marketing-only image selection and refreshes the library", async () => {
    const response = await PATCH(new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ propertyImageIds: imageIds }),
      headers: { "Content-Type": "application/json" },
    }), { params: Promise.resolve({ id: contentId }) })

    expect(response.status).toBe(200)
    expect(repository.updateCarouselMedia).toHaveBeenCalledWith({ contentId, propertyImageIds: imageIds, updatedBy: "admin-1" })
    expect(cache.revalidatePath).toHaveBeenCalledWith("/marketing/content")
    expect(cache.revalidatePath).toHaveBeenCalledWith("/marketing/calendar")
  })

  it("rejects duplicate or undersized selections before any database mutation", async () => {
    const response = await PATCH(new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ propertyImageIds: [imageIds[0], imageIds[0]] }),
      headers: { "Content-Type": "application/json" },
    }), { params: Promise.resolve({ id: contentId }) })

    expect(response.status).toBe(400)
    expect(repository.updateCarouselMedia).not.toHaveBeenCalled()
  })

  it("requires Marketing access", async () => {
    access.requireMarketingApiAccess.mockResolvedValue({ user: null, error: "Forbidden", status: 403 })
    const response = await PATCH(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ propertyImageIds: imageIds }) }), { params: Promise.resolve({ id: contentId }) })

    expect(response.status).toBe(403)
    expect(repository.updateCarouselMedia).not.toHaveBeenCalled()
  })
})
