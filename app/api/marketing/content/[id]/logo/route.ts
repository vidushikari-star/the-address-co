import { NextResponse } from "next/server"
import { z } from "zod"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"

type Context = { params: Promise<{ id: string }> }

const LogoSelectionSchema = z.object({
  placement: z.enum(["none", "top_left", "top_right", "bottom_left", "bottom_right", "end_card_only"]),
  scale: z.enum(["small", "medium", "large"]),
  opacity: z.number().min(0.1).max(1),
})
const EDITABLE_STATUSES = ["draft", "changes_requested", "ready_for_review", "failed"]

export async function POST(request: Request, context: Context) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  const parsed = LogoSelectionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid logo placement, scale, and opacity." }, { status: 400 })
  try {
    const { id } = await context.params
    const record = await MarketingRepository.getContentById(id)
    if (!record) return NextResponse.json({ error: "Content not found." }, { status: 404 })
    if (record.content.contentType !== "reel") return NextResponse.json({ error: "Logo controls are available for Reels only." }, { status: 400 })
    if (!EDITABLE_STATUSES.includes(record.content.status)) return NextResponse.json({ error: "Return this Reel to edits before changing its logo treatment." }, { status: 409 })
    const logo = parsed.data.placement === "none" ? null : await MarketingRepository.getActiveBrandLogo()
    if (parsed.data.placement !== "none" && !logo) return NextResponse.json({ error: "Upload a private brand logo in Marketing Settings before selecting a logo placement." }, { status: 409 })
    const changes: Record<string, unknown> = {
      composition: {
        ...(record.content.composition as Record<string, unknown>),
        logo: { ...parsed.data, assetId: logo?.id ?? null },
      },
    }
    if (record.content.status === "failed") { changes.status = "draft"; changes.last_error = null }
    const content = await MarketingRepository.updateContent(id, changes, access.user.id)
    await MarketingRepository.addAuditLog({ actorId: access.user.id, contentId: id, action: "reel.logo_updated", metadata: { placement: parsed.data.placement, scale: parsed.data.scale, opacity: parsed.data.opacity } })
    return NextResponse.json({ content })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update the Reel logo treatment." }, { status: 400 })
  }
}
