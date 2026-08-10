import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { CreateCampaignSchema } from "@/lib/marketing/schemas"
import { CampaignPlanningService } from "@/lib/marketing/services/campaign-planning-service"

export async function GET() {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  return NextResponse.json({ campaigns: await MarketingRepository.listCampaigns() })
}

export async function POST(request: Request) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  const parsed = CreateCampaignSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid campaign request.", details: parsed.error.flatten() }, { status: 400 })

  try {
    const properties = (await Promise.all(parsed.data.propertyIds.map(id => MarketingRepository.getPropertySnapshot(id)))).filter((property): property is NonNullable<typeof property> => Boolean(property))
    if (properties.length !== parsed.data.propertyIds.length) return NextResponse.json({ error: "One or more selected properties no longer exist." }, { status: 404 })
    const history = await MarketingRepository.listContent({ limit: 60 })
    const plan = CampaignPlanningService.plan({
      properties,
      durationDays: parsed.data.durationDays,
      postingFrequency: parsed.data.postingFrequency,
      startsAt: parsed.data.startsAt,
      creativeDirection: parsed.data.creativeDirection,
      recentlyMarketedPropertyIds: history
        .filter(item => ["approved", "scheduled", "publishing", "published"].includes(item.status))
        .map(item => item.primaryPropertyId)
        .filter((id): id is string => Boolean(id)),
    })
    const campaign = await MarketingRepository.createCampaign({
      title: parsed.data.title,
      objective: parsed.data.objective,
      creativeDirection: parsed.data.creativeDirection,
      durationDays: parsed.data.durationDays,
      postingFrequency: parsed.data.postingFrequency,
      plannedStartAt: parsed.data.startsAt,
      plannedEndAt: new Date(new Date(parsed.data.startsAt).valueOf() + parsed.data.durationDays * 86_400_000).toISOString(),
      plan,
      properties,
      createdBy: access.user.id,
    })
    await MarketingRepository.addAuditLog({ actorId: access.user.id, action: "campaign.plan_created", metadata: { campaignId: campaign.id, propertyIds: parsed.data.propertyIds } })
    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create campaign plan." }, { status: 400 })
  }
}
