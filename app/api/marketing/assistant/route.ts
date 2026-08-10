import { NextResponse } from "next/server"
import { z } from "zod"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import type { CreativeDirection, MarketingContentType } from "@/lib/marketing/types"

const AssistantRequestSchema = z.object({
  prompt: z.string().trim().min(3).max(1_000),
  propertyId: z.string().uuid(),
})

function inferBrief(prompt: string): { contentType: MarketingContentType; creativeDirection: CreativeDirection } {
  const normalized = prompt.toLocaleLowerCase()
  const contentType: MarketingContentType = normalized.includes("carousel")
    ? "carousel"
    : normalized.includes("story") ? "story"
      : normalized.includes("infographic") ? "infographic"
        : normalized.includes("post") ? "single_image" : "reel"
  const creativeDirection: CreativeDirection = normalized.includes("investment")
    ? "investment_focused"
    : normalized.includes("lifestyle") ? "lifestyle"
      : normalized.includes("architecture") ? "architecture_focused"
        : normalized.includes("cinematic") ? "cinematic"
          : normalized.includes("luxur") ? "luxury_editorial" : "surprise_me"
  return { contentType, creativeDirection }
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
  const account = await MarketingRepository.getInstagramAccount()
  const content = await MarketingRepository.createContent({
    ...brief,
    property,
    accountId: account?.id,
    createdBy: access.user.id,
    idempotencyKey: crypto.randomUUID(),
    title: `${property.title} · assistant draft`,
  })
  await MarketingRepository.addSourceAssets(content.id, property)
  await MarketingRepository.enqueueJob({
    contentId: content.id,
    type: "generate_creative",
    input: { propertySnapshot: property, assistantPrompt: parsed.data.prompt },
    idempotencyKey: `generate-creative:${content.id}`,
  })
  await MarketingRepository.addAuditLog({ actorId: access.user.id, contentId: content.id, action: "assistant.draft_created", metadata: { prompt: parsed.data.prompt } })
  return NextResponse.json({
    content,
    reply: `Queued a ${brief.contentType.replaceAll("_", " ")} draft for ${property.title}. It will require your separate approval before scheduling or publishing.`,
  }, { status: 202 })
}
