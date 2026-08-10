import { beforeEach, describe, expect, it, vi } from "vitest"

const access = vi.hoisted(() => ({ requireMarketingApiAccess: vi.fn() }))
const repository = vi.hoisted(() => ({ getContentById: vi.fn(), getAudioTrackById: vi.fn(), updateContent: vi.fn(), addAuditLog: vi.fn() }))

vi.mock("@/lib/auth/marketing", () => access)
vi.mock("@/lib/marketing/repositories/marketing-repository", () => ({ MarketingRepository: repository }))

import { POST } from "@/app/api/marketing/content/[id]/audio/route"

const contentId = "1e149a39-7321-42d1-900c-7389c0da37a3"
const trackId = "b2041f1f-89e9-4a59-a8de-00169502f523"

beforeEach(() => {
  vi.clearAllMocks()
  access.requireMarketingApiAccess.mockResolvedValue({ user: { id: "admin-1" }, error: null, status: null })
  repository.getContentById.mockResolvedValue({ content: { id: contentId, contentType: "reel", status: "draft", composition: { format: "reel" } } })
  repository.addAuditLog.mockResolvedValue(undefined)
})

describe("POST /api/marketing/content/:id/audio", () => {
  it("persists only an existing Audio Library track on an editable Reel", async () => {
    repository.getAudioTrackById.mockResolvedValue({ id: trackId, title: "Licensed piano", durationSeconds: 30 })
    repository.updateContent.mockResolvedValue({ id: contentId })

    const response = await POST(new Request(`http://localhost/api/marketing/content/${contentId}/audio`, {
      method: "POST", body: JSON.stringify({ audioTrackId: trackId }),
    }), { params: Promise.resolve({ id: contentId }) })

    expect(response.status).toBe(200)
    expect(repository.updateContent).toHaveBeenCalledWith(contentId, expect.objectContaining({
      composition: { format: "reel", audio: { type: "uploaded", id: trackId, label: "Licensed piano", durationSeconds: 30 } },
    }), "admin-1")
  })

  it("does not persist a deleted or unknown track reference", async () => {
    repository.getAudioTrackById.mockResolvedValue(null)

    const response = await POST(new Request(`http://localhost/api/marketing/content/${contentId}/audio`, {
      method: "POST", body: JSON.stringify({ audioTrackId: trackId }),
    }), { params: Promise.resolve({ id: contentId }) })

    expect(response.status).toBe(404)
    expect(repository.updateContent).not.toHaveBeenCalled()
  })

  it("keeps the explicit Silent Reel option available", async () => {
    repository.updateContent.mockResolvedValue({ id: contentId })

    const response = await POST(new Request(`http://localhost/api/marketing/content/${contentId}/audio`, {
      method: "POST", body: JSON.stringify({ audioTrackId: null }),
    }), { params: Promise.resolve({ id: contentId }) })

    expect(response.status).toBe(200)
    expect(repository.updateContent).toHaveBeenCalledWith(contentId, expect.objectContaining({
      composition: { format: "reel", audio: { type: "none", label: "Silent Reel" } },
    }), "admin-1")
  })
})
