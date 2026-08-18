import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { composeStaticInstagramContent, staticRenderJobType } from "@/lib/marketing/instagram-static-composition"
import { GenerateContentCopySchema } from "@/lib/marketing/schemas"
import { CreativeAIService } from "@/lib/marketing/services/creative-ai-service"
import type { MarketingStatus, PropertyFactSnapshot } from "@/lib/marketing/types"

export const runtime = "nodejs"

type Context = { params: Promise<{ id: string }> }

const GENERATABLE_STATUSES: MarketingStatus[] = [
  "draft",
  "changes_requested",
  "ready_for_review",
  "failed",
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
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  const parsed = GenerateContentCopySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Invalid generation request." }, { status: 400 })
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 503 })
  }

  try {
    const { id } = await context.params
    const record = await MarketingRepository.getContentById(id)
    if (!record) return NextResponse.json({ error: "Content not found." }, { status: 404 })
    if (!GENERATABLE_STATUSES.includes(record.content.status)) {
      return NextResponse.json({ error: "Request changes before regenerating approved, scheduled, or published content." }, { status: 409 })
    }

    const sourceProperty = record.content.primaryPropertyId
      ? await MarketingRepository.getPropertySnapshot(record.content.primaryPropertyId)
      : null
    const property = sourceProperty ?? record.content.propertySnapshot
    if (!isPropertySnapshot(property)) {
      return NextResponse.json({ error: "The source property facts are unavailable for this content." }, { status: 409 })
    }

    const settings = await MarketingRepository.getBrandSettings()
    const creative = await CreativeAIService.generate({
      property,
      contentType: record.content.contentType,
      creativeDirection: record.content.creativeDirection,
      settings,
    })
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

    if (record.content.contentType !== "reel") {
      const logo = record.content.contentType === "story"
        ? await MarketingRepository.getActiveBrandLogo()
        : null
      changes.composition = composeStaticInstagramContent({
        content: record.content,
        assets: record.assets,
        creative,
        logo: logo ? { id: logo.id, enabled: true } : null,
      })
    }

    let content = await MarketingRepository.updateContent(id, changes, access.user.id)
    if (record.content.contentType !== "reel") {
      const composition = changes.composition as { renderToken: string }
      await MarketingRepository.enqueueJob({
        contentId: id,
        type: staticRenderJobType(record.content.contentType),
        input: { resumeApproved: false, renderToken: composition.renderToken },
        idempotencyKey: `${staticRenderJobType(record.content.contentType)}:${id}:${composition.renderToken}`,
      })
      content = await MarketingRepository.updateContent(id, { status: "rendering" }, access.user.id)
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
    return NextResponse.json({ content, fields })
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI copy generation failed."
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
