import { afterEach, describe, expect, it, vi } from "vitest"

import { CreativeAIService } from "@/lib/marketing/services/creative-ai-service"
import type { MarketingBrandSettings, PropertyFactSnapshot } from "@/lib/marketing/types"

const settings: MarketingBrandSettings = {
  brandName: "The Address Co",
  instagramHandle: "theaddressco",
  website: "https://theaddressco.example",
  whatsappCta: "WhatsApp us to arrange a viewing.",
  preferredTone: "Premium, sophisticated, aspirational luxury real estate.",
  preferredCta: "Arrange a private viewing.",
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

const creative = {
  campaignConcept: "A considered introduction to Villa Verde.",
  hook: "Discover Villa Verde in Parra, Goa.",
  headline: "Villa Verde, Parra",
  caption: "Discover Villa Verde in Parra, Goa. Four bedrooms. Arrange a private viewing.",
  shortCaption: "Villa Verde in Parra, Goa.",
  cta: "Arrange a private viewing.",
  hashtags: ["#NorthGoa"],
  onScreenText: ["Villa Verde"],
  carouselSlides: ["Villa Verde"],
  storyCopy: ["Villa Verde"],
  coverText: "Villa Verde",
  altText: "Villa Verde in Parra, Goa.",
  suggestedDuration: 30,
  transitions: ["fade"],
  audioStyle: "manual_instagram",
  factsUsed: ["title", "location", "bedrooms"],
}

const originalApiKey = process.env.OPENAI_API_KEY
const originalFetch = global.fetch

afterEach(() => {
  process.env.OPENAI_API_KEY = originalApiKey
  global.fetch = originalFetch
  vi.restoreAllMocks()
})

describe("CreativeAIService", () => {
  it("returns a clear error instead of silently creating blank copy without an API key", async () => {
    delete process.env.OPENAI_API_KEY
    await expect(CreativeAIService.generate({
      property,
      contentType: "reel",
      creativeDirection: "luxury_editorial",
      settings,
    })).rejects.toThrow("OPENAI_API_KEY is not configured")
  })

  it("sends only structured property facts and brand settings to the server-side Responses API", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ output_text: JSON.stringify(creative) }), { status: 200 }))
    global.fetch = fetchMock

    const output = await CreativeAIService.generate({
      property,
      contentType: "reel",
      creativeDirection: "luxury_editorial",
      settings,
    })

    expect(output).toMatchObject({ headline: creative.headline, hook: creative.hook, caption: creative.caption, cta: creative.cta, hashtags: creative.hashtags })
    expect(fetchMock).toHaveBeenCalledWith("https://api.openai.com/v1/responses", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer server-only-test-key" }),
    }))
    const request = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    const input = JSON.parse(request.input[1].content)
    expect(input.propertyFacts).toMatchObject({ title: "Villa Verde", location: "Parra, Goa", bedrooms: 4 })
    expect(input.brandSettings).toMatchObject({ brandName: "The Address Co", instagramHandle: "theaddressco", website: "https://theaddressco.example" })
    expect(request.text.format).toMatchObject({ type: "json_schema", strict: true })
  })

  it("rejects excluded language from otherwise valid AI output", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ output_text: JSON.stringify({ ...creative, caption: "Guaranteed returns at Villa Verde." }) }), { status: 200 }))
    await expect(CreativeAIService.generate({
      property,
      contentType: "reel",
      creativeDirection: "minimal",
      settings,
    })).rejects.toThrow("excluded language")
  })
})
