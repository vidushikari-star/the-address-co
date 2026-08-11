import { NextResponse } from "next/server"
import { z } from "zod"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const MAX_AUDIO_BYTES = 25 * 1024 * 1024
const formats = {
  mp3: { mimeType: "audio/mpeg", declaredTypes: ["audio/mpeg", "audio/mp3"] },
  m4a: { mimeType: "audio/mp4", declaredTypes: ["audio/mp4", "audio/x-m4a", "audio/m4a"] },
  wav: { mimeType: "audio/wav", declaredTypes: ["audio/wav", "audio/wave", "audio/x-wav"] },
} as const

const FinalizeSchema = z.object({
  storagePath: z.string().min(1).max(500),
  filename: z.string().trim().min(1).max(255),
  title: z.string().trim().min(1).max(160),
  artistSource: z.string().trim().max(240).nullable().optional(),
  mimeType: z.string().trim().max(100),
  fileSize: z.number().int().positive().max(MAX_AUDIO_BYTES),
  durationSeconds: z.number().positive().max(3_600),
})

function formatFor(filename: string, mimeType: string) {
  if (filename.includes("/") || filename.includes("\\") || /[\x00-\x1f]/.test(filename)) throw new Error("Unsupported audio filename.")
  const extension = filename.split(".").pop()?.toLocaleLowerCase()
  const format = extension ? formats[extension as keyof typeof formats] : undefined
  if (!format || !format.declaredTypes.includes(mimeType.toLocaleLowerCase() as never)) {
    throw new Error("Unsupported audio format. Upload an MP3, M4A, or WAV file.")
  }
  return { extension, mimeType: format.mimeType }
}

function storageMetadata(value: unknown) {
  const item = value && typeof value === "object" ? value as Record<string, unknown> : {}
  const metadata = item.metadata && typeof item.metadata === "object" ? item.metadata as Record<string, unknown> : {}
  return {
    size: Number(metadata.size ?? item.size ?? 0),
    mimeType: String(metadata.mimetype ?? metadata.contentType ?? item.mimetype ?? "").toLocaleLowerCase(),
  }
}

function sanitizeFinalizationDiagnostic(error: unknown) {
  const message = error instanceof Error ? error.message : "unknown"
  return message
    .replace(/https?:\/\/[^\s]+/gi, "[url]")
    .replace(/\b(token|key|secret|signature|authorization)\b\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
    .slice(0, 300)
}

export async function POST(request: Request) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  const parsed = FinalizeSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Audio metadata could not be finalized. Check the filename, size, and duration." }, { status: 400 })

  const input = parsed.data
  try {
    const format = formatFor(input.filename, input.mimeType)
    const prefix = `${access.user.id}/`
    if (!input.storagePath.startsWith(prefix) || !input.storagePath.endsWith(`.${format.extension}`)) {
      return NextResponse.json({ error: "Upload permission expired or the audio upload path is invalid." }, { status: 409 })
    }

    const existing = await MarketingRepository.getAudioTrackByStoragePath(input.storagePath)
    if (existing) return NextResponse.json({ track: existing, duplicate: true })

    const supabase = await createServerSupabaseClient()
    const objectName = input.storagePath.slice(prefix.length)
    const { data: objects, error: listError } = await supabase.storage.from("marketing-audio").list(access.user.id, { search: objectName })
    if (listError) throw new Error("Storage upload could not be verified.")
    const object = (objects ?? []).find(item => item.name === objectName)
    if (!object) return NextResponse.json({ error: "Storage upload was not found. Upload permission may have expired." }, { status: 409 })
    const metadata = storageMetadata(object)
    if (!metadata.size || metadata.size > MAX_AUDIO_BYTES || metadata.size !== input.fileSize) {
      await supabase.storage.from("marketing-audio").remove([input.storagePath])
      return NextResponse.json({ error: "Stored audio size is invalid or exceeds 25 MB." }, { status: 400 })
    }
    if (!metadata.mimeType || metadata.mimeType !== format.mimeType) {
      await supabase.storage.from("marketing-audio").remove([input.storagePath])
      return NextResponse.json({ error: "Stored audio type does not match the selected MP3, M4A, or WAV format." }, { status: 400 })
    }

    try {
      const track = await MarketingRepository.createAudioTrack({
        title: input.title,
        artistSource: input.artistSource ?? null,
        storagePath: input.storagePath,
        filename: input.filename,
        mimeType: format.mimeType,
        fileSize: input.fileSize,
        durationSeconds: input.durationSeconds,
        createdBy: access.user.id,
      })
      await MarketingRepository.addAuditLog({ actorId: access.user.id, action: "audio_library.uploaded", metadata: { audioTrackId: track.id, mimeType: track.mimeType, fileSize: track.fileSize } })
      return NextResponse.json({ track }, { status: 201 })
    } catch (error) {
      // A second finalize request can race the first. Re-read before treating
      // it as a failure; storage_path is unique and makes this idempotent.
      const duplicate = await MarketingRepository.getAudioTrackByStoragePath(input.storagePath).catch(() => null)
      if (duplicate) return NextResponse.json({ track: duplicate, duplicate: true })
      await supabase.storage.from("marketing-audio").remove([input.storagePath])
      console.error("Marketing audio finalization failed:", JSON.stringify({ reason: sanitizeFinalizationDiagnostic(error) }))
      return NextResponse.json({ error: "Audio metadata could not be finalized. The uploaded file was removed safely." }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Audio metadata could not be finalized." }, { status: 400 })
  }
}
