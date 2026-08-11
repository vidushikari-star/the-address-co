import { beforeEach, describe, expect, it, vi } from "vitest"

const auth = vi.hoisted(() => ({ requireMarketingApiAccess: vi.fn() }))
const repository = vi.hoisted(() => ({ manageScheduledContents: vi.fn(), addAuditLog: vi.fn() }))

vi.mock("@/lib/auth/marketing", () => auth)
vi.mock("@/lib/marketing/repositories/marketing-repository", () => ({ MarketingRepository: repository }))

import { POST } from "@/app/api/marketing/content/scheduled/route"

const id = "1e149a39-7321-42d1-900c-7389c0da37a3"
const secondId = "b2041f1f-89e9-4a59-a8de-00169502f523"
const thirdId = "ba3fe72a-dfb7-43e5-9d81-964c6602ea6a"

beforeEach(() => {
  vi.clearAllMocks()
  auth.requireMarketingApiAccess.mockResolvedValue({ user: { id: "admin-1" }, error: null, status: null })
  repository.addAuditLog.mockResolvedValue(undefined)
})

describe("scheduled content controls", () => {
  it("rejects a request without Marketing admin access", async () => {
    auth.requireMarketingApiAccess.mockResolvedValue({ user: null, error: "Forbidden", status: 403 })
    const response = await POST(new Request("http://localhost/api/marketing/content/scheduled", { method: "POST" }))
    expect(response.status).toBe(403)
  })

  it("unschedules only the server-side selected scheduled content", async () => {
    repository.manageScheduledContents.mockResolvedValue([{ id, outcome: "unscheduled" }])
    const response = await POST(new Request("http://localhost/api/marketing/content/scheduled", { method: "POST", body: JSON.stringify({ action: "unschedule", ids: [id] }) }))
    expect(response.status).toBe(200)
    expect(repository.manageScheduledContents).toHaveBeenCalledWith({ action: "unschedule", ids: [id], updatedBy: "admin-1" })
    await expect(response.json()).resolves.toMatchObject({ message: "1 scheduled item unscheduled" })
  })

  it("returns all three successful outcomes for a bulk unschedule and records each audit event", async () => {
    repository.manageScheduledContents.mockResolvedValue([
      { id, outcome: "unscheduled" }, { id: secondId, outcome: "unscheduled" }, { id: thirdId, outcome: "unscheduled" },
    ])
    const response = await POST(new Request("http://localhost/api/marketing/content/scheduled", {
      method: "POST", body: JSON.stringify({ action: "unschedule", ids: [id, secondId, thirdId] }),
    }))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ message: "3 scheduled items unscheduled" })
    expect(repository.addAuditLog).toHaveBeenCalledTimes(3)
  })

  it("returns all three successful outcomes for a bulk delete", async () => {
    repository.manageScheduledContents.mockResolvedValue([
      { id, outcome: "deleted" }, { id: secondId, outcome: "deleted" }, { id: thirdId, outcome: "deleted" },
    ])
    const response = await POST(new Request("http://localhost/api/marketing/content/scheduled", {
      method: "POST", body: JSON.stringify({ action: "delete", ids: [id, secondId, thirdId] }),
    }))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ message: "3 scheduled items deleted" })
    expect(repository.addAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "content.scheduled_deleted" }))
  })

  it("returns mixed per-item outcomes for stale or published selections", async () => {
    repository.manageScheduledContents.mockResolvedValue([
      { id, outcome: "deleted" }, { id: secondId, outcome: "skipped_not_scheduled" }, { id: thirdId, outcome: "skipped_publication_history" },
    ])
    const response = await POST(new Request("http://localhost/api/marketing/content/scheduled", {
      method: "POST", body: JSON.stringify({ action: "delete", ids: [id, secondId, thirdId] }),
    }))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      outcomes: [{ id, outcome: "deleted" }, { id: secondId, outcome: "skipped_not_scheduled" }, { id: thirdId, outcome: "skipped_publication_history" }],
      message: "1 scheduled item deleted. 2 items skipped because they were no longer safely deletable.",
    })
  })

  it("reports a publishing race as skipped rather than pretending deletion succeeded", async () => {
    repository.manageScheduledContents.mockResolvedValue([{ id, outcome: "skipped_publishing" }])
    const response = await POST(new Request("http://localhost/api/marketing/content/scheduled", { method: "POST", body: JSON.stringify({ action: "delete", ids: [id] }) }))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ message: "0 scheduled items deleted. 1 item skipped because publishing had already started." })
    expect(repository.addAuditLog).not.toHaveBeenCalled()
  })

  it("keeps a completed scheduled delete successful when post-mutation audit logging fails", async () => {
    repository.manageScheduledContents.mockResolvedValue([{ id, outcome: "deleted" }])
    repository.addAuditLog.mockRejectedValue(new Error("audit storage unavailable"))

    const response = await POST(new Request("http://localhost/api/marketing/content/scheduled", {
      method: "POST", body: JSON.stringify({ action: "delete", ids: [id] }),
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ message: "1 scheduled item deleted" })
  })
})
