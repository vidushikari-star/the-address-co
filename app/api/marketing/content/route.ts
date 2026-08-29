import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { defaultMarketingContract, storageContentTypeForFormat, withMarketingContract } from "@/lib/marketing/content-contract"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { ContentUpdateSchema, CreateContentSchema } from "@/lib/marketing/schemas"
import { MediaEligibilityService } from "@/lib/marketing/services/media-eligibility-service"
import type { MarketingAsset, MarketingBrandTreatment, MarketingFormat, MarketingMediaSelection, PropertyFactSnapshot } from "@/lib/marketing/types"

export const runtime = "nodejs"

function propertyAssetsForEligibility(property: PropertyFactSnapshot): MarketingAsset[] {
  return property.media.map((media, sortOrder) => ({
    id: media.id,
    contentId: "pending-content",
    propertyImageId: media.id,
    kind: "original_reference",
    mediaType: media.type,
    sourceUrl: media.url,
    metadata: {
      isCover: media.isCover,
      propertyId: property.id,
      mimeType: media.mimeType,
      width: media.width,
      height: media.height,
      fileSize: media.fileSize,
      durationSeconds: media.durationSeconds,
      codec: media.codec,
      container: media.container,
      sourceFingerprint: media.hash,
    },
    sortOrder,
    createdAt: "1970-01-01T00:00:00.000Z",
  }))
}

function selectionForPropertyMedia(input: {
  format: MarketingFormat
  propertyMediaIds?: string[]
  assets: MarketingAsset[]
}): MarketingMediaSelection {
  if (!input.propertyMediaIds?.length) return MediaEligibilityService.automaticSelection(input.format, input.assets)
  const assetsByPropertyMediaId = new Map(input.assets.map(asset => [asset.propertyImageId ?? asset.id, asset.id]))
  return {
    mode: "curated",
    // Keep an unresolved ID so MediaEligibilityService returns its actionable
    // missing-selection error rather than silently replacing a user choice.
    assetIds: input.propertyMediaIds.map(id => assetsByPropertyMediaId.get(id) ?? id),
  }
}

function brandTreatmentForRequest(input: {
  format: MarketingFormat
  requested: { enabled: boolean; placement: "auto" | "top_left" | "top_right" | "bottom_left" | "bottom_right" | "end_card_only"; scale: "small" | "medium" | "large"; opacity: number }
  logoId: string | null
}): MarketingBrandTreatment {
  const placement = input.requested.placement === "auto"
    ? input.format === "reel" ? "end_card_only" : "top_right"
    : input.requested.placement
  if (input.format !== "reel" && placement === "end_card_only") {
    throw new Error("End-card logo treatment is available for Reels only.")
  }
  return {
    version: "v1",
    logo: {
      enabled: input.requested.enabled,
      assetId: input.requested.enabled ? input.logoId : null,
      placement: input.requested.enabled ? placement : "none",
      scale: input.requested.scale,
      opacity: input.requested.opacity,
    },
  }
}

export async function GET(request: Request) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  const { searchParams } = new URL(request.url)
  const content = await MarketingRepository.listContent({
    status: searchParams.get("status") as never ?? undefined,
    propertyId: searchParams.get("propertyId") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  })
  return NextResponse.json({ content })
}

export async function POST(request: Request) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  const parsed = CreateContentSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid content request.", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const property = await MarketingRepository.getPropertySnapshot(parsed.data.propertyId)
    if (!property) return NextResponse.json({ error: "Property not found." }, { status: 404 })
    const prospectiveAssets = propertyAssetsForEligibility(property)
    const prospectiveSelection = selectionForPropertyMedia({
      format: parsed.data.format,
      propertyMediaIds: parsed.data.propertyMediaIds,
      assets: prospectiveAssets,
    })
    const prospectiveValidation = MediaEligibilityService.validate({ format: parsed.data.format, selection: prospectiveSelection, assets: prospectiveAssets })
    if (prospectiveValidation.error) return NextResponse.json({ error: prospectiveValidation.error }, { status: 409 })
    const activeLogo = parsed.data.brandTreatment.enabled
      ? await MarketingRepository.getActiveBrandLogo()
      : null
    if (parsed.data.brandTreatment.enabled && !activeLogo) {
      return NextResponse.json({ error: "Upload an active private brand logo before enabling brand treatment." }, { status: 409 })
    }
    const brandTreatment = brandTreatmentForRequest({
      format: parsed.data.format,
      requested: parsed.data.brandTreatment,
      logoId: activeLogo?.id ?? null,
    })
    const existing = await MarketingRepository.getContentByIdempotencyKey(parsed.data.idempotencyKey)
    if (existing) return NextResponse.json({ content: existing.content, duplicate: true })

    const account = await MarketingRepository.getInstagramAccount()
    let content = await MarketingRepository.createContent({
      format: parsed.data.format,
      objective: parsed.data.objective,
      creativeDirection: parsed.data.creativeDirection,
      property,
      accountId: account?.id,
      createdBy: access.user.id,
      idempotencyKey: parsed.data.idempotencyKey,
    })
    const sourceAssets = await MarketingRepository.addSourceAssets(content.id, property)
    const selection = selectionForPropertyMedia({
      format: parsed.data.format,
      propertyMediaIds: parsed.data.propertyMediaIds,
      assets: sourceAssets,
    })
    const selectedAssets = MediaEligibilityService.validate({ format: parsed.data.format, selection, assets: sourceAssets })
    if (selectedAssets.error) return NextResponse.json({ error: selectedAssets.error }, { status: 409 })

    // The stored definition is the only selection renderers may consume. A
    // later curated edit must update this ordered set rather than prompting a
    // fresh automatic choice.
    const contract = defaultMarketingContract({
      format: parsed.data.format,
      objective: parsed.data.objective,
      assetIds: selection.assetIds,
      selectionMode: selection.mode,
      creativeDirection: parsed.data.creativeDirection,
      brandTreatment,
    })
    content = await MarketingRepository.updateContent(content.id, {
      composition: withMarketingContract(
        parsed.data.format === "carousel"
          ? { format: "carousel", aspectRatio: "4:5", selectedAssetIds: selection.assetIds, audio: { type: "none", label: "No audio selected" } }
          : { selectedAssetIds: selection.assetIds },
        contract,
      ),
    }, access.user.id)
    await MarketingRepository.addAuditLog({
      actorId: access.user.id,
      contentId: content.id,
      action: "content.created",
      metadata: { contentType: storageContentTypeForFormat(parsed.data.format), format: parsed.data.format, objective: parsed.data.objective, propertyId: property.id, selectionMode: selection.mode, logoEnabled: brandTreatment.logo.enabled },
    })

    return NextResponse.json({ content }, { status: 202 })
  } catch (error) {
    console.error("Marketing content creation failed:", error)
    return NextResponse.json({ error: "Unable to create marketing content." }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  const body = await request.json().catch(() => null) as { id?: string } | null
  if (!body?.id) return NextResponse.json({ error: "Content ID is required." }, { status: 400 })
  const parsed = ContentUpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid content changes." }, { status: 400 })

  const current = await MarketingRepository.getContentById(body.id)
  if (!current) return NextResponse.json({ error: "Content not found." }, { status: 404 })
  if (["approved", "scheduled", "blocked_connection", "publishing", "published"].includes(current.content.status)) {
    return NextResponse.json({ error: "Approved, scheduled, and published content is locked. Request changes before editing." }, { status: 409 })
  }
  if (current.content.contentType === "carousel" && parsed.data.composition && "selectedAssetIds" in parsed.data.composition) {
    return NextResponse.json({ error: "Use Edit Carousel Media to choose, order, and set the cover image. Carousel media cannot be changed through this endpoint." }, { status: 409 })
  }

  const fieldMap = {
    caption: "caption",
    shortCaption: "short_caption",
    headline: "headline",
    hook: "hook",
    cta: "cta",
    hashtags: "hashtags",
    altText: "alt_text",
    composition: "composition",
  } as const
  const changes = Object.fromEntries(Object.entries(parsed.data)
    .map(([key, value]) => [fieldMap[key as keyof typeof fieldMap], value])
    .filter(([key]) => Boolean(key)))
  // A failed item may have a prior approval. Any subsequent material edit must
  // restart the human-review path rather than allowing that old approval to be reused.
  if (current.content.status === "failed") {
    changes.status = "draft"
    changes.last_error = null
  }

  const content = await MarketingRepository.updateContent(body.id, changes, access.user.id)
  await MarketingRepository.addAuditLog({
    actorId: access.user.id,
    contentId: body.id,
    action: "content.edited",
    metadata: { fields: Object.keys(changes) },
  })
  return NextResponse.json({ content })
}
