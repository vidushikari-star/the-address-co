import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { staticRenderJobType } from "@/lib/marketing/instagram-static-composition"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { CreativeOutputSchema, ImproveStorySchema, StoryCompositionSchema, StoryUpdateSchema } from "@/lib/marketing/schemas"
import { CreativeAIService } from "@/lib/marketing/services/creative-ai-service"
import type { PropertyFactSnapshot } from "@/lib/marketing/types"

type Context = { params: Promise<{ id: string }> }

function propertySnapshot(value: unknown): value is PropertyFactSnapshot {
  return Boolean(value && typeof value === "object" && typeof (value as { id?: unknown }).id === "string" && typeof (value as { title?: unknown }).title === "string")
}

/** Updates a Story visual input and queues a fresh private derived creative. */
export async function PATCH(request: Request, context: Context) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  const parsed = StoryUpdateSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Invalid Story creative update." }, { status: 400 })

  try {
    const { id } = await context.params
    const record = await MarketingRepository.getContentById(id)
    if (!record) return NextResponse.json({ error: "Content not found." }, { status: 404 })
    if (record.content.contentType !== "story") return NextResponse.json({ error: "This editor is for Instagram Stories only." }, { status: 400 })
    if (!["draft", "changes_requested", "ready_for_review", "failed"].includes(record.content.status)) {
      return NextResponse.json({ error: "Approved, scheduled, and published Stories are locked. Request changes before editing." }, { status: 409 })
    }
    const source = record.assets.find(asset => asset.id === parsed.data.sourceAssetId && asset.kind === "original_reference" && asset.mediaType === "image")
    if (!source) return NextResponse.json({ error: "Select an available property image for the Story." }, { status: 409 })
    const existing = StoryCompositionSchema.safeParse(record.content.composition)
    const logo = parsed.data.logoEnabled ? await MarketingRepository.getActiveBrandLogo() : null
    if (parsed.data.logoEnabled && !logo) return NextResponse.json({ error: "Upload an active Brand Assets logo before enabling it on a Story." }, { status: 409 })
    const propertyId = record.content.primaryPropertyId ?? String(record.content.propertySnapshot.id ?? "")
    if (!propertyId) return NextResponse.json({ error: "The Story property facts are unavailable." }, { status: 409 })
    const composition = {
      propertyId,
      format: "story" as const,
      aspectRatio: "9:16" as const,
      sourceAssetId: source.id,
      storyCopy: parsed.data.storyCopy,
      layoutStyle: parsed.data.layoutStyle,
      typographyStyle: existing.success ? existing.data.typographyStyle : "modern_sans" as const,
      renderToken: crypto.randomUUID(),
      logo: {
        enabled: parsed.data.logoEnabled,
        placement: existing.success ? existing.data.logo.placement : "top_right" as const,
        scale: existing.success ? existing.data.logo.scale : "small" as const,
        opacity: existing.success ? existing.data.logo.opacity : 0.8,
        assetId: logo?.id ?? null,
      },
    }
    await MarketingRepository.updateContent(id, { composition, status: "rendering" }, access.user.id)
    await MarketingRepository.enqueueJob({
      contentId: id,
      type: staticRenderJobType("story"),
      input: { renderToken: composition.renderToken },
      idempotencyKey: `render-image:${id}:${composition.renderToken}`,
    })
    await MarketingRepository.addAuditLog({ actorId: access.user.id, contentId: id, action: "story.updated", metadata: { sourceAssetId: source.id, layoutStyle: composition.layoutStyle, logoEnabled: composition.logo.enabled } })
    return NextResponse.json({ queued: true }, { status: 202 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update Story creative." }, { status: 400 })
  }
}

/** Returns AI-improved visual Story copy; the editor explicitly confirms it before it changes the composition. */
export async function POST(request: Request, context: Context) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  const parsed = ImproveStorySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Enter a Story improvement prompt." }, { status: 400 })
  try {
    const { id } = await context.params
    const record = await MarketingRepository.getContentById(id)
    if (!record || record.content.contentType !== "story") return NextResponse.json({ error: "Story content not found." }, { status: 404 })
    const property = record.content.primaryPropertyId
      ? await MarketingRepository.getPropertySnapshot(record.content.primaryPropertyId)
      : record.content.propertySnapshot
    if (!propertySnapshot(property)) return NextResponse.json({ error: "The Story property facts are unavailable." }, { status: 409 })
    const composition = StoryCompositionSchema.safeParse(record.content.composition)
    const creative = CreativeOutputSchema.safeParse(record.content.creative)
    const currentStoryCopy = composition.success ? composition.data.storyCopy : creative.success ? creative.data.storyCopy : null
    if (!currentStoryCopy) return NextResponse.json({ error: "Generate the Story creative before improving it." }, { status: 409 })
    const storyCopy = await CreativeAIService.improveStoryCopy({
      property,
      creativeDirection: record.content.creativeDirection,
      settings: await MarketingRepository.getBrandSettings(),
      currentStoryCopy,
      userPrompt: parsed.data.prompt,
    })
    return NextResponse.json({ storyCopy })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to improve Story copy." }, { status: 502 })
  }
}
