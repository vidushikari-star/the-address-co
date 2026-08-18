import { beforeEach, describe, expect, it, vi } from "vitest"

const access = vi.hoisted(() => ({ requireMarketingApiAccess: vi.fn() }))
const repository = vi.hoisted(() => ({ returnPublicationToApproved: vi.fn() }))
const cache = vi.hoisted(() => ({ revalidatePath: vi.fn() }))

vi.mock("@/lib/auth/marketing", () => access)
vi.mock("@/lib/marketing/repositories/marketing-repository", () => ({ MarketingRepository: repository }))
vi.mock("next/cache", () => cache)

import { POST } from "@/app/api/marketing/content/[id]/publication-recovery/route"

const contentId = "1e149a39-7321-42d1-900c-7389c0da37a3"

beforeEach(() => {
  vi.clearAllMocks()
  access.requireMarketingApiAccess.mockResolvedValue({ user: { id: "admin-1" }, error: null, status: null })
  repository.returnPublicationToApproved.mockResolvedValue({ id: contentId, status: "approved" })
})

describe("publication recovery route", () => {
  it("returns only a database-approved safe recovery to Approved and refreshes the Marketing UI", async () => {
    const response = await POST(new Request("http://localhost"), { params: Promise.resolve({ id: contentId }) })

    expect(response.status).toBe(200)
    expect(repository.returnPublicationToApproved).toHaveBeenCalledWith({ contentId, updatedBy: "admin-1" })
    expect(cache.revalidatePath).toHaveBeenCalledWith("/marketing/content")
    expect(cache.revalidatePath).toHaveBeenCalledWith("/marketing/calendar")
  })

  it("does not disguise an ambiguous media_publish outcome as a safe recovery", async () => {
    repository.returnPublicationToApproved.mockRejectedValue(new Error("Publication outcome requires verification before retrying."))

    const response = await POST(new Request("http://localhost"), { params: Promise.resolve({ id: contentId }) })

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({ error: "Publication outcome requires verification before retrying." })
  })
})
