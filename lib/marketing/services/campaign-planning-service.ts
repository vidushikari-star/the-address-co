import type {
  CampaignPlanItem,
  CreativeDirection,
  MarketingContentType,
  PropertyFactSnapshot,
} from "@/lib/marketing/types"

const DEFAULT_MIX: MarketingContentType[] = [
  "reel", "carousel", "single_image", "reel", "infographic", "story",
]

function titleForType(type: MarketingContentType, property: PropertyFactSnapshot) {
  switch (type) {
    case "reel": return `Discover ${property.title}`
    case "carousel": return `A closer look at ${property.title}`
    case "infographic": return `${property.title}: property snapshot`
    case "story": return `${property.title}, in focus`
    case "investment_opportunity": return `Explore ${property.title}`
    default: return `${property.title}, considered differently`
  }
}

/**
 * Creates a low-cost, reviewable campaign plan before any AI call or rendering
 * begins. The selection deliberately rotates properties and content formats.
 */
export class CampaignPlanningService {
  static plan(input: {
    properties: PropertyFactSnapshot[]
    durationDays: number
    postingFrequency: number
    startsAt: string
    creativeDirection?: CreativeDirection
    contentMix?: MarketingContentType[]
    recentlyMarketedPropertyIds?: string[]
  }): CampaignPlanItem[] {
    const recentlyMarketed = new Set(input.recentlyMarketedPropertyIds ?? [])
    const eligible = input.properties
      .filter(property => property.marketingPriority !== "paused")
      .sort((left, right) => Number(recentlyMarketed.has(left.id)) - Number(recentlyMarketed.has(right.id)))
    if (!eligible.length) throw new Error("Select at least one property that is not paused for marketing.")
    if (input.durationDays < 1 || input.durationDays > 90) throw new Error("Campaign duration must be between 1 and 90 days.")
    if (input.postingFrequency < 1 || input.postingFrequency > 7) throw new Error("Posting frequency must be between 1 and 7 posts per week.")

    const count = Math.max(1, Math.round(input.durationDays * input.postingFrequency / 7))
    const cadenceDays = input.durationDays / count
    const types = input.contentMix?.length ? input.contentMix : DEFAULT_MIX
    const start = new Date(input.startsAt)

    return Array.from({ length: count }, (_, index) => {
      const property = eligible[index % eligible.length]
      const contentType = types[index % types.length]
      const plannedFor = new Date(start.valueOf() + Math.round(index * cadenceDays) * 86_400_000)
      return {
        propertyId: property.id,
        propertyName: property.title,
        contentType,
        creativeDirection: input.creativeDirection ?? "surprise_me",
        plannedFor: plannedFor.toISOString(),
        hook: titleForType(contentType, property),
      }
    })
  }
}
