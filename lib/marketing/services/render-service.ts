import { spawn } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"

import { logRenderStage, renderStageFailure, sanitizeRenderDiagnostic } from "@/lib/marketing/render-diagnostics"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import type { MarketingAsset, ReelComposition } from "@/lib/marketing/types"

const MAX_RENDER_INPUT_BYTES = 75 * 1024 * 1024
const MAX_AUDIO_INPUT_BYTES = 25 * 1024 * 1024
const TRANSITION_DURATION = 0.4

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

  const contentLength = Number(response.headers.get("content-length") ?? 0)
  if (contentLength > MAX_RENDER_INPUT_BYTES) {
    throw new Error("A render asset exceeds the 75 MB safety limit.")
  }

  const bytes = new Uint8Array(await response.arrayBuffer())
  if (bytes.byteLength > MAX_RENDER_INPUT_BYTES) {
    throw new Error("A render asset exceeds the 75 MB safety limit.")
  }

  await writeFile(destination, bytes)
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
  const contentLength = Number(response.headers.get("content-length") ?? 0)
  if (contentLength > MAX_AUDIO_INPUT_BYTES) throw new Error("Selected audio exceeds the 25 MB safety limit.")
  const bytes = new Uint8Array(await response.arrayBuffer())
  if (bytes.byteLength > MAX_AUDIO_INPUT_BYTES) throw new Error("Selected audio exceeds the 25 MB safety limit.")
  await writeFile(destination, bytes)
}

function transitionName(transition: string) {
  switch (transition) {
    case "slide": return "slideleft"
    case "zoom": return "zoomin"
    case "blur": return "fadeblack"
    case "cross_dissolve": return "fade"
    default: return "fade"
  }
}

function escapeDrawtext(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'")
    .replaceAll(":", "\\:")
    .replaceAll(",", "\\,")
    .replaceAll("%", "\\%")
    .replaceAll("\n", "\\n")
}

function textOverlayFilter(input: {
  text?: string
  position?: "top" | "center" | "bottom"
}) {
  if (!input.text?.trim()) return ""
  const y = input.position === "top"
    ? "150"
    : input.position === "center" ? "(h-text_h)/2" : "h-text_h-160"
  return `,drawtext=text='${escapeDrawtext(input.text.trim().slice(0, 120))}':fontcolor=white:fontsize=58:box=1:boxcolor=black@0.48:boxborderw=24:x=(w-text_w)/2:y=${y}`
}

async function runFfmpeg(args: string[], inputCount: number, hasAudio: boolean) {
  const executable = process.env.FFMPEG_PATH || "ffmpeg"
  logRenderStage("ffmpeg", "started", { inputs: inputCount, audio: hasAudio })

  await new Promise<void>((resolve, reject) => {
    const child = spawn(executable, args, {
      shell: false,
      stdio: ["ignore", "ignore", "pipe"],
    })
    let stderr = ""
    child.stderr.on("data", data => { stderr = `${stderr}${String(data)}`.slice(-4_000) })
    child.on("error", error => reject(renderStageFailure("ffmpeg", `could not start (${sanitizeRenderDiagnostic(error)})`)))
    child.on("close", code => {
      if (code === 0) {
        logRenderStage("ffmpeg", "ok")
        resolve()
      } else {
        const reason = sanitizeRenderDiagnostic(stderr, 700) || "no FFmpeg stderr was available"
        logRenderStage("ffmpeg", "failed", { exit_code: code ?? "unknown", reason })
        reject(renderStageFailure("ffmpeg", `exit_code=${code ?? "unknown"} ${reason}`))
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
    const dimensions = input.aspectRatio === "1:1"
      ? { width: 1080, height: 1080 }
      : input.aspectRatio === "4:5"
        ? { width: 1080, height: 1350 }
        : { width: 1080, height: 1920 }

    try {
      await downloadAsset(input.asset, sourcePath)
      await runFfmpeg([
        "-y", "-i", sourcePath,
        "-vf", `scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=increase,crop=${dimensions.width}:${dimensions.height}${textOverlayFilter({ text: input.overlayText, position: "bottom" })}`,
        "-frames:v", "1",
        "-q:v", "2",
        outputPath,
      ], 1, false)
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
      logRenderStage("input", "ok", { scenes: compositionAssets.length, audio: Boolean(input.audio) })
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

      let inputPaths: string[]
      const audioPath = input.audio
        ? join(/* turbopackIgnore: true */ workspace, `audio.${audioExtension(input.audio.mimeType)}`)
        : null
      try {
        inputPaths = await Promise.all(compositionAssets.map(async ({ asset }, index) => {
          const path = join(/* turbopackIgnore: true */ workspace!, `${index}.${safeExtension(asset)}`)
          await downloadAsset(asset, path)
          return path
        }))
        if (audioPath && input.audio) await downloadAudio(input.audio, audioPath)
        logRenderStage("download", "ok", { sources: compositionAssets.length, audio: Boolean(input.audio) })
      } catch (error) {
        throw renderStageFailure("download", error)
      }

      const args = ["-y"]
      compositionAssets.forEach(({ scene, asset }, index) => {
        if (asset.mediaType === "image") args.push("-loop", "1", "-t", String(scene.duration), "-i", inputPaths[index])
        else args.push("-stream_loop", "-1", "-t", String(scene.duration), "-i", inputPaths[index])
      })
      if (audioPath) args.push("-i", audioPath)

      const filters = compositionAssets.map(({ scene }, index) =>
        `[${index}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1${textOverlayFilter({ text: scene.overlay?.text, position: scene.overlay?.position })}[v${index}]`
      )
      let previous = "v0"
      let totalDuration = compositionAssets[0].scene.duration
      for (let index = 1; index < compositionAssets.length; index += 1) {
        const next = `x${index}`
        const transition = transitionName(compositionAssets[index - 1].scene.transitionOut)
        filters.push(`[${previous}][v${index}]xfade=transition=${transition}:duration=${TRANSITION_DURATION}:offset=${Math.max(0, totalDuration - TRANSITION_DURATION).toFixed(3)}[${next}]`)
        previous = next
        totalDuration += compositionAssets[index].scene.duration - TRANSITION_DURATION
      }
      if (input.audio) {
        // Never loop a short licensed track. `atrim` only caps a long track;
        // FFmpeg leaves a shorter source short while the video continues.
        const audibleDuration = Math.min(totalDuration, input.audio.durationSeconds)
        const fadeDuration = audibleDuration > 0.4 ? Math.min(1.5, audibleDuration / 4) : 0
        const fade = fadeDuration > 0
          ? `,afade=t=out:st=${Math.max(0, audibleDuration - fadeDuration).toFixed(3)}:d=${fadeDuration.toFixed(3)}`
          : ""
        filters.push(`[${compositionAssets.length}:a]atrim=duration=${totalDuration.toFixed(3)},asetpts=N/SR/TB${fade}[a]`)
      }
      args.push("-filter_complex", filters.join(";"), "-map", `[${previous}]`)
      if (input.audio) args.push("-map", "[a]", "-c:a", "aac", "-b:a", "160k")
      else args.push("-an")
      args.push("-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-r", "30", outputPath)

      await runFfmpeg(args, compositionAssets.length, Boolean(input.audio))

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
