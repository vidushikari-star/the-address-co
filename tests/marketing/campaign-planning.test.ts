import { describe, expect, it } from "vitest"

import { CampaignPlanningService } from "@/lib/marketing/services/campaign-planning-service"
import type { PropertyFactSnapshot } from "@/lib/marketing/types"

const properties: PropertyFactSnapshot[] = ["A", "B", "C"].map((title, index) => ({
  id: `00000000-0000-4000-8000-00000000000${index + 1}`,
  title: `Villa ${title}`,
  amenities: [],
  features: [],
  media: [],
  marketingPriority: index === 2 ? "paused" : "normal",
}))

describe("CampaignPlanningService", () => {
  it("rotates eligible properties and formats before generation", () => {
    const plan = CampaignPlanningService.plan({
      properties,
      durationDays: 14,
      postingFrequency: 3,
      startsAt: "2026-08-11T12:00:00.000Z",
    })

    expect(plan).toHaveLength(6)
    expect(plan.map(item => item.propertyName)).not.toContain("Villa C")
    expect(plan[0].propertyId).not.toBe(plan[1].propertyId)
    expect(new Set(plan.map(item => item.contentType)).size).toBeGreaterThan(2)
  })
})
