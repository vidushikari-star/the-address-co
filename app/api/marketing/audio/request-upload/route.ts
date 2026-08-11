import { NextResponse } from "next/server"
import { z } from "zod"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const MAX_AUDIO_BYTES = 25 * 1024 * 1024
const formats = {
  mp3: { mimeType: "audio/mpeg", declaredTypes: ["audio/mpeg", "audio/mp3"] },
  m4a: { mimeType: "audio/mp4", declaredTypes: ["audio/mp4", "audio/x-m4a", "audio/m4a"] },
  wav: { mimeType: "audio/wav", declaredTypes: ["audio/wav", "audio/wave", "audio/x-wav"] },
} as const

const UploadRequestSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().max(100),
  fileSize: z.number().int().positive().max(MAX_AUDIO_BYTES),
})

function validateFormat(input: z.infer<typeof UploadRequestSchema>) {
  if (input.filename.includes("/") || input.filename.includes("\\") || /[\x00-\x1f]/.test(input.filename)) {
    throw new Error("Unsupported audio filename.")
  }
  const extension = input.filename.split(".").pop()?.toLocaleLowerCase()
  const format = extension ? formats[extension as keyof typeof formats] : undefined
  if (!format || !format.declaredTypes.includes(input.mimeType.toLocaleLowerCase() as never)) {
    throw new Error("Unsupported audio format. Upload an MP3, M4A, or WAV file.")
  }
  return { extension, mimeType: format.mimeType }
}

export async function POST(request: Request) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  const parsed = UploadRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Provide a filename, supported audio type, and a file no larger than 25 MB." }, { status: 400 })

  try {
    const format = validateFormat(parsed.data)
    // A generated path prevents duplicate names from overwriting one another.
    const storagePath = `${access.user.id}/${crypto.randomUUID()}.${format.extension}`
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.storage.from("marketing-audio").createSignedUploadUrl(storagePath, { upsert: false })
    if (error || !data?.token) throw new Error("Storage upload permission could not be created.")
    return NextResponse.json({ storagePath, token: data.token, mimeType: format.mimeType, expiresInSeconds: 7_200 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Storage upload permission could not be created." }, { status: 400 })
  }
}
