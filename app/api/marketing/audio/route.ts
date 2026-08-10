import { NextResponse } from "next/server"
import { z } from "zod"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const MAX_AUDIO_BYTES = 25 * 1024 * 1024
const AudioUploadSchema = z.object({
  title: z.string().trim().min(1).max(160),
  artistSource: z.string().trim().max(240).optional(),
  durationSeconds: z.coerce.number().positive().max(3_600),
})

const supportedFormats = {
  mp3: { mimeType: "audio/mpeg", declaredTypes: ["audio/mpeg", "audio/mp3"] },
  m4a: { mimeType: "audio/mp4", declaredTypes: ["audio/mp4", "audio/x-m4a", "audio/m4a"] },
  wav: { mimeType: "audio/wav", declaredTypes: ["audio/wav", "audio/wave", "audio/x-wav"] },
} as const

function fileFormat(file: File) {
  const extension = file.name.split(".").pop()?.toLocaleLowerCase()
  const format = extension ? supportedFormats[extension as keyof typeof supportedFormats] : undefined
  if (!format || (file.type && !format.declaredTypes.includes(file.type.toLocaleLowerCase() as never))) {
    throw new Error("Upload an MP3, M4A, or WAV audio file.")
  }
  return { extension, mimeType: format.mimeType }
}

export async function GET() {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  try {
    return NextResponse.json({ tracks: await MarketingRepository.listAudioTracks() })
  } catch {
    return NextResponse.json({ error: "Unable to load the Audio Library." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  try {
    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File) || !file.size) {
      return NextResponse.json({ error: "Choose an MP3, M4A, or WAV audio file." }, { status: 400 })
    }
    if (file.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "Audio files must be 25 MB or smaller." }, { status: 400 })
    }
    const parsed = AudioUploadSchema.safeParse({
      title: formData.get("title") || file.name.replace(/\.[^.]+$/, ""),
      artistSource: formData.get("artistSource") || undefined,
      durationSeconds: formData.get("durationSeconds"),
    })
    if (!parsed.success) return NextResponse.json({ error: "Provide a title and a valid audio duration." }, { status: 400 })

    const format = fileFormat(file)
    const storagePath = `${access.user.id}/${crypto.randomUUID()}.${format.extension}`
    const supabase = await createServerSupabaseClient()
    const bytes = new Uint8Array(await file.arrayBuffer())
    const { error: uploadError } = await supabase.storage
      .from("marketing-audio")
      .upload(storagePath, bytes, { contentType: format.mimeType, upsert: false })
    if (uploadError) throw uploadError

    try {
      const track = await MarketingRepository.createAudioTrack({
        title: parsed.data.title,
        artistSource: parsed.data.artistSource || null,
        storagePath,
        filename: file.name.slice(0, 255),
        mimeType: format.mimeType,
        fileSize: file.size,
        durationSeconds: parsed.data.durationSeconds,
        createdBy: access.user.id,
      })
      await MarketingRepository.addAuditLog({
        actorId: access.user.id,
        action: "audio_library.uploaded",
        metadata: { audioTrackId: track.id, mimeType: track.mimeType, fileSize: track.fileSize },
      })
      return NextResponse.json({ track }, { status: 201 })
    } catch (error) {
      await supabase.storage.from("marketing-audio").remove([storagePath])
      throw error
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to upload the audio track." }, { status: 400 })
  }
}
