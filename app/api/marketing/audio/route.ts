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
    const files = formData.getAll("files").filter((value): value is File => value instanceof File && Boolean(value.size))
    // Retain the original single-file form shape for integrations already in use.
    const legacyFile = formData.get("file")
    if (!files.length && legacyFile instanceof File && legacyFile.size) files.push(legacyFile)
    if (!files.length) {
      return NextResponse.json({ error: "Choose an MP3, M4A, or WAV audio file." }, { status: 400 })
    }
    if (files.length > 25) return NextResponse.json({ error: "Upload up to 25 audio files at a time." }, { status: 400 })
    const durations = formData.getAll("durationSeconds")
    const validation = files.map((file, index) => {
      if (file.size > MAX_AUDIO_BYTES) throw new Error(`${file.name}: audio files must be 25 MB or smaller.`)
      const parsed = AudioUploadSchema.safeParse({
        title: files.length === 1 ? formData.get("title") || file.name.replace(/\.[^.]+$/, "") : file.name.replace(/\.[^.]+$/, ""),
        artistSource: formData.get("artistSource") || undefined,
        durationSeconds: durations[index],
      })
      if (!parsed.success) throw new Error(`${file.name}: the browser could not read a valid duration. Try a standard MP3, M4A, or WAV file.`)
      return { file, parsed: parsed.data, format: fileFormat(file) }
    })

    const supabase = await createServerSupabaseClient()
    const tracks = []
    for (const item of validation) {
      const storagePath = `${access.user.id}/${crypto.randomUUID()}.${item.format.extension}`
      const bytes = new Uint8Array(await item.file.arrayBuffer())
      const { error: uploadError } = await supabase.storage
        .from("marketing-audio")
        .upload(storagePath, bytes, { contentType: item.format.mimeType, upsert: false })
      if (uploadError) throw new Error(`${item.file.name}: storage upload failed (${uploadError.message}).`)
      try {
        const track = await MarketingRepository.createAudioTrack({
          title: item.parsed.title,
          artistSource: item.parsed.artistSource || null,
          storagePath,
          filename: item.file.name.slice(0, 255),
          mimeType: item.format.mimeType,
          fileSize: item.file.size,
          durationSeconds: item.parsed.durationSeconds,
          createdBy: access.user.id,
        })
        tracks.push(track)
      } catch (error) {
        await supabase.storage.from("marketing-audio").remove([storagePath])
        throw new Error(`${item.file.name}: ${error instanceof Error ? error.message : "could not be saved in the Audio Library."}`)
      }
    }
    await Promise.all(tracks.map(track => MarketingRepository.addAuditLog({
      actorId: access.user.id,
      action: "audio_library.uploaded",
      metadata: { audioTrackId: track.id, mimeType: track.mimeType, fileSize: track.fileSize },
    })))
    return NextResponse.json({ tracks, track: tracks[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to upload the audio track." }, { status: 400 })
  }
}
