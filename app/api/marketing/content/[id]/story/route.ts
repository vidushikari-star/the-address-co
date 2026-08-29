import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { defaultMarketingContract, resolveMarketingContract } from "@/lib/marketing/content-contract"
import { staticRenderJobType } from "@/lib/marketing/instagram-static-composition"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { CreativeOutputSchema, ImproveStorySchema, StoryCompositionSchema, StoryUpdateSchema } from "@/lib/marketing/schemas"
import { CreativeAIService } from "@/lib/marketing/services/creative-ai-service"
import { MediaEligibilityService } from "@/lib/marketing/services/media-eligibility-service"
import { fitStoryCopy } from "@/lib/marketing/story-layout"
import type { PropertyFactSnapshot, StoryComposition, StoryCopy } from "@/lib/marketing/types"

type Context = { params: Promise<{ id: string }> }

function propertySnapshot(value: unknown): value is PropertyFactSnapshot {
  return Boolean(value && typeof value === "object" && typeof (value as { id?: unknown }).id === "string" && typeof (value as { title?: unknown }).title === "string")
}

type StoryRecord = NonNullable<Awaited<ReturnType<typeof MarketingRepository.getContentById>>>

/**
 * Composition is the single persisted Story creative. Its renderToken is the
 * creative version: a changed token can never approve an older derivative.
 */
async function persistAndQueueStoryCreative(input: {
  record: StoryRecord
  contentId: string
  sourceAssetId: string
  storyCopy: StoryCopy
  layoutStyle: StoryComposition["layoutStyle"]
  logoEnabled: boolean
  updatedBy: string
}) {
  const { record } = input
  if (![
    "draft",
    "changes_requested",
    "ready_for_review",
    "failed",
    "rendering",
  ].includes(record.content.status)) {
    throw new Error("Approved, scheduled, and published Stories are locked. Request changes before editing.")
  }

  const source = record.assets.find(asset =>
    asset.id === input.sourceAssetId &&
    asset.kind === "original_reference" &&
    asset.mediaType === "image"
  )
  if (!source) throw new Error("Select an available property image for the Story.")
  const previousContract = resolveMarketingContract(record.content)
  if (previousContract.format !== "story") throw new Error("This editor is for Instagram Stories only.")
  const nextContract = defaultMarketingContract({
    format: "story",
    objective: previousContract.objective,
    assetIds: [source.id],
    selectionMode: "curated",
    creativeDirection: record.content.creativeDirection,
    brandTreatment: {
      version: "v1",
      logo: {
        enabled: input.logoEnabled,
        assetId: input.logoEnabled ? null : null,
        placement: "top_right",
        scale: "small",
        opacity: 0.8,
      },
    },
  })
  MediaEligibilityService.assert({ format: "story", selection: nextContract.mediaSelection, assets: record.assets })

  const existing = StoryCompositionSchema.safeParse(record.content.composition)
  const logo = input.logoEnabled ? await MarketingRepository.getActiveBrandLogo() : null
  if (input.logoEnabled && !logo) {
    throw new Error("Upload an active Brand Assets logo before enabling it on a Story.")
  }

  const propertyId = record.content.primaryPropertyId ?? String(record.content.propertySnapshot.id ?? "")
  if (!propertyId) throw new Error("The Story property facts are unavailable.")

  const fit = fitStoryCopy(input.storyCopy)
  if (!fit.fits) {
    throw new Error("Story copy cannot fit its mobile-safe layout. Shorten the visual copy and try again.")
  }

  const composition: StoryComposition = {
    propertyId,
    format: "story",
    aspectRatio: "9:16",
    sourceAssetId: source.id,
    storyCopy: fit.storyCopy,
    layoutStyle: input.layoutStyle,
    typographyStyle: existing.success ? existing.data.typographyStyle : "modern_sans",
    renderToken: crypto.randomUUID(),
    logo: {
      enabled: input.logoEnabled,
      placement: existing.success ? existing.data.logo.placement : "top_right",
      scale: existing.success ? existing.data.logo.scale : "small",
      opacity: existing.success ? existing.data.logo.opacity : 0.8,
      assetId: logo?.id ?? null,
    },
    marketingContract: {
      ...nextContract,
      brandTreatment: {
        ...nextContract.brandTreatment,
        logo: { ...nextContract.brandTreatment.logo, assetId: logo?.id ?? null },
      },
    },
  }

  await MarketingRepository.queueStaticRender({
    contentId: input.contentId,
    type: staticRenderJobType("story"),
    renderToken: composition.renderToken,
    updatedBy: input.updatedBy,
    changes: { composition },
  })

  return { composition, compacted: fit.adjusted }
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
    if (!["draft", "changes_requested", "ready_for_review", "failed", "rendering"].includes(record.content.status)) {
      return NextResponse.json({ error: "Approved, scheduled, and published Stories are locked. Request changes before editing." }, { status: 409 })
    }
    const result = await persistAndQueueStoryCreative({
      record,
      contentId: id,
      sourceAssetId: parsed.data.sourceAssetId,
      storyCopy: parsed.data.storyCopy,
      layoutStyle: parsed.data.layoutStyle,
      logoEnabled: parsed.data.logoEnabled,
      updatedBy: access.user.id,
    })
    await MarketingRepository.addAuditLog({ actorId: access.user.id, contentId: id, action: "story.updated", metadata: { sourceAssetId: result.composition.sourceAssetId, layoutStyle: result.composition.layoutStyle, logoEnabled: result.composition.logo.enabled } })
    return NextResponse.json({ queued: true, storyCopy: result.composition.storyCopy, compacted: result.compacted }, { status: 202 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update Story creative." }, { status: 400 })
  }
}

/** AI improvements persist before a new render is ever queued. */
export async function POST(request: Request, context: Context) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  const parsed = ImproveStorySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Enter a Story improvement prompt." }, { status: 400 })
  try {
    const { id } = await context.params
    const record = await MarketingRepository.getContentById(id)
    if (!record || record.content.contentType !== "story") return NextResponse.json({ error: "Story content not found." }, { status: 404 })
    if (!["draft", "changes_requested", "ready_for_review", "failed", "rendering"].includes(record.content.status)) {
      return NextResponse.json({ error: "Approved, scheduled, and published Stories are locked. Request changes before editing." }, { status: 409 })
    }
    const property = record.content.propertySnapshot
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
    const sourceAssetId = composition.success
      ? composition.data.sourceAssetId
      : record.assets.find(asset => asset.kind === "original_reference" && asset.mediaType === "image")?.id
    if (!sourceAssetId) return NextResponse.json({ error: "Select a property image before improving the Story." }, { status: 409 })

    const result = await persistAndQueueStoryCreative({
      record,
      contentId: id,
      sourceAssetId,
      storyCopy,
      layoutStyle: composition.success ? composition.data.layoutStyle : "editorial_panel",
      logoEnabled: composition.success
        ? composition.data.logo.enabled
        : Boolean(await MarketingRepository.getActiveBrandLogo()),
      updatedBy: access.user.id,
    })
    await MarketingRepository.addAuditLog({
      actorId: access.user.id,
      contentId: id,
      action: "story.ai_improved",
      metadata: { sourceAssetId: result.composition.sourceAssetId, layoutStyle: result.composition.layoutStyle },
    })
    return NextResponse.json({ queued: true, storyCopy: result.composition.storyCopy, compacted: result.compacted }, { status: 202 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to improve Story copy." }, { status: 502 })
  }
}
