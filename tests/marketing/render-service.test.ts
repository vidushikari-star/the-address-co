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
  childProcess.spawn.mockImplementation((executable: string) => {
    const stderr = new EventEmitter()
    const stdout = new EventEmitter()
    const child = new EventEmitter() as EventEmitter & { stderr: EventEmitter; stdout: EventEmitter }
    child.stderr = stderr
    child.stdout = stdout
    queueMicrotask(() => {
      if (executable.endsWith("ffprobe")) stdout.emit("data", JSON.stringify({ format: { format_name: "mp4" }, streams: [{ codec_type: "video", codec_name: "h264", pix_fmt: "yuv420p" }] }))
      child.emit("close", 0)
    })
    return child
  })
})

function renderInput() {
  return {
    contentId: "1e149a39-7321-42d1-900c-7389c0da37a3",
    composition: {
      propertyId: "1e149a39-7321-42d1-900c-7389c0da37a3",
      format: "reel" as const, aspectRatio: "9:16" as const, duration: 15,
      scenes: [{ assetId: "b2041f1f-89e9-4a59-a8de-00169502f523", start: 0, duration: 15, crop: "cover" as const, motion: "none" as const, transitionOut: "fade" as const }],
      caption: "A considered introduction.", hashtags: ["#NorthGoa"], cta: "Arrange a viewing.", coverText: "Villa Verde",
      audio: { type: "uploaded" as const, id: "b2041f1f-89e9-4a59-a8de-00169502f523", label: "Licensed piano", durationSeconds: 30 },
    },
    assets: [{ id: "b2041f1f-89e9-4a59-a8de-00169502f523", contentId: "1e149a39-7321-42d1-900c-7389c0da37a3", kind: "original_reference" as const, mediaType: "image" as const, sourceUrl: "https://project.supabase.co/storage/v1/object/sign/property.jpg", metadata: {}, sortOrder: 0, createdAt: "2026-08-10T00:00:00.000Z" }],
    audio: { sourceUrl: "https://project.supabase.co/storage/v1/object/sign/licensed.m4a", mimeType: "audio/mp4" as const, durationSeconds: 30 },
  }
}

describe("RenderService audio mixing", () => {
  it("trims a long uploaded track, fades it out, and never loops a shorter source", async () => {
    await RenderService.renderReel(renderInput())

    const args = childProcess.spawn.mock.calls[0]?.[1] as string[]
    const filters = args[args.indexOf("-filter_complex") + 1]
    expect(filters).toContain("[1:a]atrim=duration=15.000")
    expect(filters).toContain("afade=t=out:st=13.500:d=1.500")
    expect(args).toEqual(expect.arrayContaining(["-map", "[a]", "-c:a", "aac"]))
    expect(args).not.toContain("-stream_loop")
    expect(args).not.toContain("-an")
  })

  it("reports a source media download failure without exposing the source URL", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 403, headers: new Headers() })))

    await expect(RenderService.renderReel(renderInput())).rejects.toThrow("Render download failed: Unable to fetch render asset (403).")
  })

  it("includes a sanitized FFmpeg exit code and stderr tail on execution failure", async () => {
    childProcess.spawn.mockImplementation((executable: string) => {
      const stderr = new EventEmitter()
      const stdout = new EventEmitter()
      const child = new EventEmitter() as EventEmitter & { stderr: EventEmitter; stdout: EventEmitter }
      child.stderr = stderr
      child.stdout = stdout
      queueMicrotask(() => {
        if (!executable.endsWith("ffprobe")) {
          stderr.emit("data", "Invalid filter drawtext=text='Private property copy' https://secret.example/token")
          child.emit("close", 1)
        } else child.emit("close", 0)
      })
      return child
    })

    await expect(RenderService.renderReel(renderInput())).rejects.toThrow("Render ffmpeg failed: exit_code=1 Invalid filter drawtext=text='[redacted]' [url]")
  })

  it("reports an output-stage failure when FFmpeg produces no readable MP4", async () => {
    files.readFile.mockRejectedValueOnce(new Error("ENOENT: output file missing"))

    await expect(RenderService.renderReel(renderInput())).rejects.toThrow("Render output failed: ENOENT: output file missing")
  })

  it("reports an upload-stage failure when private storage rejects the MP4", async () => {
    admin.client.storage.from.mockReturnValue({ upload: vi.fn().mockResolvedValue({ error: new Error("Bucket not found") }) })

    await expect(RenderService.renderReel(renderInput())).rejects.toThrow("Render upload failed: Bucket not found")
  })
})
