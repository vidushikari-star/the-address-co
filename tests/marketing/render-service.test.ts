import { EventEmitter } from "node:events"
import { beforeEach, describe, expect, it, vi } from "vitest"

const childProcess = vi.hoisted(() => ({ spawn: vi.fn() }))
const files = vi.hoisted(() => ({ mkdtemp: vi.fn(), readFile: vi.fn(), rm: vi.fn(), writeFile: vi.fn() }))
const admin = vi.hoisted(() => ({ client: { storage: { from: vi.fn() } } }))

vi.mock("node:child_process", () => childProcess)
vi.mock("node:fs/promises", () => files)
vi.mock("@/lib/supabase/admin", () => ({ createAdminSupabaseClient: () => admin.client }))

import { RenderService } from "@/lib/marketing/services/render-service"

beforeEach(() => {
  vi.clearAllMocks()
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co"
  files.mkdtemp.mockResolvedValue("/tmp/marketing-render-test")
  files.writeFile.mockResolvedValue(undefined)
  files.readFile.mockResolvedValue(Buffer.alloc(2_048))
  files.rm.mockResolvedValue(undefined)
  admin.client.storage.from.mockReturnValue({ upload: vi.fn().mockResolvedValue({ error: null }) })
  vi.stubGlobal("fetch", vi.fn(async (url: URL | string) => ({
    ok: true,
    headers: new Headers({ "content-type": String(url).includes("licensed") ? "audio/mp4" : "image/jpeg", "content-length": "2048" }),
    arrayBuffer: async () => new ArrayBuffer(2_048),
  })))
  childProcess.spawn.mockImplementation(() => {
    const stderr = new EventEmitter()
    const child = new EventEmitter() as EventEmitter & { stderr: EventEmitter }
    child.stderr = stderr
    queueMicrotask(() => child.emit("close", 0))
    return child
  })
})

describe("RenderService audio mixing", () => {
  it("trims a long uploaded track, fades it out, and never loops a shorter source", async () => {
    await RenderService.renderReel({
      contentId: "1e149a39-7321-42d1-900c-7389c0da37a3",
      composition: {
        propertyId: "1e149a39-7321-42d1-900c-7389c0da37a3",
        format: "reel", aspectRatio: "9:16", duration: 15,
        scenes: [{ assetId: "b2041f1f-89e9-4a59-a8de-00169502f523", start: 0, duration: 15, crop: "cover", motion: "none", transitionOut: "fade" }],
        caption: "A considered introduction.", hashtags: ["#NorthGoa"], cta: "Arrange a viewing.", coverText: "Villa Verde",
        audio: { type: "uploaded", id: "b2041f1f-89e9-4a59-a8de-00169502f523", label: "Licensed piano", durationSeconds: 30 },
      },
      assets: [{ id: "b2041f1f-89e9-4a59-a8de-00169502f523", contentId: "1e149a39-7321-42d1-900c-7389c0da37a3", kind: "original_reference", mediaType: "image", sourceUrl: "https://project.supabase.co/storage/v1/object/sign/property.jpg", metadata: {}, sortOrder: 0, createdAt: "2026-08-10T00:00:00.000Z" }],
      audio: { sourceUrl: "https://project.supabase.co/storage/v1/object/sign/licensed.m4a", mimeType: "audio/mp4", durationSeconds: 30 },
    })

    const args = childProcess.spawn.mock.calls[0]?.[1] as string[]
    const filters = args[args.indexOf("-filter_complex") + 1]
    expect(filters).toContain("[1:a]atrim=duration=15.000")
    expect(filters).toContain("afade=t=out:st=13.500:d=1.500")
    expect(args).toEqual(expect.arrayContaining(["-map", "[a]", "-c:a", "aac"]))
    expect(args).not.toContain("-stream_loop")
    expect(args).not.toContain("-an")
  })
})
