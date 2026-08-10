import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { CreativeOutputSchema, ReelCompositionSchema } from "@/lib/marketing/schemas"
import { CompositionService } from "@/lib/marketing/services/composition-service"
import type { ReelComposition } from "@/lib/marketing/types"

type Context = { params: Promise<{ id: string }> }

function selectedAudio(composition: Record<string, unknown>): ReelComposition["audio"] {
  const audio = composition.audio
  if (audio && typeof audio === "object") {
    const candidate = audio as { type?: unknown; id?: unknown; label?: unknown }
    if (["none", "royalty_free", "original", "instagram_manual"].includes(String(candidate.type))) {
      return {
        type: candidate.type as ReelComposition["audio"]["type"],
        id: typeof candidate.id === "string" ? candidate.id : null,
        label: typeof candidate.label === "string" ? candidate.label : null,
      }
    }
  }
  return { type: "none", label: "No audio selected" }
}

export async function POST(_request: Request, context: Context) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  try {
    const { id } = await context.params
    const record = await MarketingRepository.getContentById(id)
    if (!record) return NextResponse.json({ error: "Content not found." }, { status: 404 })
    if (record.content.contentType !== "reel") {
      return NextResponse.json({ error: "Only Reel rendering is currently requested by this endpoint." }, { status: 400 })
    }
    if (!["approved", "failed"].includes(record.content.status)) {
      return NextResponse.json({ error: "Approve the Reel before rendering it." }, { status: 409 })
    }

    let composition: ReelComposition
    try {
      composition = ReelCompositionSchema.parse(record.content.composition)
    } catch {
      const creative = CreativeOutputSchema.parse(record.content.creative)
      const propertyId = typeof record.content.propertySnapshot.id === "string"
        ? record.content.propertySnapshot.id
        : record.content.primaryPropertyId
      if (!propertyId) throw new Error("The source property facts are unavailable for this Reel.")
      const assetIds = record.assets
        .filter(asset => asset.kind === "original_reference" && ["image", "video"].includes(asset.mediaType))
        .map(asset => asset.id)
      composition = CompositionService.composeReel({
        propertyId,
        assetIds,
        creative,
        audio: selectedAudio(record.content.composition),
      })
      await MarketingRepository.updateContent(id, { composition }, access.user.id)
    }

    await MarketingRepository.queueReelRender({
      contentId: id,
      updatedBy: access.user.id,
      jobInput: { resumeApproved: true },
      idempotencyKey: `render-reel:${id}:${crypto.randomUUID()}`,
    })
    await MarketingRepository.addAuditLog({ actorId: access.user.id, contentId: id, action: "render.requested" })
    return NextResponse.json({ queued: true }, { status: 202 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to queue render." }, { status: 400 })
  }
}
