import { beforeEach, describe, expect, it, vi } from "vitest"

const access = vi.hoisted(() => ({ requireMarketingApiAccess: vi.fn() }))
const repository = vi.hoisted(() => ({ getContentById: vi.fn(), getReelVersion: vi.fn(), queueReelRender: vi.fn(), markReelVersionRendering: vi.fn(), addAuditLog: vi.fn() }))

vi.mock("@/lib/auth/marketing", () => access)
vi.mock("@/lib/marketing/repositories/marketing-repository", () => ({ MarketingRepository: repository }))

import { POST } from "@/app/api/marketing/content/[id]/reel/versions/[versionId]/render/route"

const contentId = "1e149a39-7321-42d1-900c-7389c0da37a3"
const versionId = "b2041f1f-89e9-4a59-a8de-00169502f523"

beforeEach(() => {
  vi.clearAllMocks()
  access.requireMarketingApiAccess.mockResolvedValue({ user: { id: "admin-1" }, error: null, status: null })
  repository.getContentById.mockResolvedValue({ content: { id: contentId, status: "approved" } })
  repository.getReelVersion.mockResolvedValue({ id: versionId, contentId, status: "approved" })
  repository.queueReelRender.mockResolvedValue({ id: "job-1", type: "render_reel", status: "queued" })
  repository.markReelVersionRendering.mockResolvedValue(undefined)
  repository.addAuditLog.mockResolvedValue(undefined)
})

describe("POST /api/marketing/content/:id/reel/versions/:versionId/render", () => {
  it("queues the existing render_reel workflow for the explicitly approved new version", async () => {
    const response = await POST(new Request("http://localhost/render", { method: "POST" }), { params: Promise.resolve({ id: contentId, versionId }) })

    expect(response.status).toBe(202)
    expect(repository.queueReelRender).toHaveBeenCalledWith(expect.objectContaining({
      contentId,
      updatedBy: "admin-1",
      jobInput: { resumeApproved: true, reelVersionId: versionId },
    }))
    expect(repository.markReelVersionRendering).toHaveBeenCalledWith(versionId)
  })

  it("requires approval before the existing queue may render a revised version", async () => {
    repository.getReelVersion.mockResolvedValue({ id: versionId, contentId, status: "draft" })
    const response = await POST(new Request("http://localhost/render", { method: "POST" }), { params: Promise.resolve({ id: contentId, versionId }) })

    expect(response.status).toBe(409)
    expect(repository.queueReelRender).not.toHaveBeenCalled()
  })
})
