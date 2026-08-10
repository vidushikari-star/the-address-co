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
const originalModel = process.env.OPENAI_MARKETING_MODEL

function response(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  })
}

function completedResponse(content: Record<string, unknown> = creative) {
  return response({
    id: "resp_test_123",
    status: "completed",
    output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(content) }] }],
  })
}

function restoreEnvironmentValue(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}

afterEach(() => {
  restoreEnvironmentValue("OPENAI_API_KEY", originalApiKey)
  restoreEnvironmentValue("OPENAI_MARKETING_MODEL", originalModel)
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

  it("uses native Responses structured parsing and returns validated creative output", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    const fetchMock = vi.fn().mockResolvedValue(completedResponse())
    global.fetch = fetchMock

    const output = await CreativeAIService.generate({
      property,
      contentType: "reel",
      creativeDirection: "luxury_editorial",
      settings,
    })

    expect(output).toMatchObject({ headline: creative.headline, hook: creative.hook, caption: creative.caption, cta: creative.cta, hashtags: creative.hashtags })
    expect(fetchMock).toHaveBeenCalledWith("https://api.openai.com/v1/responses", expect.objectContaining({ method: "POST" }))
    const request = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    const input = JSON.parse(request.input[1].content)
    expect(input.propertyFacts).toMatchObject({ title: "Villa Verde", location: "Parra, Goa", bedrooms: 4 })
    expect(input.brandSettings).toMatchObject({ brandName: "The Address Co", instagramHandle: "theaddressco", website: "https://theaddressco.example" })
    expect(request).toMatchObject({ model: "gpt-5.2", max_output_tokens: 1_200 })
    expect(request.text.format).toMatchObject({ type: "json_schema", strict: true, name: "marketing_creative" })
  })

  it("returns an actionable error for an empty completed response", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    global.fetch = vi.fn().mockResolvedValue(response({
      id: "resp_empty",
      status: "completed",
      output: [],
    }))

    await expect(CreativeAIService.generate({
      property,
      contentType: "reel",
      creativeDirection: "minimal",
      settings,
    })).rejects.toThrow("OpenAI returned no generated content")
  })

  it("returns an actionable error when the response is incomplete due to token limits", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    global.fetch = vi.fn().mockResolvedValue(response({
      id: "resp_incomplete",
      status: "incomplete",
      incomplete_details: { reason: "max_output_tokens" },
      output: [],
    }))

    await expect(CreativeAIService.generate({
      property,
      contentType: "reel",
      creativeDirection: "minimal",
      settings,
    })).rejects.toThrow("OpenAI output exceeded configured token limit")
  })

  it("returns an actionable error for malformed structured output", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    global.fetch = vi.fn().mockResolvedValue(response({
      id: "resp_malformed",
      status: "completed",
      output: [{ type: "message", content: [{ type: "output_text", text: "{not json" }] }],
    }))

    await expect(CreativeAIService.generate({
      property,
      contentType: "reel",
      creativeDirection: "minimal",
      settings,
    })).rejects.toThrow("OpenAI structured output could not be parsed")
  })

  it("returns an actionable refusal instead of treating it as missing output", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    global.fetch = vi.fn().mockResolvedValue(response({
      id: "resp_refusal",
      status: "completed",
      output: [{ type: "message", content: [{ type: "refusal", refusal: "I cannot help with that." }] }],
    }))

    await expect(CreativeAIService.generate({
      property,
      contentType: "reel",
      creativeDirection: "minimal",
      settings,
    })).rejects.toThrow("OpenAI refused the request")
  })

  it("rejects excluded language from otherwise valid AI output", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    global.fetch = vi.fn().mockResolvedValue(completedResponse({ ...creative, caption: "Guaranteed returns at Villa Verde." }))
    await expect(CreativeAIService.generate({
      property,
      contentType: "reel",
      creativeDirection: "minimal",
      settings,
    })).rejects.toThrow("excluded language")
  })
})
