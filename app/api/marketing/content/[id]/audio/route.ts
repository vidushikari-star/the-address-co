import { NextResponse } from "next/server"
import { z } from "zod"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"

type Context = { params: Promise<{ id: string }> }

const AudioSelectionSchema = z.object({ audioTrackId: z.string().uuid().nullable() })
const EDITABLE_STATUSES = ["draft", "changes_requested", "ready_for_review", "failed"]

/** Persist only a validated private-library selection; no external/Meta music IDs are accepted. */
export async function POST(request: Request, context: Context) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  const parsed = AudioSelectionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid Audio Library track or Silent Reel." }, { status: 400 })

  try {
    const { id } = await context.params
    const record = await MarketingRepository.getContentById(id)
    if (!record) return NextResponse.json({ error: "Content not found." }, { status: 404 })
    if (record.content.contentType !== "reel") return NextResponse.json({ error: "Audio can only be selected for a Reel." }, { status: 400 })
    if (!EDITABLE_STATUSES.includes(record.content.status)) {
      return NextResponse.json({ error: "Return this Reel to edits before changing its audio." }, { status: 409 })
    }

    let audio: Record<string, unknown> = { type: "none", label: "Silent Reel" }
    if (parsed.data.audioTrackId) {
      const track = await MarketingRepository.getAudioTrackById(parsed.data.audioTrackId)
      if (!track) return NextResponse.json({ error: "That Audio Library track is no longer available." }, { status: 404 })
      audio = { type: "uploaded", id: track.id, label: track.title, durationSeconds: track.durationSeconds }
    }

    const changes: Record<string, unknown> = {
      composition: { ...(record.content.composition as Record<string, unknown>), audio },
    }
    if (record.content.status === "failed") {
      changes.status = "draft"
      changes.last_error = null
    }
    const content = await MarketingRepository.updateContent(id, changes, access.user.id)
    await MarketingRepository.addAuditLog({
      actorId: access.user.id,
      contentId: id,
      action: parsed.data.audioTrackId ? "reel.audio_selected" : "reel.audio_removed",
      metadata: parsed.data.audioTrackId ? { audioTrackId: parsed.data.audioTrackId } : {},
    })
    return NextResponse.json({ content })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update Reel audio." }, { status: 400 })
  }
}
