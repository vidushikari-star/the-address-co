import { beforeEach, describe, expect, it, vi } from "vitest"

const access = vi.hoisted(() => ({ requireMarketingApiAccess: vi.fn() }))
const flags = vi.hoisted(() => ({ isInstagramPublishingEnabled: vi.fn() }))
const repository = vi.hoisted(() => ({ getContentById: vi.fn(), enqueueJob: vi.fn(), addAuditLog: vi.fn() }))

vi.mock("@/lib/auth/marketing", () => access)
vi.mock("@/lib/marketing/feature-flags", () => flags)
vi.mock("@/lib/marketing/repositories/marketing-repository", () => ({ MarketingRepository: repository }))
vi.mock("@/lib/marketing/services/approval-service", () => ({ ApprovalService: { approve: vi.fn(), requestChanges: vi.fn(), reject: vi.fn() } }))

import { POST as approve } from "@/app/api/marketing/content/[id]/approval/route"
import { PATCH as edit } from "@/app/api/marketing/content/route"
import { POST as publish } from "@/app/api/marketing/publish/[id]/route"

beforeEach(() => {
  vi.clearAllMocks()
  access.requireMarketingApiAccess.mockResolvedValue({ user: { id: "admin-1" }, error: null, status: null })
  flags.isInstagramPublishingEnabled.mockReturnValue(false)
})

describe("Marketing workflow API guards", () => {
  it("does not let a non-admin approve content", async () => {
    access.requireMarketingApiAccess.mockResolvedValue({ user: null, error: "Forbidden", status: 403 })

    const response = await approve(
      new Request("http://localhost/api/marketing/content/content-1/approval", { method: "POST", body: JSON.stringify({ action: "approve" }) }),
      { params: Promise.resolve({ id: "content-1" }) }
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" })
  })

  it("keeps publishing blocked while INSTAGRAM_PUBLISHING_ENABLED is false", async () => {
    const response = await publish(
      new Request("http://localhost/api/marketing/publish/content-1", { method: "POST" }),
      { params: Promise.resolve({ id: "content-1" }) }
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: "Instagram publishing is disabled by feature flag." })
    expect(repository.enqueueJob).not.toHaveBeenCalled()
  })

  it("does not publish failed render content even when publishing is enabled", async () => {
    flags.isInstagramPublishingEnabled.mockReturnValue(true)
    repository.getContentById.mockResolvedValue({ content: { status: "failed" }, assets: [] })

    const response = await publish(
      new Request("http://localhost/api/marketing/publish/content-1", { method: "POST" }),
      { params: Promise.resolve({ id: "content-1" }) }
    )

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({ error: "Only explicitly approved content can be published." })
  })

  it("locks material edits after approval until content is returned to changes", async () => {
    repository.getContentById.mockResolvedValue({ content: { status: "approved" } })

    const response = await edit(new Request("http://localhost/api/marketing/content", {
      method: "PATCH",
      body: JSON.stringify({ id: "content-1", caption: "A changed caption" }),
    }))

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({ error: "Approved, scheduled, and published content is locked. Request changes before editing." })
  })
})
