import { EventEmitter } from "node:events"
import { beforeEach, describe, expect, it, vi } from "vitest"

const childProcess = vi.hoisted(() => ({ spawn: vi.fn() }))
const files = vi.hoisted(() => ({ mkdtemp: vi.fn(), readFile: vi.fn(), rm: vi.fn(), writeFile: vi.fn() }))
const admin = vi.hoisted(() => ({ client: { storage: { from: vi.fn() } } }))
const runtime = vi.hoisted(() => ({
  readFileSync: vi.fn(() => "max"),
  freemem: vi.fn(() => 1024 * 1024 * 1024),
  totalmem: vi.fn(() => 2 * 1024 * 1024 * 1024),
}))

vi.mock("node:child_process", () => childProcess)
vi.mock("node:fs/promises", () => files)
vi.mock("node:fs", async importOriginal => {
  const actual = await importOriginal<typeof import("node:fs")>()
  return { ...actual, readFileSync: runtime.readFileSync }
})
vi.mock("node:os", async importOriginal => {
  const actual = await importOriginal<typeof import("node:os")>()
  return { ...actual, freemem: runtime.freemem, totalmem: runtime.totalmem }
})
vi.mock("@/lib/supabase/admin", () => ({ createAdminSupabaseClient: () => admin.client }))

import { RenderService } from "@/lib/marketing/services/render-service"
import { REEL_ENCODER_THREADS, REEL_FILTER_THREADS, REEL_RENDER_TIMEOUT_MS } from "@/lib/marketing/services/render-service"

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
    headers: new Headers({ "content-type": String(url).includes("licensed") ? "audio/mp4" : String(url).includes("logo") ? "image/png" : "image/jpeg", "content-length": "2048" }),
    arrayBuffer: async () => new ArrayBuffer(2_048),
  })))
  childProcess.spawn.mockImplementation((executable: string) => {
    const stderr = new EventEmitter()
    const stdout = new EventEmitter()
    const child = new EventEmitter() as EventEmitter & { stderr: EventEmitter; stdout: EventEmitter; exitCode?: number | null; signalCode?: string | null; kill?: (signal?: string) => boolean }
    child.stderr = stderr
    child.stdout = stdout
    queueMicrotask(() => {
      if (executable.endsWith("ffprobe")) stdout.emit("data", JSON.stringify({ format: { format_name: "mp4", duration: "8.2" }, streams: [{ codec_type: "video", codec_name: "h264", pix_fmt: "yuv420p", width: 1920, height: 1080, avg_frame_rate: "30/1" }] }))
      child.emit("close", 0)
    })
    return child
  })
})

function renderInput(): Parameters<typeof RenderService.renderReel>[0] {
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

function ffmpegArgs(predicate: (args: string[]) => boolean) {
  const call = childProcess.spawn.mock.calls.find(([, args]) => Array.isArray(args) && predicate(args as string[]))
  return call?.[1] as string[] | undefined
}

describe("RenderService audio mixing", () => {
  it("trims a long uploaded track, fades it out, and never loops a shorter source", async () => {
    await RenderService.renderReel(renderInput())

    const args = ffmpegArgs(args => args.includes("-f") && args.includes("concat"))!
    const filters = args[args.indexOf("-filter_complex") + 1]
    expect(filters).toContain("[1:a]atrim=duration=15.000")
    expect(filters).toContain("afade=t=out:st=13.500:d=1.500")
    expect(args).toEqual(expect.arrayContaining(["-map", "[a]", "-c:a", "aac"]))
    const sceneArgs = ffmpegArgs(args => args.includes("-preset"))!
    expect(sceneArgs).toEqual(expect.arrayContaining([
      "-filter_threads", String(REEL_FILTER_THREADS),
      "-filter_complex_threads", String(REEL_FILTER_THREADS),
      "-preset", "ultrafast",
      "-threads", String(REEL_ENCODER_THREADS),
    ]))
    expect(args).not.toContain("-stream_loop")
    expect(args).not.toContain("-an")
  })

  it("mixes a private logo with safe placement and opacity without changing MP4 encoding", async () => {
    const input = renderInput()
    await RenderService.renderReel({
      ...input,
      logo: { sourceUrl: "https://project.supabase.co/storage/v1/object/sign/logo.png", mimeType: "image/png", placement: "top_right", scale: "small", opacity: 0.65 },
    })
    const args = ffmpegArgs(args => args.includes("-filter_complex"))!
    const filters = args[args.indexOf("-filter_complex") + 1]
    expect(filters).toContain("colorchannelmixer=aa=0.65")
    expect(filters).toContain("overlay=")
    expect(args).toEqual(expect.arrayContaining(["-c:v", "libx264", "-pix_fmt", "yuv420p"]))
  })

  it("applies an end-card-only logo on the final visual scene", async () => {
    const input = renderInput()
    input.composition.scenes.push({ assetId: input.assets[0].id, start: 15, duration: 3, crop: "cover", motion: "none", transitionOut: "fade", overlay: { text: "Discover more", position: "center", type: "end_card" } })
    await RenderService.renderReel({
      ...input,
      logo: { sourceUrl: "https://project.supabase.co/storage/v1/object/sign/logo.png", mimeType: "image/png", placement: "end_card_only", scale: "small", opacity: 0.65 },
    })
    const sceneFilters = childProcess.spawn.mock.calls
      .map(([, args]) => args as string[])
      .filter(args => args.includes("-filter_complex") && args.includes("-preset") && !args.includes("concat"))
    expect(sceneFilters).toHaveLength(1)
    const filters = sceneFilters[0][sceneFilters[0].indexOf("-filter_complex") + 1]
    expect(filters).toContain("[base][logo]overlay=")
  })

  it("uses a fixed installed editorial font for an editorial storyboard style", async () => {
    const input = renderInput()
    input.composition.typographyStyle = "editorial_serif"
    input.composition.scenes[0].overlay = { text: "A quieter way to arrive", position: "top_left", type: "hook" }

    await RenderService.renderReel(input)

    const args = ffmpegArgs(candidate => candidate.includes("-preset"))!
    const filter = args[args.indexOf("-vf") + 1]
    expect(filter).toContain("fontfile='/usr/share/fonts/truetype/lindenhill/LindenHill.otf'")
    expect(filter).not.toContain("DejaVuSans.ttf")
  })

  it("passes normalized overlay lines through a local drawtext textfile without escaping visible copy", async () => {
    const input = renderInput()
    input.composition.typographyStyle = "refined_serif"
    input.composition.scenes[0].overlay = {
      text: "Fully furnished • Premium interiors\\nIndo-Portuguese • Tuscan • Japandi",
      position: "lower_left",
      type: "key_fact",
    }

    await RenderService.renderReel(input)

    const textWrite = files.writeFile.mock.calls.find(([path]) => String(path).endsWith("overlay-0.txt"))
    const drawnText = String(textWrite?.[1] ?? "")
    const args = ffmpegArgs(candidate => candidate.includes("-preset"))!
    const filter = args[args.indexOf("-vf") + 1]
    expect(drawnText).not.toContain("Premiumninteriors")
    expect(drawnText).not.toContain("•n")
    expect(drawnText).not.toContain("\\n")
    expect(filter).toContain("textfile='/tmp/marketing-render-test/overlay-0.txt'")
    expect(filter).toContain("expansion=none")
    expect(filter).toContain("LiberationSerif-Regular.ttf")
    expect(filter).not.toContain("text='Fully furnished")
  })

  it("reports a source media download failure without exposing the source URL", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 403, headers: new Headers() })))

    const input = renderInput()
    input.audio = null
    input.composition.audio = { type: "none", label: "Silent Reel" }
    await expect(RenderService.renderReel(input)).rejects.toThrow("Render scene failed: Scene 1: Unable to fetch render asset (403).")
  })

  it("includes a sanitized FFmpeg exit code and stderr tail on execution failure", async () => {
    childProcess.spawn.mockImplementation((executable: string) => {
      const stderr = new EventEmitter()
      const stdout = new EventEmitter()
      const child = new EventEmitter() as EventEmitter & { stderr: EventEmitter; stdout: EventEmitter; exitCode?: number | null; signalCode?: string | null; kill?: (signal?: string) => boolean }
      child.stderr = stderr
      child.stdout = stdout
      queueMicrotask(() => {
        if (executable.endsWith("ffprobe")) {
          stdout.emit("data", JSON.stringify({ format: { duration: "8.2" }, streams: [{ codec_type: "video", codec_name: "h264", pix_fmt: "yuv420p", width: 1920, height: 1080, avg_frame_rate: "30/1" }] }))
          child.emit("close", 0)
        } else {
          stderr.emit("data", "Invalid filter drawtext=text='Private property copy' https://secret.example/token")
          child.emit("close", 1)
        }
      })
      return child
    })

    await expect(RenderService.renderReel(renderInput())).rejects.toThrow("Render ffmpeg failed: Scene 1: exit_code=1; Invalid filter drawtext=text='[redacted]' [url]")
  })

  it("reports an output-stage failure when FFmpeg produces no readable MP4", async () => {
    files.readFile.mockRejectedValueOnce(new Error("ENOENT: output file missing"))

    await expect(RenderService.renderReel(renderInput())).rejects.toThrow("Render output failed: ENOENT: output file missing")
  })

  it("reports an upload-stage failure when private storage rejects the MP4", async () => {
    admin.client.storage.from.mockReturnValue({ upload: vi.fn().mockResolvedValue({ error: new Error("Bucket not found") }) })

    await expect(RenderService.renderReel(renderInput())).rejects.toThrow("Render upload failed: Bucket not found")
  })

  it("persists a null exit code with SIGKILL as an external FFmpeg termination", async () => {
    childProcess.spawn.mockImplementation((executable: string) => {
      const stderr = new EventEmitter()
      const stdout = new EventEmitter()
      const child = new EventEmitter() as EventEmitter & { stderr: EventEmitter; stdout: EventEmitter; exitCode?: number | null; signalCode?: string | null }
      child.stderr = stderr
      child.stdout = stdout
      queueMicrotask(() => {
        if (executable.endsWith("ffprobe")) {
          stdout.emit("data", JSON.stringify({ format: { duration: "8.2" }, streams: [{ codec_type: "video", codec_name: "h264", pix_fmt: "yuv420p", width: 1920, height: 1080, avg_frame_rate: "30/1" }] }))
          child.emit("close", 0)
        } else {
          child.exitCode = null
          child.signalCode = "SIGKILL"
          child.emit("close", null, "SIGKILL")
        }
      })
      return child
    })

    await expect(RenderService.renderReel(renderInput())).rejects.toThrow("Render ffmpeg failed: Scene 1: FFmpeg process was terminated externally by SIGKILL")
  })

  it("reports an explicit renderer timeout when its timeout terminates FFmpeg", async () => {
    vi.useFakeTimers()
    try {
      let killedWith: string | undefined
      childProcess.spawn.mockImplementation((executable: string) => {
        const stderr = new EventEmitter()
        const stdout = new EventEmitter()
        const child = new EventEmitter() as EventEmitter & { stderr: EventEmitter; stdout: EventEmitter; exitCode?: number | null; signalCode?: string | null; kill: (signal?: string) => boolean }
        child.stderr = stderr
        child.stdout = stdout
        child.kill = signal => {
          killedWith = signal
          child.exitCode = null
          child.signalCode = signal ?? null
          queueMicrotask(() => child.emit("close", null, signal))
          return true
        }
        if (executable.endsWith("ffprobe")) queueMicrotask(() => {
          stdout.emit("data", JSON.stringify({ format: { duration: "8.2" }, streams: [{ codec_type: "video", codec_name: "h264", pix_fmt: "yuv420p", width: 1920, height: 1080, avg_frame_rate: "30/1" }] }))
          child.emit("close", 0)
        })
        return child
      })

      const rendering = RenderService.renderReel(renderInput())
      const rejection = expect(rendering).rejects.toThrow(`Render ffmpeg failed: Scene 1: Render timed out after ${REEL_RENDER_TIMEOUT_MS / 1_000} seconds; no FFmpeg stderr was available`)
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(REEL_RENDER_TIMEOUT_MS)

      await rejection
      expect(killedWith).toBe("SIGKILL")
    } finally {
      vi.useRealTimers()
    }
  })

  it("normalizes a 4K 60fps HEVC source to a silent 720x1280 proxy before rendering its scene", async () => {
    childProcess.spawn.mockImplementation((executable: string, args: string[]) => {
      const stderr = new EventEmitter()
      const stdout = new EventEmitter()
      const child = new EventEmitter() as EventEmitter & { stderr: EventEmitter; stdout: EventEmitter; exitCode?: number | null; signalCode?: string | null }
      child.stderr = stderr
      child.stdout = stdout
      queueMicrotask(() => {
        if (executable.endsWith("ffprobe")) {
          const sourceProbe = args.some(argument => String(argument).endsWith("source-0.mp4"))
          stdout.emit("data", JSON.stringify(sourceProbe
            ? { format: { duration: "8.2" }, streams: [{ codec_type: "video", codec_name: "hevc", pix_fmt: "yuv420p10le", width: 3840, height: 2160, avg_frame_rate: "60/1", color_transfer: "smpte2084" }] }
            : { format: { format_name: "mp4" }, streams: [{ codec_type: "video", codec_name: "h264", pix_fmt: "yuv420p" }] }))
        }
        child.emit("close", 0)
      })
      return child
    })
    const input = renderInput()
    input.assets[0] = { ...input.assets[0], mediaType: "video", sourceUrl: "https://project.supabase.co/storage/v1/object/sign/property.mp4" }

    await RenderService.renderReel(input)

    const ffmpegCalls = childProcess.spawn.mock.calls
      .filter(([executable]) => !String(executable).endsWith("ffprobe"))
      .map(([, args]) => args as string[])
    const normalized = ffmpegCalls.find(args => args.some(argument => String(argument).endsWith("normalized-0.mp4")))!
    const scene = ffmpegCalls.find(args => args.some(argument => String(argument).endsWith("scene-0.mp4")))!
    expect(normalized).toEqual(expect.arrayContaining(["-an", "-preset", "ultrafast", "-threads", "1", "-vf", "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,setsar=1,format=yuv420p"]))
    expect(scene).toEqual(expect.arrayContaining(["-preset", "ultrafast", "-threads", "1", "-pix_fmt", "yuv420p"]))
    expect(scene).toContain("/tmp/marketing-render-test/normalized-0.mp4")
    expect(files.rm).toHaveBeenCalledWith("/tmp/marketing-render-test/normalized-0.mp4", { force: true })
  })

  it("renders complex Reels as isolated scene MP4s before a lightweight concat", async () => {
    const input = renderInput()
    input.audio = null
    input.composition.audio = { type: "none", label: "Silent Reel" }
    for (let index = 1; index < 10; index += 1) {
      input.composition.scenes.push({
        assetId: input.assets[0].id, start: index * 3, duration: 3, crop: "cover", motion: "slow_zoom", transitionOut: "fade",
        overlay: { text: `Scene ${index + 1}`, position: "lower_left", type: "key_fact" },
      })
    }

    await RenderService.renderReel(input)

    const ffmpegCalls = childProcess.spawn.mock.calls
      .filter(([executable]) => !String(executable).endsWith("ffprobe"))
      .map(([, args]) => args as string[])
    expect(ffmpegCalls).toHaveLength(11)
    const sceneCalls = ffmpegCalls.filter(args => args.includes("-preset") && !args.includes("concat"))
    expect(sceneCalls).toHaveLength(10)
    expect(sceneCalls.every(args => !args.includes("xfade"))).toBe(true)
    expect(sceneCalls.every(args => args.filter(arg => arg === "-i").length <= 1)).toBe(true)
    const concat = ffmpegCalls.find(args => args.includes("concat"))!
    expect(concat).toEqual(expect.arrayContaining(["-f", "concat", "-c:v", "libx264", "-an", "-vf", "scale=1080:1920:flags=lanczos,format=yuv420p"]))
  })

  it("identifies the scene when an externally killed renderer stops a complex Reel", async () => {
    let renderCount = 0
    childProcess.spawn.mockImplementation((executable: string) => {
      const stderr = new EventEmitter()
      const stdout = new EventEmitter()
      const child = new EventEmitter() as EventEmitter & { stderr: EventEmitter; stdout: EventEmitter; exitCode?: number | null; signalCode?: string | null }
      child.stderr = stderr
      child.stdout = stdout
      queueMicrotask(() => {
        if (executable.endsWith("ffprobe")) {
          stdout.emit("data", JSON.stringify({ format: { duration: "8.2" }, streams: [{ codec_type: "video", codec_name: "h264", pix_fmt: "yuv420p", width: 1920, height: 1080, avg_frame_rate: "30/1" }] }))
          child.emit("close", 0)
          return
        }
        renderCount += 1
        if (renderCount === 7) {
          child.exitCode = null
          child.signalCode = "SIGKILL"
          child.emit("close", null, "SIGKILL")
          return
        }
        child.emit("close", 0)
      })
      return child
    })

    const input = renderInput()
    input.audio = null
    input.composition.audio = { type: "none", label: "Silent Reel" }
    for (let index = 1; index < 10; index += 1) {
      input.composition.scenes.push({
        assetId: input.assets[0].id, start: index * 3, duration: 3, crop: "cover", motion: "none", transitionOut: "fade",
      })
    }

    await expect(RenderService.renderReel(input)).rejects.toThrow("Render ffmpeg failed: Scene 7: FFmpeg process was terminated externally by SIGKILL")
  })
})
