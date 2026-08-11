import { beforeEach, describe, expect, it, vi } from "vitest"

const auth = vi.hoisted(() => ({ requireMarketingApiAccess: vi.fn() }))
const repository = vi.hoisted(() => ({ manageScheduledContents: vi.fn(), addAuditLog: vi.fn() }))

vi.mock("@/lib/auth/marketing", () => auth)
vi.mock("@/lib/marketing/repositories/marketing-repository", () => ({ MarketingRepository: repository }))

import { POST } from "@/app/api/marketing/content/scheduled/route"

const id = "1e149a39-7321-42d1-900c-7389c0da37a3"

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
    await expect(response.json()).resolves.toMatchObject({ message: "1 scheduled items unscheduled" })
  })

  it("reports a publishing race as skipped rather than pretending deletion succeeded", async () => {
    repository.manageScheduledContents.mockResolvedValue([{ id, outcome: "skipped_publishing" }])
    const response = await POST(new Request("http://localhost/api/marketing/content/scheduled", { method: "POST", body: JSON.stringify({ action: "delete", ids: [id] }) }))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ message: "0 items deleted. 1 skipped because publishing had already started." })
    expect(repository.addAuditLog).not.toHaveBeenCalled()
  })
})
