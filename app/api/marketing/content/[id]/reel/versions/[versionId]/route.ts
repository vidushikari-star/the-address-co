import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"

type Context = { params: Promise<{ id: string; versionId: string }> }

export async function PATCH(request: Request, context: Context) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  try {
    const { action } = await request.json().catch(() => ({})) as { action?: string }
    const { id, versionId } = await context.params
    const [content, version] = await Promise.all([MarketingRepository.getContentById(id), MarketingRepository.getReelVersion(versionId)])
    if (!content || !version || version.contentId !== id) return NextResponse.json({ error: "Reel version not found." }, { status: 404 })
    if (action === "make_current") {
      if (content.content.status !== "approved") return NextResponse.json({ error: "Only approved content can change its active Reel version." }, { status: 409 })
      await MarketingRepository.makeReelVersionCurrent(versionId)
      await MarketingRepository.addAuditLog({ actorId: access.user.id, contentId: id, action: "reel_version.made_current", metadata: { versionId } })
      return NextResponse.json({ updated: true })
    }
    if (action === "duplicate") {
      if (version.status !== "rendered") return NextResponse.json({ error: "Only a rendered Reel version can be re-rendered as a new draft." }, { status: 409 })
      const copy = await MarketingRepository.createReelVersion({
        contentId: id,
        composition: version.composition,
        sourceAssetIds: version.sourceAssetIds,
        logoSettings: version.logoSettings,
        audioSettings: version.audioSettings,
        userPrompt: `Re-rendered from Version ${version.versionNumber}`,
        createdBy: access.user.id,
        status: "draft",
      })
      await MarketingRepository.updateContent(id, { status: "ready_for_review", last_error: null }, access.user.id)
      await MarketingRepository.addAuditLog({ actorId: access.user.id, contentId: id, action: "reel_version.duplicated", metadata: { sourceVersionId: versionId, versionId: copy.id } })
      return NextResponse.json({ version: copy }, { status: 201 })
    }
    return NextResponse.json({ error: "Unsupported Reel version action." }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update the Reel version." }, { status: 400 })
  }
}

export async function DELETE(_request: Request, context: Context) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  try {
    const { id, versionId } = await context.params
    const version = await MarketingRepository.getReelVersion(versionId)
    if (!version || version.contentId !== id) return NextResponse.json({ error: "Reel version not found." }, { status: 404 })
    await MarketingRepository.deleteDraftReelVersion(versionId)
    await MarketingRepository.addAuditLog({ actorId: access.user.id, contentId: id, action: "reel_version.deleted", metadata: { versionId } })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete the Reel version." }, { status: 400 })
  }
}
