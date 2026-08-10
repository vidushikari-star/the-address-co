import { NextResponse } from "next/server"
import { z } from "zod"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { createServerSupabaseClient } from "@/lib/supabase/server"

type Context = { params: Promise<{ id: string }> }

const AudioTrackUpdateSchema = z.object({
  title: z.string().trim().min(1).max(160),
  artistSource: z.string().trim().max(240).nullable().optional(),
})

export async function PATCH(request: Request, context: Context) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  const parsed = AudioTrackUpdateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Provide a valid audio track title and source." }, { status: 400 })

  try {
    const { id } = await context.params
    const track = await MarketingRepository.updateAudioTrack(id, parsed.data)
    await MarketingRepository.addAuditLog({ actorId: access.user.id, action: "audio_library.renamed", metadata: { audioTrackId: id } })
    return NextResponse.json({ track })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update the audio track." }, { status: 400 })
  }
}

export async function DELETE(_request: Request, context: Context) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  try {
    const { id } = await context.params
    // Remove the metadata first. Existing content retains its historical audio
    // selection and rendered files; a later render simply falls back to silent
    // when this now-deleted track cannot be resolved.
    const deleted = await MarketingRepository.deleteAudioTrack(id)
    const supabase = await createServerSupabaseClient()
    const { error: storageError } = await supabase.storage.from("marketing-audio").remove([deleted.storagePath])
    if (storageError) console.warn("Audio Library metadata was deleted but storage cleanup failed:", storageError.message)
    await MarketingRepository.addAuditLog({ actorId: access.user.id, action: "audio_library.deleted", metadata: { audioTrackId: id } })
    return NextResponse.json({ deleted: true, storageCleanupPending: Boolean(storageError) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete the audio track." }, { status: 400 })
  }
}
