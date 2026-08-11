import { beforeEach, describe, expect, it, vi } from "vitest"

const access = vi.hoisted(() => ({ requireMarketingApiAccess: vi.fn() }))
const repository = vi.hoisted(() => ({
  createAudioTrack: vi.fn(), getAudioTrackByStoragePath: vi.fn(), updateAudioTrack: vi.fn(), deleteAudioTrack: vi.fn(), listAudioTracks: vi.fn(), addAuditLog: vi.fn(),
}))
const storage = vi.hoisted(() => ({ createSignedUploadUrl: vi.fn(), list: vi.fn(), remove: vi.fn() }))
const server = vi.hoisted(() => ({ client: { storage: { from: vi.fn() } } }))

vi.mock("@/lib/auth/marketing", () => access)
vi.mock("@/lib/marketing/repositories/marketing-repository", () => ({ MarketingRepository: repository }))
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn().mockResolvedValue(server.client) }))

import { POST as legacyUpload } from "@/app/api/marketing/audio/route"
import { POST as requestUpload } from "@/app/api/marketing/audio/request-upload/route"
import { POST as finalizeUpload } from "@/app/api/marketing/audio/finalize/route"
import { DELETE, PATCH } from "@/app/api/marketing/audio/[id]/route"

const trackId = "b2041f1f-89e9-4a59-a8de-00169502f523"

function request(filename: string, mimeType: string, fileSize = 9) {
  return new Request("http://localhost/api/marketing/audio/request-upload", { method: "POST", body: JSON.stringify({ filename, mimeType, fileSize }) })
}

beforeEach(() => {
  vi.clearAllMocks()
  access.requireMarketingApiAccess.mockResolvedValue({ user: { id: "admin-1" }, error: null, status: null })
  server.client.storage.from.mockReturnValue(storage)
  storage.createSignedUploadUrl.mockImplementation(async (path: string) => ({ data: { path, token: "signed-upload-token" }, error: null }))
  storage.list.mockResolvedValue({ data: [{ name: "track.mp3", metadata: { size: 9, mimetype: "audio/mpeg" } }], error: null })
  storage.remove.mockResolvedValue({ error: null })
  repository.getAudioTrackByStoragePath.mockResolvedValue(null)
  repository.addAuditLog.mockResolvedValue(undefined)
})

describe("Marketing Audio Library signed uploads", () => {
  it("requires Marketing admin access before issuing a signed upload permission", async () => {
    access.requireMarketingApiAccess.mockResolvedValue({ user: null, error: "Forbidden", status: 403 })
    const response = await requestUpload(request("track.mp3", "audio/mpeg"))
    expect(response.status).toBe(403)
    expect(storage.createSignedUploadUrl).not.toHaveBeenCalled()
  })

  it("issues independent private upload permissions for MP3, M4A, and WAV without proxying bytes", async () => {
    const responses = await Promise.all([
      requestUpload(request("one.mp3", "audio/mpeg")),
      requestUpload(request("two.m4a", "audio/mp4")),
      requestUpload(request("three.wav", "audio/wav")),
    ])
    expect(responses.map(response => response.status)).toEqual([200, 200, 200])
    expect(storage.createSignedUploadUrl).toHaveBeenCalledTimes(3)
    expect(storage.createSignedUploadUrl).toHaveBeenNthCalledWith(1, expect.stringMatching(/^admin-1\/.+\.mp3$/), { upsert: false })
    expect(storage.createSignedUploadUrl).toHaveBeenNthCalledWith(2, expect.stringMatching(/^admin-1\/.+\.m4a$/), { upsert: false })
    expect(storage.createSignedUploadUrl).toHaveBeenNthCalledWith(3, expect.stringMatching(/^admin-1\/.+\.wav$/), { upsert: false })
  })

  it("supports 25 independently signed files rather than one oversized multipart request", async () => {
    const responses = await Promise.all(Array.from({ length: 25 }, (_, index) => requestUpload(request(`track-${index}.mp3`, "audio/mpeg"))))
    expect(responses.every(response => response.status === 200)).toBe(true)
    expect(storage.createSignedUploadUrl).toHaveBeenCalledTimes(25)
  })

  it("rejects oversized, invalid, and path-like filenames before issuing storage permission", async () => {
    await expect((await requestUpload(request("large.mp3", "audio/mpeg", 25 * 1024 * 1024 + 1))).json()).resolves.toMatchObject({ error: expect.stringContaining("no larger than 25 MB") })
    await expect((await requestUpload(request("track.ogg", "audio/ogg"))).json()).resolves.toMatchObject({ error: expect.stringContaining("Unsupported audio format") })
    await expect((await requestUpload(request("../track.mp3", "audio/mpeg"))).json()).resolves.toMatchObject({ error: expect.stringContaining("Unsupported audio filename") })
    expect(storage.createSignedUploadUrl).not.toHaveBeenCalled()
  })

  it("finalizes verified private storage metadata and never needs audio bytes in Vercel", async () => {
    repository.createAudioTrack.mockResolvedValue({ id: trackId, title: "Licensed piano", mimeType: "audio/mpeg", fileSize: 9, durationSeconds: 12 })
    const response = await finalizeUpload(new Request("http://localhost/api/marketing/audio/finalize", {
      method: "POST",
      body: JSON.stringify({ storagePath: "admin-1/track.mp3", filename: "track.mp3", title: "Licensed piano", artistSource: "Studio licence", mimeType: "audio/mpeg", fileSize: 9, durationSeconds: 12 }),
    }))
    expect(response.status).toBe(201)
    expect(storage.list).toHaveBeenCalledWith("admin-1", { search: "track.mp3" })
    expect(repository.createAudioTrack).toHaveBeenCalledWith(expect.objectContaining({ storagePath: "admin-1/track.mp3", filename: "track.mp3", mimeType: "audio/mpeg", fileSize: 9, durationSeconds: 12, createdBy: "admin-1" }))
  })

  it("makes finalization idempotent and does not overwrite duplicate names", async () => {
    repository.getAudioTrackByStoragePath.mockResolvedValue({ id: trackId, storagePath: "admin-1/track.mp3" })
    const response = await finalizeUpload(new Request("http://localhost/api/marketing/audio/finalize", {
      method: "POST", body: JSON.stringify({ storagePath: "admin-1/track.mp3", filename: "track.mp3", title: "Licensed piano", mimeType: "audio/mpeg", fileSize: 9, durationSeconds: 12 }),
    }))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ duplicate: true })
    expect(repository.createAudioTrack).not.toHaveBeenCalled()
  })

  it("cleans up an orphaned object when metadata finalization fails permanently", async () => {
    repository.createAudioTrack.mockRejectedValue(new Error("database unavailable"))
    const response = await finalizeUpload(new Request("http://localhost/api/marketing/audio/finalize", {
      method: "POST", body: JSON.stringify({ storagePath: "admin-1/track.mp3", filename: "track.mp3", title: "Licensed piano", mimeType: "audio/mpeg", fileSize: 9, durationSeconds: 12 }),
    }))
    expect(response.status).toBe(500)
    expect(storage.remove).toHaveBeenCalledWith(["admin-1/track.mp3"])
  })

  it("retires the legacy multipart endpoint so it cannot proxy a bulk body through Vercel", async () => {
    const response = await legacyUpload(new Request("http://localhost/api/marketing/audio", { method: "POST" }))
    expect(response.status).toBe(410)
  })

  it("keeps existing rename and delete controls intact", async () => {
    repository.updateAudioTrack.mockResolvedValue({ id: trackId, title: "New name" })
    repository.deleteAudioTrack.mockResolvedValue({ id: trackId, storagePath: "admin/piano.mp3" })
    const renamed = await PATCH(new Request(`http://localhost/api/marketing/audio/${trackId}`, { method: "PATCH", body: JSON.stringify({ title: "New name" }) }), { params: Promise.resolve({ id: trackId }) })
    const deleted = await DELETE(new Request(`http://localhost/api/marketing/audio/${trackId}`, { method: "DELETE" }), { params: Promise.resolve({ id: trackId }) })
    expect(renamed.status).toBe(200)
    expect(deleted.status).toBe(200)
    expect(storage.remove).toHaveBeenCalledWith(["admin/piano.mp3"])
  })
})
