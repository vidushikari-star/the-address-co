import { afterEach, describe, expect, it } from "vitest"

import { CreativeAIService } from "@/lib/marketing/services/creative-ai-service"
import type { MarketingBrandSettings, PropertyFactSnapshot } from "@/lib/marketing/types"

const settings: MarketingBrandSettings = {
  preferredTone: "Premium, sophisticated, aspirational luxury real estate.",
  defaultHashtags: ["#NorthGoa"],
  excludedWords: ["guaranteed"],
  brandColors: {},
  timezone: "Asia/Kolkata",
}

const property: PropertyFactSnapshot = {
  id: "0cdbcd65-a87c-4cfe-9196-32e4a3e3b0ec",
  title: "Villa Verde",
  location: "Parra, Goa",
  bedrooms: 4,
  amenities: [],
  features: [],
  media: [],
}

const originalApiKey = process.env.OPENAI_API_KEY

afterEach(() => {
  process.env.OPENAI_API_KEY = originalApiKey
})

describe("CreativeAIService", () => {
  it("grounds fallback creative in the supplied property snapshot", async () => {
    delete process.env.OPENAI_API_KEY
    const output = await CreativeAIService.generate({
      property,
      contentType: "reel",
      creativeDirection: "luxury_editorial",
      settings,
    })

    expect(output.caption).toContain("Villa Verde")
    expect(output.caption).toContain("Parra, Goa")
    expect(output.caption).toContain("4 bedrooms")
    expect(output.caption).not.toMatch(/₹|crore|ROI|pool/i)
    expect(output.factsUsed).toEqual(expect.arrayContaining(["title", "location", "bedrooms"]))
  })

  it("rejects excluded language even for otherwise valid creative output", async () => {
    delete process.env.OPENAI_API_KEY
    await expect(CreativeAIService.generate({
      property,
      contentType: "reel",
      creativeDirection: "minimal",
      settings: { ...settings, preferredCta: "Guaranteed viewings." },
    })).rejects.toThrow("excluded language")
  })
})
