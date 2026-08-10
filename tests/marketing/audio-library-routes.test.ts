import { beforeEach, describe, expect, it, vi } from "vitest"

const access = vi.hoisted(() => ({ requireMarketingApiAccess: vi.fn() }))
const repository = vi.hoisted(() => ({
  createAudioTrack: vi.fn(),
  updateAudioTrack: vi.fn(),
  deleteAudioTrack: vi.fn(),
  listAudioTracks: vi.fn(),
  addAuditLog: vi.fn(),
}))
const storage = vi.hoisted(() => ({ upload: vi.fn(), remove: vi.fn() }))
const server = vi.hoisted(() => ({ client: { storage: { from: vi.fn() } } }))

vi.mock("@/lib/auth/marketing", () => access)
vi.mock("@/lib/marketing/repositories/marketing-repository", () => ({ MarketingRepository: repository }))
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn().mockResolvedValue(server.client) }))

import { POST } from "@/app/api/marketing/audio/route"
import { DELETE, PATCH } from "@/app/api/marketing/audio/[id]/route"

const trackId = "b2041f1f-89e9-4a59-a8de-00169502f523"

beforeEach(() => {
  vi.clearAllMocks()
  access.requireMarketingApiAccess.mockResolvedValue({ user: { id: "admin-1" }, error: null, status: null })
  server.client.storage.from.mockReturnValue(storage)
  storage.upload.mockResolvedValue({ error: null })
  storage.remove.mockResolvedValue({ error: null })
  repository.addAuditLog.mockResolvedValue(undefined)
})

describe("Marketing Audio Library routes", () => {
  it("rejects audio uploads from non-admins", async () => {
    access.requireMarketingApiAccess.mockResolvedValue({ user: null, error: "Forbidden", status: 403 })

    const response = await POST(new Request("http://localhost/api/marketing/audio", { method: "POST" }))

    expect(response.status).toBe(403)
    expect(storage.upload).not.toHaveBeenCalled()
  })

  it("validates the supported MP3, M4A, and WAV formats before private upload", async () => {
    const formData = new FormData()
    formData.set("file", new File(["not audio"], "track.ogg", { type: "audio/ogg" }))
    formData.set("durationSeconds", "12")

    const response = await POST(new Request("http://localhost/api/marketing/audio", { method: "POST", body: formData }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Upload an MP3, M4A, or WAV audio file." })
    expect(storage.upload).not.toHaveBeenCalled()
  })

  it("stores validated upload metadata and the file in the private audio bucket", async () => {
    repository.createAudioTrack.mockResolvedValue({ id: trackId, title: "Licensed piano", mimeType: "audio/mpeg", fileSize: 9, durationSeconds: 12 })
    const formData = new FormData()
    formData.set("file", new File(["mp3 bytes"], "piano.mp3", { type: "audio/mpeg" }))
    formData.set("title", "Licensed piano")
    formData.set("artistSource", "Studio licence")
    formData.set("durationSeconds", "12")

    const response = await POST(new Request("http://localhost/api/marketing/audio", { method: "POST", body: formData }))

    expect(response.status).toBe(201)
    expect(storage.upload).toHaveBeenCalledWith(expect.stringMatching(/^admin-1\/.+\.mp3$/), expect.any(Uint8Array), { contentType: "audio/mpeg", upsert: false })
    expect(repository.createAudioTrack).toHaveBeenCalledWith(expect.objectContaining({
      title: "Licensed piano", artistSource: "Studio licence", filename: "piano.mp3", mimeType: "audio/mpeg", fileSize: 9, durationSeconds: 12, createdBy: "admin-1",
    }))
  })

  it("renames and safely deletes a library track without touching marketing content", async () => {
    repository.updateAudioTrack.mockResolvedValue({ id: trackId, title: "New name" })
    repository.deleteAudioTrack.mockResolvedValue({ id: trackId, storagePath: "admin/piano.mp3" })

    const renamed = await PATCH(new Request(`http://localhost/api/marketing/audio/${trackId}`, { method: "PATCH", body: JSON.stringify({ title: "New name" }) }), { params: Promise.resolve({ id: trackId }) })
    const deleted = await DELETE(new Request(`http://localhost/api/marketing/audio/${trackId}`, { method: "DELETE" }), { params: Promise.resolve({ id: trackId }) })

    expect(renamed.status).toBe(200)
    expect(repository.updateAudioTrack).toHaveBeenCalledWith(trackId, { title: "New name" })
    expect(deleted.status).toBe(200)
    expect(storage.remove).toHaveBeenCalledWith(["admin/piano.mp3"])
  })
})
