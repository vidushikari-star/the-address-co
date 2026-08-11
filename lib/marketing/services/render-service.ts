import { spawn } from "node:child_process"
import { createWriteStream } from "node:fs"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { Readable, Transform } from "node:stream"
import { pipeline } from "node:stream/promises"

import { logRenderStage, renderStageFailure, sanitizeRenderDiagnostic } from "@/lib/marketing/render-diagnostics"
import { layoutReelOverlay, logoLayout, type ReelOverlayLayout } from "@/lib/marketing/reel-layout"
import { normalizeReelTypographyStyle, reelTypographyFontFile } from "@/lib/marketing/reel-typography"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import type { MarketingAsset, ReelComposition } from "@/lib/marketing/types"

const MAX_RENDER_INPUT_BYTES = 75 * 1024 * 1024
const MAX_AUDIO_INPUT_BYTES = 25 * 1024 * 1024
const MAX_LOGO_INPUT_BYTES = 5 * 1024 * 1024
export const REEL_ENCODER_THREADS = 2
export const REEL_FILTER_THREADS = 2
export const REEL_RENDER_TIMEOUT_MS = 4 * 60_000
const REEL_RENDER_PRESET = "veryfast"
const REEL_RESOLUTION = "1080x1920"
const REEL_FPS = 30

function allowedMediaOrigin(url: URL) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return false

  return url.origin === new URL(supabaseUrl).origin
}

function safeExtension(asset: MarketingAsset) {
  const fromUrl = asset.sourceUrl ?? asset.signedUrl ?? ""
  const match = fromUrl.match(/\.([a-zA-Z0-9]{2,5})(?:[?#]|$)/)
  const extension = match?.[1]?.toLowerCase()
  if (extension && ["jpg", "jpeg", "png", "webp", "mp4", "mov", "webm"].includes(extension)) {
    return extension
  }
  return asset.mediaType === "video" ? "mp4" : "jpg"
}

async function saveResponseToFile(response: Response, destination: string, maximumBytes: number, limitMessage: string) {
  const contentLength = Number(response.headers.get("content-length") ?? 0)
  if (contentLength > maximumBytes) throw new Error(limitMessage)

  // Fetch provides a web stream in Railway. Keep the bounded fallback for the
  // test harnesses and older fetch implementations that expose only bytes.
  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer())
    if (bytes.byteLength > maximumBytes) throw new Error(limitMessage)
    await writeFile(destination, bytes)
    return
  }

  let written = 0
  const guard = new Transform({
    transform(chunk, _encoding, callback) {
      written += Buffer.byteLength(chunk)
      if (written > maximumBytes) {
        callback(new Error(limitMessage))
        return
      }
      callback(null, chunk)
    },
  })
  await pipeline(Readable.fromWeb(response.body as unknown as import("node:stream/web").ReadableStream), guard, createWriteStream(destination))
}

async function downloadAsset(asset: MarketingAsset, destination: string) {
  const sourceUrl = asset.sourceUrl ?? asset.signedUrl
  if (!sourceUrl) throw new Error("A composition asset has no source URL.")

  const url = new URL(sourceUrl)
  if (!allowedMediaOrigin(url)) {
    throw new Error("Renderer rejected an asset outside of configured Supabase storage.")
  }

  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  if (!response.ok) throw new Error(`Unable to fetch render asset (${response.status}).`)

  const mime = response.headers.get("content-type") ?? ""
  if (!mime.startsWith("image/") && !mime.startsWith("video/")) {
    throw new Error("Renderer received an unsupported asset MIME type.")
  }

  await saveResponseToFile(response, destination, MAX_RENDER_INPUT_BYTES, "A render asset exceeds the 75 MB safety limit.")
}

function audioExtension(mimeType: string) {
  if (mimeType === "audio/mpeg") return "mp3"
  if (mimeType === "audio/wav") return "wav"
  return "m4a"
}

async function downloadAudio(input: { sourceUrl: string; mimeType: string }, destination: string) {
  const url = new URL(input.sourceUrl)
  if (!allowedMediaOrigin(url)) {
    throw new Error("Renderer rejected audio outside of configured Supabase storage.")
  }

  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  if (!response.ok) throw new Error(`Unable to fetch selected audio (${response.status}).`)
  const mimeType = (response.headers.get("content-type") ?? "").split(";", 1)[0]?.toLocaleLowerCase()
  if (!mimeType || !["audio/mpeg", "audio/mp4", "audio/wav"].includes(mimeType)) {
    throw new Error("Renderer received an unsupported audio MIME type.")
  }
  await saveResponseToFile(response, destination, MAX_AUDIO_INPUT_BYTES, "Selected audio exceeds the 25 MB safety limit.")
}

function escapeDrawtextFilePath(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'")
    .replaceAll(":", "\\:")
    .replaceAll(",", "\\,")
}

/**
 * Drawtext reads the normalized visual text from a local file. This avoids
 * filtergraph escaping of content (especially logical line breaks) entirely;
 * only our generated temporary file path needs filter escaping.
 */
function textOverlayFilter(input: {
  layout: ReelOverlayLayout | null
  textFilePath: string | null
  typographyStyle?: ReelComposition["typographyStyle"]
}) {
  if (!input.layout || !input.textFilePath) return ""
  const x = input.layout.alignment === "center" ? "(w-text_w)/2" : String(input.layout.x)
  const fontFile = reelTypographyFontFile(input.typographyStyle)
  return `,drawtext=fontfile='${fontFile}':textfile='${escapeDrawtextFilePath(input.textFilePath)}':expansion=none:fontcolor=white:fontsize=${input.layout.fontSize}:line_spacing=${input.layout.lineSpacing}:box=1:boxcolor=black@${input.layout.boxOpacity.toFixed(2)}:boxborderw=${input.layout.boxPadding}:shadowcolor=black@0.65:shadowx=2:shadowy=2:x=${x}:y=${input.layout.y}`
}

async function downloadLogo(input: { sourceUrl: string; mimeType: "image/png" | "image/webp" }, destination: string) {
  const url = new URL(input.sourceUrl)
  if (!allowedMediaOrigin(url)) throw new Error("Renderer rejected a logo outside of configured Supabase storage.")
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  if (!response.ok) throw new Error(`Unable to fetch selected logo (${response.status}).`)
  const mime = (response.headers.get("content-type") ?? "").split(";", 1)[0]?.toLocaleLowerCase()
  if (!mime || !["image/png", "image/webp"].includes(mime)) throw new Error("Renderer received an unsupported logo MIME type.")
  await saveResponseToFile(response, destination, MAX_LOGO_INPUT_BYTES, "Selected logo exceeds the 5 MB safety limit.")
}

type FfmpegRenderContext = {
  strategy?: "per_scene" | "single_graph"
  phase?: "scene" | "concat" | "image"
  sceneIndex?: number
}

function approxProcessRssMb() {
  try {
    return Math.round(process.memoryUsage().rss / 1024 / 1024)
  } catch {
    return 0
  }
}

async function runFfmpeg(
  args: string[],
  inputCount: number,
  hasAudio: boolean,
  targetDuration: number,
  context: FfmpegRenderContext = {},
) {
  const executable = process.env.FFMPEG_PATH || "ffmpeg"
  const startedAt = Date.now()
  logRenderStage("ffmpeg", "started", {
    input_assets: inputCount,
    target_duration_seconds: targetDuration.toFixed(3),
    resolution: REEL_RESOLUTION,
    fps: REEL_FPS,
    encoder_threads: REEL_ENCODER_THREADS,
    filter_threads: REEL_FILTER_THREADS,
    filter_complex_threads: REEL_FILTER_THREADS,
    preset: REEL_RENDER_PRESET,
    timeout_seconds: REEL_RENDER_TIMEOUT_MS / 1_000,
    audio: hasAudio,
    render_strategy: context.strategy ?? "single_graph",
    phase: context.phase ?? "image",
    scene_index: context.sceneIndex ?? 0,
    rss_mb: approxProcessRssMb(),
  })

  return new Promise<number>((resolve, reject) => {
    const child = spawn(executable, args, {
      shell: false,
      stdio: ["ignore", "ignore", "pipe"],
    })
    let stderr = ""
    let timedOut = false
    const timeout = setTimeout(() => {
      timedOut = true
      child.kill("SIGKILL")
    }, REEL_RENDER_TIMEOUT_MS)
    timeout.unref?.()
    child.stderr.on("data", data => { stderr = `${stderr}${String(data)}`.slice(-4_000) })
    child.on("error", error => {
      clearTimeout(timeout)
      reject(renderStageFailure("ffmpeg", `could not start (${sanitizeRenderDiagnostic(error)})`))
    })
    child.on("close", (code, signal) => {
      clearTimeout(timeout)
      const elapsedMs = Date.now() - startedAt
      const exitCode = child.exitCode ?? code
      const terminationSignal = child.signalCode ?? signal
      if (code === 0) {
        logRenderStage("ffmpeg", "ok", { exit_code: exitCode ?? 0, elapsed_ms: elapsedMs, timed_out: timedOut, render_strategy: context.strategy ?? "single_graph", phase: context.phase ?? "image", scene_index: context.sceneIndex ?? 0, rss_mb: approxProcessRssMb() })
        resolve(elapsedMs)
      } else {
        const reason = sanitizeRenderDiagnostic(stderr, 700) || "no FFmpeg stderr was available"
        const terminationReason = timedOut
          ? `Render timed out after ${REEL_RENDER_TIMEOUT_MS / 1_000} seconds`
          : exitCode === null && (terminationSignal === "SIGKILL" || terminationSignal === "SIGTERM")
            ? `FFmpeg was terminated by ${terminationSignal}`
            : exitCode === null
              ? `FFmpeg exited without a numeric exit code${terminationSignal ? ` (signal=${terminationSignal})` : ""}`
              : `exit_code=${exitCode}`
        logRenderStage("ffmpeg", "failed", {
          exit_code: exitCode ?? "null",
          signal: terminationSignal ?? "none",
          elapsed_ms: elapsedMs,
          timed_out: timedOut,
          reason,
          render_strategy: context.strategy ?? "single_graph",
          phase: context.phase ?? "image",
          scene_index: context.sceneIndex ?? 0,
          rss_mb: approxProcessRssMb(),
        })
        const scenePrefix = context.sceneIndex ? `Scene ${context.sceneIndex}: ` : ""
        reject(renderStageFailure("ffmpeg", `${scenePrefix}${terminationReason}; ${reason}`))
      }
    })
  })
}

function ffprobeExecutable() {
  const configured = process.env.FFPROBE_PATH?.trim()
  if (configured) return configured
  const ffmpeg = process.env.FFMPEG_PATH?.trim()
  return ffmpeg?.includes("/") ? join(dirname(ffmpeg), "ffprobe") : "ffprobe"
}

async function validateRenderedMp4(path: string) {
  const executable = ffprobeExecutable()
  const output = await new Promise<string>((resolve, reject) => {
    const child = spawn(executable, [
      "-v", "error",
      "-show_entries", "format=format_name:stream=codec_type,codec_name,pix_fmt",
      "-of", "json",
      path,
    ], { shell: false, stdio: ["ignore", "pipe", "pipe"] })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", data => { stdout = `${stdout}${String(data)}`.slice(-4_000) })
    child.stderr.on("data", data => { stderr = `${stderr}${String(data)}`.slice(-2_000) })
    child.on("error", error => reject(new Error(`ffprobe could not start (${sanitizeRenderDiagnostic(error)})`)))
    child.on("close", code => code === 0
      ? resolve(stdout)
      : reject(new Error(`ffprobe exited with ${code ?? "unknown"}: ${sanitizeRenderDiagnostic(stderr, 500)}`)))
  })
  let parsed: { format?: { format_name?: unknown }; streams?: Array<{ codec_type?: unknown; codec_name?: unknown; pix_fmt?: unknown }> }
  try {
    parsed = JSON.parse(output) as typeof parsed
  } catch {
    throw new Error("ffprobe returned invalid output.")
  }
  const formats = String(parsed.format?.format_name ?? "").split(",")
  const video = parsed.streams?.find(stream => stream.codec_type === "video")
  if (!formats.includes("mp4") || video?.codec_name !== "h264" || video.pix_fmt !== "yuv420p") {
    throw new Error("Rendered output is not an H.264 yuv420p MP4.")
  }
}

function sceneInputArgs(asset: MarketingAsset, sourcePath: string, duration: number) {
  return asset.mediaType === "image"
    ? ["-loop", "1", "-t", duration.toFixed(3), "-i", sourcePath]
    : ["-stream_loop", "-1", "-t", duration.toFixed(3), "-i", sourcePath]
}

function sceneVideoFilter(layout: ReelOverlayLayout | null, overlayTextPath: string | null, typographyStyle: ReelComposition["typographyStyle"]) {
  return `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=${REEL_FPS},setsar=1${textOverlayFilter({ layout, textFilePath: overlayTextPath, typographyStyle })}`
}

function sceneRenderArgs(input: {
  asset: MarketingAsset
  sourcePath: string
  outputPath: string
  scene: ReelComposition["scenes"][number]
  typographyStyle: ReelComposition["typographyStyle"]
  overlayLayout: ReelOverlayLayout | null
  overlayTextPath: string | null
  logo?: { path: string; x: number; y: number; size: number; opacity: number } | null
}) {
  const args = [
    "-y",
    "-filter_threads", String(REEL_FILTER_THREADS),
    "-filter_complex_threads", String(REEL_FILTER_THREADS),
    ...sceneInputArgs(input.asset, input.sourcePath, input.scene.duration),
  ]
  const filter = sceneVideoFilter(input.overlayLayout, input.overlayTextPath, input.typographyStyle)
  if (input.logo) {
    args.push("-loop", "1", "-i", input.logo.path)
    args.push(
      "-filter_complex",
      `[0:v]${filter}[base];[1:v]format=rgba,colorchannelmixer=aa=${input.logo.opacity.toFixed(2)},scale=${input.logo.size}:-1[logo];[base][logo]overlay=${input.logo.x}:${input.logo.y}:format=auto[v]`,
      "-map", "[v]",
    )
  } else {
    args.push("-vf", filter, "-map", "0:v:0")
  }
  args.push(
    "-t", input.scene.duration.toFixed(3),
    "-an",
    "-c:v", "libx264",
    "-preset", REEL_RENDER_PRESET,
    "-threads", String(REEL_ENCODER_THREADS),
    "-pix_fmt", "yuv420p",
    "-r", String(REEL_FPS),
    "-movflags", "+faststart",
    input.outputPath,
  )
  return args
}

function concatManifest(paths: string[]) {
  // Local temporary paths are generated by us; quote them only for ffconcat.
  return paths.map(path => `file '${path.replaceAll("'", "'\\''")}'`).join("\n")
}

function concatRenderArgs(input: {
  manifestPath: string
  outputPath: string
  totalDuration: number
  audioPath?: string | null
  audioDuration?: number | null
}) {
  const args = [
    "-y",
    "-filter_threads", String(REEL_FILTER_THREADS),
    "-filter_complex_threads", String(REEL_FILTER_THREADS),
    "-f", "concat", "-safe", "0", "-i", input.manifestPath,
  ]
  if (input.audioPath) args.push("-i", input.audioPath)
  args.push("-map", "0:v:0")
  if (input.audioPath && input.audioDuration) {
    const audibleDuration = Math.min(input.totalDuration, input.audioDuration)
    const fadeDuration = audibleDuration > 0.4 ? Math.min(1.5, audibleDuration / 4) : 0
    const fade = fadeDuration > 0
      ? `,afade=t=out:st=${Math.max(0, audibleDuration - fadeDuration).toFixed(3)}:d=${fadeDuration.toFixed(3)}`
      : ""
    args.push("-filter_complex", `[1:a]atrim=duration=${input.totalDuration.toFixed(3)},asetpts=N/SR/TB${fade}[a]`, "-map", "[a]", "-c:a", "aac", "-b:a", "160k")
  } else {
    args.push("-an")
  }
  args.push("-c:v", "copy", "-movflags", "+faststart", input.outputPath)
  return args
}

export class RenderService {
  static async renderImage(input: {
    contentId: string
    asset: MarketingAsset
    aspectRatio?: "9:16" | "1:1" | "4:5"
    overlayText?: string
  }) {
    // These are worker-only temporary files, not application assets. Keep
    // Turbopack from attempting to trace the runtime-generated OS path.
    const workspace = await mkdtemp(join(/* turbopackIgnore: true */ tmpdir(), "marketing-image-"))
    const sourcePath = join(/* turbopackIgnore: true */ workspace, `source.${safeExtension(input.asset)}`)
    const outputPath = join(/* turbopackIgnore: true */ workspace, "rendered.jpg")
    const overlayLayout = layoutReelOverlay({ text: input.overlayText, position: "bottom" })
    const overlayTextPath = overlayLayout
      ? join(/* turbopackIgnore: true */ workspace, "overlay.txt")
      : null
    const dimensions = input.aspectRatio === "1:1"
      ? { width: 1080, height: 1080 }
      : input.aspectRatio === "4:5"
        ? { width: 1080, height: 1350 }
        : { width: 1080, height: 1920 }

    try {
      await downloadAsset(input.asset, sourcePath)
      if (overlayLayout && overlayTextPath) await writeFile(overlayTextPath, overlayLayout.text, "utf8")
      await runFfmpeg([
        "-y", "-i", sourcePath,
        "-vf", `scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=increase,crop=${dimensions.width}:${dimensions.height}${textOverlayFilter({ layout: overlayLayout, textFilePath: overlayTextPath })}`,
        "-frames:v", "1",
        "-q:v", "2",
        outputPath,
      ], 1, false, 0)
      const rendered = await readFile(outputPath)
      if (rendered.byteLength < 1_024) throw new Error("FFmpeg produced an invalid image asset.")
      const storagePath = `${input.contentId}/rendered/${crypto.randomUUID()}.jpg`
      const admin = createAdminSupabaseClient()
      const { error } = await admin.storage.from("marketing-assets").upload(
        storagePath,
        rendered,
        { contentType: "image/jpeg", upsert: false }
      )
      if (error) throw error
      return { storagePath, byteLength: rendered.byteLength }
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  }

  static async renderReel(input: {
    contentId: string
    composition: ReelComposition
    assets: MarketingAsset[]
    audio?: {
      sourceUrl: string
      mimeType: "audio/mpeg" | "audio/mp4" | "audio/wav"
      durationSeconds: number
    } | null
    logo?: {
      sourceUrl: string
      mimeType: "image/png" | "image/webp"
      placement: Exclude<NonNullable<ReelComposition["logo"]>["placement"], "none">
      scale: NonNullable<ReelComposition["logo"]>["scale"]
      opacity: number
      margin?: number
    } | null
  }) {
    let compositionAssets: Array<{ scene: ReelComposition["scenes"][number]; asset: MarketingAsset }>
    try {
      compositionAssets = input.composition.scenes.map(scene => {
        const asset = input.assets.find(candidate => candidate.id === scene.assetId)
        if (!asset || !["image", "video"].includes(asset.mediaType)) {
          throw new Error("Composition references an unavailable image or video asset.")
        }
        return { scene, asset }
      })
      if (!compositionAssets.length) throw new Error("A Reel composition needs at least one scene.")
      logRenderStage("input", "ok", { input_asset_count: compositionAssets.length, scenes: compositionAssets.length, audio: Boolean(input.audio), logo: Boolean(input.logo), render_strategy: "per_scene", typography_style: normalizeReelTypographyStyle(input.composition.typographyStyle) })
    } catch (error) {
      throw renderStageFailure("input", error)
    }

    let workspace: string | null = null
    try {
      try {
        workspace = await mkdtemp(join(/* turbopackIgnore: true */ tmpdir(), "marketing-render-"))
        logRenderStage("workspace", "ok")
      } catch (error) {
        throw renderStageFailure("workspace", error)
      }
      const outputPath = join(/* turbopackIgnore: true */ workspace, "reel.mp4")

      const audioPath = input.audio
        ? join(/* turbopackIgnore: true */ workspace, `audio.${audioExtension(input.audio.mimeType)}`)
        : null
      const logoPath = input.logo
        ? join(/* turbopackIgnore: true */ workspace, `logo.${input.logo.mimeType === "image/webp" ? "webp" : "png"}`)
        : null
      try {
        if (audioPath && input.audio) await downloadAudio(input.audio, audioPath)
        if (logoPath && input.logo) await downloadLogo(input.logo, logoPath)
        logRenderStage("download", "ok", { sources: 0, audio: Boolean(input.audio), logo: Boolean(input.logo), render_strategy: "per_scene" })
      } catch (error) {
        throw renderStageFailure("download", error)
      }

      const logo = input.logo ? logoLayout(input.logo.placement, input.logo.scale, input.logo.margin) : null
      const typographyStyle = normalizeReelTypographyStyle(input.composition.typographyStyle)
      const scenePaths: string[] = []
      const totalDuration = compositionAssets.reduce((total, item) => total + item.scene.duration, 0)
      for (const [index, { scene, asset }] of compositionAssets.entries()) {
        const sourcePath = join(/* turbopackIgnore: true */ workspace, `source-${index}.${safeExtension(asset)}`)
        const scenePath = join(/* turbopackIgnore: true */ workspace, `scene-${index}.mp4`)
        const overlayLayout = layoutReelOverlay({
          text: scene.overlay?.text,
          position: scene.overlay?.position,
          type: scene.overlay?.type,
        })
        const overlayTextPath = overlayLayout
          ? join(/* turbopackIgnore: true */ workspace, `overlay-${index}.txt`)
          : null
        const shouldApplyLogo = Boolean(logoPath && logo && (
          input.logo?.placement !== "end_card_only" || index === compositionAssets.length - 1
        ))
        const sceneLogo = shouldApplyLogo && logoPath && logo
          ? { path: logoPath, x: logo.x, y: logo.y, size: logo.size, opacity: Math.max(0.1, Math.min(1, input.logo?.opacity ?? 0.65)) }
          : null
        try {
          logRenderStage("scene", "started", {
            render_strategy: "per_scene",
            scene_index: index + 1,
            target_duration_seconds: scene.duration.toFixed(3),
            overlay_lines: overlayLayout?.lines.length ?? 0,
            font_size: overlayLayout?.fontSize ?? 0,
            layout_status: overlayLayout?.status ?? "empty",
            rss_mb: approxProcessRssMb(),
          })
          await downloadAsset(asset, sourcePath)
          logRenderStage("download", "ok", { render_strategy: "per_scene", scene_index: index + 1 })
          if (overlayLayout && overlayTextPath) await writeFile(overlayTextPath, overlayLayout.text, "utf8")
          const elapsedMs = await runFfmpeg(sceneRenderArgs({
            asset,
            sourcePath,
            outputPath: scenePath,
            scene,
            typographyStyle,
            overlayLayout,
            overlayTextPath,
            logo: sceneLogo,
          }), 1 + Number(Boolean(sceneLogo)), false, scene.duration, { strategy: "per_scene", phase: "scene", sceneIndex: index + 1 })
          scenePaths.push(scenePath)
          logRenderStage("scene", "ok", { render_strategy: "per_scene", scene_index: index + 1, elapsed_ms: elapsedMs, rss_mb: approxProcessRssMb() })
        } catch (error) {
          // The ffmpeg error itself retains the `ffmpeg` stage so SIGKILL and
          // timeout logic still marks the job/content terminally and safely.
          if (error instanceof Error && error.message.includes("Render ffmpeg failed:")) throw error
          throw renderStageFailure("scene", `Scene ${index + 1}: ${sanitizeRenderDiagnostic(error)}`)
        } finally {
          await rm(sourcePath, { force: true })
          if (overlayTextPath) await rm(overlayTextPath, { force: true })
        }
      }

      const manifestPath = join(/* turbopackIgnore: true */ workspace, "scenes.ffconcat")
      try {
        await writeFile(manifestPath, concatManifest(scenePaths))
        logRenderStage("concat", "started", { render_strategy: "per_scene", scenes: scenePaths.length, target_duration_seconds: totalDuration.toFixed(3), rss_mb: approxProcessRssMb() })
        const elapsedMs = await runFfmpeg(concatRenderArgs({ manifestPath, outputPath, totalDuration, audioPath, audioDuration: input.audio?.durationSeconds }), 1 + Number(Boolean(audioPath)), Boolean(input.audio), totalDuration, { strategy: "per_scene", phase: "concat" })
        logRenderStage("concat", "ok", { render_strategy: "per_scene", scenes: scenePaths.length, elapsed_ms: elapsedMs, rss_mb: approxProcessRssMb() })
      } catch (error) {
        if (error instanceof Error && error.message.includes("Render ffmpeg failed:")) throw error
        throw renderStageFailure("concat", error)
      } finally {
        await Promise.all([...scenePaths, manifestPath].map(path => rm(path, { force: true })))
      }

      let rendered: Buffer
      try {
        rendered = await readFile(outputPath)
        if (rendered.byteLength < 1_024) throw new Error("FFmpeg produced an invalid Reel file.")
        await validateRenderedMp4(outputPath)
        logRenderStage("output", "ok", { bytes: rendered.byteLength, codec: "h264", container: "mp4" })
      } catch (error) {
        throw renderStageFailure("output", error)
      }

      const storagePath = `${input.contentId}/rendered/${crypto.randomUUID()}.mp4`
      try {
        const admin = createAdminSupabaseClient()
        const { error } = await admin.storage
          .from("marketing-assets")
          .upload(storagePath, rendered, { contentType: "video/mp4", upsert: false })
        if (error) throw error
        logRenderStage("upload", "ok", { bytes: rendered.byteLength })
      } catch (error) {
        throw renderStageFailure("upload", error)
      }

      return { storagePath, byteLength: rendered.byteLength, duration: totalDuration }
    } finally {
      if (workspace) {
        try {
          await rm(workspace, { recursive: true, force: true })
        } catch (error) {
          logRenderStage("workspace", "failed", { reason: sanitizeRenderDiagnostic(error) })
        }
      }
    }
  }

  static isInstagramCompatibleReel(asset: MarketingAsset | undefined) {
    return Boolean(asset && asset.mediaType === "video" && asset.storagePath?.endsWith(".mp4"))
  }
}
