import { NextResponse } from "next/server"
import { z } from "zod"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { defaultMarketingContract, storageContentTypeForFormat, withMarketingContract } from "@/lib/marketing/content-contract"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { MediaEligibilityService } from "@/lib/marketing/services/media-eligibility-service"
import type { CreativeDirection, MarketingFormat, MarketingObjective } from "@/lib/marketing/types"

const AssistantRequestSchema = z.object({
  prompt: z.string().trim().min(3).max(1_000),
  propertyId: z.string().uuid(),
})

function inferBrief(prompt: string): { format: MarketingFormat; objective: MarketingObjective; creativeDirection: CreativeDirection } {
  const normalized = prompt.toLocaleLowerCase()
  const format: MarketingFormat = normalized.includes("carousel")
    ? "carousel"
    : normalized.includes("story") ? "story"
      : normalized.includes("post") ? "feed_single" : "reel"
  const objective: MarketingObjective = normalized.includes("price")
    ? "price_update"
    : normalized.includes("architecture") ? "architecture"
      : normalized.includes("interior") ? "interiors"
        : normalized.includes("location") ? "location"
          : normalized.includes("new listing") || normalized.includes("just listed") ? "new_listing"
            : "property_spotlight"
  const creativeDirection: CreativeDirection = normalized.includes("investment")
    ? "investment_focused"
    : normalized.includes("lifestyle") ? "lifestyle"
      : normalized.includes("architecture") ? "architecture_focused"
        : normalized.includes("cinematic") ? "cinematic"
          : normalized.includes("luxur") ? "luxury_editorial" : "surprise_me"
  return { format, objective, creativeDirection }
}

/** The assistant creates drafts only; it has no approval, scheduling or publish intent. */
export async function POST(request: Request) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  const parsed = AssistantRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Choose a property and enter a marketing request." }, { status: 400 })

  const property = await MarketingRepository.getPropertySnapshot(parsed.data.propertyId)
  if (!property) return NextResponse.json({ error: "Property not found." }, { status: 404 })
  const brief = inferBrief(parsed.data.prompt)
  if (brief.format === "carousel" && property.media.filter(media => media.type === "image" && /^https:\/\//i.test(media.url)).length < 2) {
    return NextResponse.json({ error: "A Carousel requires at least 2 accessible property gallery images. Videos are available for Reels only." }, { status: 409 })
  }
  const account = await MarketingRepository.getInstagramAccount()
  let content = await MarketingRepository.createContent({
    ...brief,
    property,
    accountId: account?.id,
    createdBy: access.user.id,
    idempotencyKey: crypto.randomUUID(),
    title: `${property.title} · assistant draft`,
  })
  const sourceAssets = await MarketingRepository.addSourceAssets(content.id, property)
  const selection = MediaEligibilityService.automaticSelection(brief.format, sourceAssets)
  const eligibility = MediaEligibilityService.validate({ format: brief.format, selection, assets: sourceAssets })
  if (eligibility.error) return NextResponse.json({ error: eligibility.error }, { status: 409 })
  content = await MarketingRepository.updateContent(content.id, {
    composition: withMarketingContract(
      brief.format === "carousel"
        ? { format: "carousel", aspectRatio: "4:5", selectedAssetIds: selection.assetIds, audio: { type: "none", label: "No audio selected" } }
        : { selectedAssetIds: selection.assetIds },
      defaultMarketingContract({
        format: brief.format,
        objective: brief.objective,
        assetIds: selection.assetIds,
        creativeDirection: brief.creativeDirection,
      }),
    ),
  }, access.user.id)
  await MarketingRepository.enqueueJob({
    contentId: content.id,
    type: "generate_creative",
    input: { assistantPrompt: parsed.data.prompt },
    idempotencyKey: `generate-creative:${content.id}`,
  })
  await MarketingRepository.addAuditLog({ actorId: access.user.id, contentId: content.id, action: "assistant.draft_created", metadata: { prompt: parsed.data.prompt } })
  return NextResponse.json({
    content,
    reply: `Queued a ${storageContentTypeForFormat(brief.format).replaceAll("_", " ")} draft for ${property.title}. It will require your separate approval before scheduling or publishing.`,
  }, { status: 202 })
}
