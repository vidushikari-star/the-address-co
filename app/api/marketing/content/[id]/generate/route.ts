import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { resolveMarketingContract, withMarketingContract } from "@/lib/marketing/content-contract"
import {
  MARKETING_GENERATION_DIAGNOSTIC_VERSION,
  logMarketingGenerationBreadcrumb,
  marketingGenerationRuntimeDiagnostic,
} from "@/lib/marketing/generation-diagnostics"
import {
  marketingGenerationErrorDiagnostics,
  safeMarketingGenerationErrorMessage,
  storyGenerationErrorStage,
  tagStoryGenerationError,
  type StoryGenerationValidationStage,
} from "@/lib/marketing/generation-errors"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { composeStaticInstagramContent, staticRenderJobType } from "@/lib/marketing/instagram-static-composition"
import { GenerateContentCopySchema } from "@/lib/marketing/schemas"
import { CreativeAIService } from "@/lib/marketing/services/creative-ai-service"
import { CompositionService } from "@/lib/marketing/services/composition-service"
import { MediaEligibilityService } from "@/lib/marketing/services/media-eligibility-service"
import type { MarketingFormat, MarketingStatus, PropertyFactSnapshot } from "@/lib/marketing/types"

export const runtime = "nodejs"

type Context = { params: Promise<{ id: string }> }

const GENERATABLE_STATUSES: MarketingStatus[] = [
  "draft",
  "changes_requested",
  "ready_for_review",
  "failed",
  "rendering",
]

const ALL_COPY_FIELDS = ["headline", "hook", "caption", "cta", "hashtags", "story_copy"] as const
type DatabaseCopyField = Exclude<(typeof ALL_COPY_FIELDS)[number], "story_copy">

function isPropertySnapshot(value: unknown): value is PropertyFactSnapshot {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof (value as Record<string, unknown>).id === "string" &&
    typeof (value as Record<string, unknown>).title === "string"
  )
}

/**
 * Generates copy synchronously for the review screen. This is deliberately a
 * server-side route: property facts and brand settings never require browser
 * access to the OpenAI key.
 */
export async function POST(request: Request, context: Context) {
  console.info("Marketing generation runtime:", JSON.stringify(marketingGenerationRuntimeDiagnostic()))
  logMarketingGenerationBreadcrumb({ event: "route_entered", format: null })
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  const parsed = GenerateContentCopySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Invalid generation request." }, { status: 400 })
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 503 })
  }

  let generationStage: StoryGenerationValidationStage | null = null
  let generationFormat: MarketingFormat | null = null
  try {
    const { id } = await context.params
    const record = await MarketingRepository.getContentById(id)
    if (!record) return NextResponse.json({ error: "Content not found." }, { status: 404 })
    logMarketingGenerationBreadcrumb({ event: "content_row_loaded", format: null, contentId: id })
    if (!GENERATABLE_STATUSES.includes(record.content.status) || (record.content.status === "rendering" && record.content.contentType !== "story")) {
      return NextResponse.json({ error: "Request changes before regenerating approved, scheduled, or published content." }, { status: 409 })
    }

    const property = record.content.propertySnapshot
    if (!isPropertySnapshot(property)) {
      return NextResponse.json({ error: "The source property facts are unavailable for this content." }, { status: 409 })
    }

    const marketingContract = resolveMarketingContract(record.content)
    generationFormat = marketingContract.format
    logMarketingGenerationBreadcrumb({ event: "format_resolved", format: generationFormat, contentId: id })
    const selection = marketingContract.mediaSelection.assetIds.length
      ? marketingContract.mediaSelection
      : MediaEligibilityService.automaticSelection(marketingContract.format, record.assets)
    const selectedAssets = MediaEligibilityService.validate({
      format: marketingContract.format,
      selection,
      assets: record.assets,
    })
    if (selectedAssets.error) return NextResponse.json({ error: selectedAssets.error }, { status: 409 })

    const settings = await MarketingRepository.getBrandSettings()
    // This is a route-level fallback only; a more-specific service stage
    // always wins in the catch. It covers every format because all formats are
    // normalized into the historic full CreativeOutput shape.
    generationStage = "provider_schema"
    const creative = await CreativeAIService.generate({
      property,
      format: marketingContract.format,
      objective: marketingContract.objective,
      creativeDirection: record.content.creativeDirection,
      settings,
    })
    generationStage = "persistence_mapping"
    if (marketingContract.format === "story") {
      // The service has already accepted and normalized the Story. Everything
      // below maps that exact object into the persistence/render payload.
      console.info("Story generation validation:", JSON.stringify({
        stage: generationStage,
        issueCodes: [],
        issuePaths: [],
        fields: [{ field: "storyCopy.cta", creativeCharacters: creative.storyCopy.cta.length, rendererMaximum: 60 }],
      }))
    }
    const fields = parsed.data.fields ?? ALL_COPY_FIELDS
    const copy = {
      headline: creative.headline,
      hook: creative.hook,
      caption: creative.caption,
      cta: creative.cta,
      hashtags: creative.hashtags,
    }
    // `story_copy` belongs inside the validated creative/composition JSON; it
    // is intentionally not a marketing_content column.
    const databaseFields = fields.filter(field => field !== "story_copy") as DatabaseCopyField[]
    const changes = Object.fromEntries(databaseFields.map(field => [
      field === "cta" ? "cta" : field,
      copy[field],
    ])) as Record<string, unknown>
    changes.creative = creative
    changes.short_caption = creative.shortCaption
    changes.alt_text = creative.altText
    if (record.content.status === "ready_for_review") changes.status = "changes_requested"
    if (record.content.status === "failed") changes.status = "draft"

    if (marketingContract.format !== "reel") {
      const logo = marketingContract.format === "story" && marketingContract.brandTreatment.logo.enabled
        ? await MarketingRepository.getActiveBrandLogo()
        : null
      if (marketingContract.format === "story" && marketingContract.brandTreatment.logo.enabled && (!logo || (marketingContract.brandTreatment.logo.assetId && logo.id !== marketingContract.brandTreatment.logo.assetId))) {
        return NextResponse.json({ error: "The selected brand logo is unavailable. Disable it or choose an active logo before generating." }, { status: 409 })
      }
      logMarketingGenerationBreadcrumb({ event: "composition_creation", format: generationFormat, stage: generationStage, contentId: id })
      changes.composition = composeStaticInstagramContent({
        content: record.content,
        assets: record.assets,
        creative,
        logo: logo ? { id: logo.id, enabled: true } : null,
      })
    }

    let content: Awaited<ReturnType<typeof MarketingRepository.updateContent>>
    if (marketingContract.format !== "reel") {
      const composition = changes.composition as { renderToken: string }
      if (marketingContract.format === "story") {
        generationStage = "persistence"
        const persistedCreative = changes.creative as typeof creative
        const storyComposition = composition as typeof composition & { storyCopy: { cta: string } }
        // Metadata only: confirms the same renderer-safe CTA through the
        // persistence mapping without logging generated marketing copy.
        console.info("Story generation validation:", JSON.stringify({
          stage: generationStage,
          issueCodes: [],
          issuePaths: [],
          fields: [{
            field: "storyCopy.cta",
            creativeCharacters: creative.storyCopy.cta.length,
            persistedCreativeCharacters: persistedCreative.storyCopy.cta.length,
            compositionCharacters: storyComposition.storyCopy.cta.length,
            rendererMaximum: 60,
          }],
        }))
      }
      generationStage = "persistence"
      logMarketingGenerationBreadcrumb({ event: "persistence_start", format: generationFormat, stage: generationStage, contentId: id })
      const queued = await MarketingRepository.queueStaticRender({
        contentId: id,
        type: staticRenderJobType(marketingContract.format),
        renderToken: composition.renderToken,
        updatedBy: access.user.id,
        changes,
      })
      content = queued.content
      logMarketingGenerationBreadcrumb({ event: "persistence_complete", format: generationFormat, stage: generationStage, contentId: id })
    } else {
      const treatment = marketingContract.brandTreatment.logo
      const logo = treatment.enabled ? await MarketingRepository.getActiveBrandLogo() : null
      if (treatment.enabled && (!logo || (treatment.assetId && logo.id !== treatment.assetId))) {
        return NextResponse.json({ error: "The selected brand logo is unavailable. Disable it or choose an active logo before generating." }, { status: 409 })
      }
      logMarketingGenerationBreadcrumb({ event: "composition_creation", format: generationFormat, stage: generationStage, contentId: id })
      const composition = CompositionService.composeReel({
        propertyId: property.id,
        assetIds: selectedAssets.assets.map(asset => asset.id),
        creative,
        logo: treatment.enabled ? {
          placement: treatment.placement,
          scale: treatment.scale,
          opacity: treatment.opacity,
          assetId: logo!.id,
        } : undefined,
      })
      generationStage = "persistence"
      logMarketingGenerationBreadcrumb({ event: "persistence_start", format: generationFormat, stage: generationStage, contentId: id })
      content = await MarketingRepository.updateContent(id, { ...changes, composition: withMarketingContract(composition, marketingContract) }, access.user.id)
      await MarketingRepository.queueReelRender({
        contentId: id,
        updatedBy: access.user.id,
        idempotencyKey: `render-reel:${id}:${crypto.randomUUID()}`,
      })
      logMarketingGenerationBreadcrumb({ event: "persistence_complete", format: generationFormat, stage: generationStage, contentId: id })
    }
    await MarketingRepository.addAuditLog({
      actorId: access.user.id,
      contentId: id,
      action: parsed.data.fields?.length ? "content.copy_regenerated" : "content.copy_generated",
      metadata: { fields, propertyId: property.id, provider: "openai" },
    })
    await MarketingRepository.recordUsage({
      contentId: id,
      category: "ai_generation",
      unit: "request",
      metadata: { fields, model: process.env.OPENAI_MARKETING_MODEL ?? "gpt-5.2" },
    })
    logMarketingGenerationBreadcrumb({ event: "route_success", format: generationFormat, stage: generationStage, contentId: id })
    return NextResponse.json({ content, fields })
  } catch (error) {
    // Never serialize provider or Zod internals to the browser. These are
    // metadata-only diagnostics: no prompt, property facts, generated copy,
    // or credentials are logged here.
    const diagnosedError = generationStage && !storyGenerationErrorStage(error)
      ? tagStoryGenerationError(error, generationStage)
      : error
    console.error("Marketing AI generation failed:", JSON.stringify({
      origin: "content_generate_route",
      diagnosticVersion: MARKETING_GENERATION_DIAGNOSTIC_VERSION,
      format: generationFormat,
      ...marketingGenerationErrorDiagnostics(diagnosedError),
    }))
    const message = safeMarketingGenerationErrorMessage(diagnosedError, generationFormat)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
