import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { defaultCarouselImageAssets } from "@/lib/marketing/content-delivery"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import type { PropertyFactSnapshot } from "@/lib/marketing/types"

type Context = { params: Promise<{ id: string }> }

/** Explicit admin approval starts generation; it does not approve, schedule, or publish child content. */
export async function POST(_request: Request, context: Context) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  const { id } = await context.params

  try {
    await MarketingRepository.approveCampaignPlan(id, access.user.id)
    const [items, account] = await Promise.all([
      MarketingRepository.getCampaignItems(id),
      MarketingRepository.getInstagramAccount(),
    ])
    const results: Array<{ itemId: string; contentId?: string; error?: string }> = []
    for (const item of items) {
      try {
        const property = item.property_snapshot as PropertyFactSnapshot
        const contentType = item.content_type as Parameters<typeof MarketingRepository.createContent>[0]["contentType"]
        if (contentType === "carousel" && property.media.filter(media => media.type === "image" && /^https:\/\//i.test(media.url)).length < 2) {
          throw new Error("A Carousel requires at least 2 accessible property gallery images. Videos are available for Reels only.")
        }
        let content = await MarketingRepository.createContent({
          contentType,
          creativeDirection: String(item.creative_direction ?? "surprise_me"),
          property,
          accountId: account?.id,
          campaignId: id,
          createdBy: access.user.id,
          idempotencyKey: String(item.id),
          title: String(item.hook ?? property.title),
        })
        const sourceAssets = await MarketingRepository.addSourceAssets(content.id, property)
        if (content.contentType === "carousel") {
          const selectedAssetIds = defaultCarouselImageAssets(sourceAssets).map(asset => asset.id)
          content = await MarketingRepository.updateContent(content.id, {
            composition: { format: "carousel", aspectRatio: "1:1", selectedAssetIds, audio: { type: "none", label: "No audio selected" } },
          }, access.user.id)
        }
        await MarketingRepository.updateContent(content.id, { proposed_publish_at: item.planned_for as string }, access.user.id)
        await MarketingRepository.linkCampaignItem(String(item.id), content.id)
        await MarketingRepository.enqueueJob({
          contentId: content.id,
          type: "generate_creative",
          input: { propertySnapshot: property },
          idempotencyKey: `generate-creative:${content.id}`,
        })
        results.push({ itemId: String(item.id), contentId: content.id })
      } catch (error) {
        results.push({ itemId: String(item.id), error: error instanceof Error ? error.message : "Generation could not be queued." })
      }
    }
    await MarketingRepository.updateCampaignStatus(id, results.some(result => result.error) ? "partially_approved" : "review_required")
    return NextResponse.json({ results }, { status: 202 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Campaign approval failed." }, { status: 409 })
  }
}
