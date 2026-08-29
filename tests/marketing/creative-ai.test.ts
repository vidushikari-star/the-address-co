import { afterEach, describe, expect, it, vi } from "vitest"

import {
  CONTENT_GENERATION_TOO_LONG_MESSAGE,
  CreativeAIService,
  MARKETING_OUTPUT_TOKEN_BUDGETS,
  STORY_COPY_TOO_LONG_MESSAGE,
  fitStoryboardCopyForReelLayout,
} from "@/lib/marketing/services/creative-ai-service"
import type { MarketingBrandSettings, PropertyFactSnapshot, ReelStoryboard } from "@/lib/marketing/types"

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
  defaultReelLogoPlacement: "none",
  defaultReelLogoOpacity: 0.65,
  defaultReelLogoScale: "small",
}

const property: PropertyFactSnapshot = {
  id: "0cdbcd65-a87c-4cfe-9196-32e4a3e3b0ec",
  title: "Villa Verde",
  location: "Parra, Goa",
  bedrooms: 4,
  amenities: [],
  features: [],
  media: [{ id: "selected-image", url: "https://images.example/villa.jpg", type: "image", isCover: true }],
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
  storyCopy: { headline: "Villa Verde", supportingLine: "Parra, Goa", highlights: ["Four bedrooms"], priceLine: "", cta: "Arrange a private viewing." },
  coverText: "Villa Verde",
  altText: "Villa Verde in Parra, Goa.",
  suggestedDuration: 30,
  transitions: ["fade"],
  audioStyle: "manual_instagram",
  factsUsed: ["title", "location", "bedrooms"],
  claimProvenance: [
    { text: "Villa Verde", factKey: "title", factValue: "Villa Verde" },
    { text: "Parra, Goa", factKey: "location", factValue: "Parra, Goa" },
    { text: "Four bedrooms", factKey: "bedrooms", factValue: "4" },
  ],
}

const sourceAssetId = "1e149a39-7321-42d1-900c-7389c0da37a3"
const storyboard: ReelStoryboard = {
  hook: "Villa Verde, Parra",
  scenes: [{ assetId: sourceAssetId, overlayText: "Villa Verde", durationSeconds: 5, overlayPosition: "top_left", overlayType: "hook" }],
  endCard: { headline: "Villa Verde", cta: "Arrange a private viewing." },
}

const expectedPromptLimits = {
  feed_single: ["headline ≤120", "caption ≤900", "short caption ≤220", "CTA ≤120", "hashtags, each ≤48", "alt text ≤300"],
  carousel: ["caption ≤900", "CTA ≤120", "hashtags, each ≤48", "alt text ≤300"],
  story: ["headline ≤72", "supporting line ≤150", "highlights, each ≤60", "price line ≤64", "CTA ≤60", "caption ≤700", "hashtags, each ≤48", "alt text ≤300"],
  reel: ["hook ≤100", "caption ≤1000", "short caption ≤220", "CTA ≤120", "hashtags, each ≤48", "alt text ≤300", "cover text ≤80", "at most 6 overlays, each ≤80", "at most 4 transitions"],
} as const

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
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(completedResponse()))
    global.fetch = fetchMock

    const output = await CreativeAIService.generate({
      property,
      contentType: "reel",
      creativeDirection: "luxury_editorial",
      settings,
    })

    expect(output).toMatchObject({ headline: creative.hook, hook: creative.hook, caption: creative.caption, cta: creative.cta, hashtags: creative.hashtags })
    expect(fetchMock).toHaveBeenCalledWith("https://api.openai.com/v1/responses", expect.objectContaining({ method: "POST" }))
    const request = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    const input = JSON.parse(request.input[1].content)
    expect(input.propertyFacts).toMatchObject({ title: "Villa Verde", location: "Parra, Goa", bedrooms: 4 })
    expect(input).not.toHaveProperty("brandSettings")
    expect(input).not.toHaveProperty("deliveryFormat")
    expect(request).toMatchObject({ model: "gpt-5.2", max_output_tokens: MARKETING_OUTPUT_TOKEN_BUDGETS.reel })
    expect(request.text.format).toMatchObject({ type: "json_schema", strict: true, name: "marketing_creative" })
    expect(request.input[0].content).toContain("dream home")
    expect(request.input[0].content).toContain("Objective: property_spotlight")
    expect(request.input[0].content.match(/The Address Co/g)).toHaveLength(1)
  })

  it("uses compact, format-specific schemas and token budgets", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(completedResponse()))
    global.fetch = fetchMock

    for (const [format, required, omitted] of [
      ["feed_single", ["headline", "caption", "altText"], ["carouselSlides", "storyCopy", "onScreenText"]],
      ["carousel", ["caption", "cta", "altText"], ["carouselSlides", "storyCopy", "onScreenText", "coverText"]],
      ["story", ["caption", "storyCopy", "altText"], ["carouselSlides", "onScreenText", "coverText"]],
      ["reel", ["hook", "onScreenText", "coverText", "transitions"], ["carouselSlides", "storyCopy"]],
    ] as const) {
      const output = await CreativeAIService.generate({ property, format, objective: "property_spotlight", creativeDirection: "luxury_editorial", settings })
      const request = JSON.parse((fetchMock.mock.calls.at(-1)![1] as RequestInit).body as string)
      const fields = Object.keys(request.text.format.schema.properties)
      expect(request.max_output_tokens).toBe(MARKETING_OUTPUT_TOKEN_BUDGETS[format])
      expect(fields).toEqual(expect.arrayContaining([...required]))
      expect(fields).not.toEqual(expect.arrayContaining([...omitted]))
      for (const limit of expectedPromptLimits[format]) {
        expect(request.input[0].content).toContain(limit)
      }
      if (format === "carousel") {
        expect(request.input[0].content).toContain("Carousel images are intentionally clean")
        expect(output.carouselSlides).toEqual([])
      }
    }
  })

  it("rejects factual output that omits the required claim provenance", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    global.fetch = vi.fn().mockResolvedValue(completedResponse({ ...creative, claimProvenance: [] }))

    await expect(CreativeAIService.generate({
      property,
      format: "feed_single",
      objective: "property_spotlight",
      creativeDirection: "luxury_editorial",
      settings,
    })).rejects.toThrow("missing claim provenance")
  })

  it("repairs oversized Story highlights once, then persists renderer-safe copy", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    const oversized = {
      ...creative,
      storyCopy: {
        ...creative.storyCopy,
        highlights: [
          "Four bedrooms with a landscaped garden and private pool deck",
          "Generous interiors for relaxed tropical living and guests",
          "A quiet North Goa address close to everyday conveniences",
        ],
      },
    }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(completedResponse(oversized))
      .mockResolvedValueOnce(completedResponse(creative))
    global.fetch = fetchMock

    const output = await CreativeAIService.generate({
      property,
      contentType: "story",
      creativeDirection: "minimal",
      settings,
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const firstRequest = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    const repairRequest = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string)
    expect(firstRequest.input[0].content).toContain("headline ≤72 characters")
    expect(firstRequest.input[0].content).toContain("supporting line ≤150")
    expect(firstRequest.input[0].content).toContain("price line ≤64")
    expect(firstRequest.input[0].content).toContain("CTA ≤60")
    expect(repairRequest.input[0].content).toContain("Repair only storyCopy")
    expect(output.storyCopy.highlights.every(item => item.length <= 32)).toBe(true)
  })

  it("repairs an otherwise-valid Story CTA that exceeds 60 characters once", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    const tooLongCta = "Request a private presentation and personalised property details today."
    expect(tooLongCta.length).toBeGreaterThan(60)
    const originalProperty = structuredClone(property)
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(completedResponse({ ...creative, storyCopy: { ...creative.storyCopy, cta: tooLongCta } }))
      .mockResolvedValueOnce(completedResponse(creative))
    global.fetch = fetchMock

    const output = await CreativeAIService.generate({
      property,
      format: "story",
      objective: "property_spotlight",
      creativeDirection: "luxury_editorial",
      settings,
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(output.storyCopy.cta.length).toBeLessThanOrEqual(60)
    const firstRequest = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    const repairRequest = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string)
    expect(repairRequest.input[0].content).toContain("Repair only storyCopy")
    expect(repairRequest.input[0].content).toContain("same factual content and editorial direction")
    expect(repairRequest.input[1].content).toBe(firstRequest.input[1].content)
    expect(property).toEqual(originalProperty)
  })

  it("repairs other bounded Story text fields with the same one-attempt path", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(completedResponse({ ...creative, storyCopy: { ...creative.storyCopy, supportingLine: "A".repeat(151) } }))
      .mockResolvedValueOnce(completedResponse(creative))
    global.fetch = fetchMock

    const output = await CreativeAIService.generate({
      property,
      format: "story",
      objective: "property_spotlight",
      creativeDirection: "luxury_editorial",
      settings,
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(output.storyCopy.supportingLine.length).toBeLessThanOrEqual(150)
    const repairRequest = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string)
    expect(repairRequest.input[0].content).toContain("Repair only storyCopy")
  })

  it("stops after a second invalid Story schema response without exposing Zod details", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    const tooLongCta = "Request a private presentation and personalised property details today."
    const fetchMock = vi.fn()
      .mockImplementation(() => Promise.resolve(completedResponse({ ...creative, storyCopy: { ...creative.storyCopy, cta: tooLongCta } })))
    global.fetch = fetchMock

    await expect(CreativeAIService.generate({
      property,
      format: "story",
      objective: "property_spotlight",
      creativeDirection: "luxury_editorial",
      settings,
    })).rejects.toThrow(STORY_COPY_TOO_LONG_MESSAGE)

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("keeps one token recovery separate from one Story schema repair", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    const tokenLimited = response({
      id: "resp_incomplete",
      status: "incomplete",
      incomplete_details: { reason: "max_output_tokens" },
      output: [],
    })
    const tooLongCta = "Request a private presentation and personalised property details today."
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(tokenLimited)
      .mockResolvedValueOnce(completedResponse({ ...creative, storyCopy: { ...creative.storyCopy, cta: tooLongCta } }))
      .mockResolvedValueOnce(completedResponse(creative))
    global.fetch = fetchMock

    await expect(CreativeAIService.generate({
      property,
      format: "story",
      objective: "property_spotlight",
      creativeDirection: "luxury_editorial",
      settings,
    })).resolves.toMatchObject({ storyCopy: { cta: creative.storyCopy.cta } })

    expect(fetchMock).toHaveBeenCalledTimes(3)
    const tokenRecovery = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string)
    const schemaRepair = JSON.parse((fetchMock.mock.calls[2][1] as RequestInit).body as string)
    expect(tokenRecovery.input[0].content).toContain("previous response exceeded its output budget")
    expect(schemaRepair.input[0].content).toContain("Repair only storyCopy")
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

  it("recovers once from an output-token limit with the same bounded format budget", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    const tokenLimited = response({
      id: "resp_incomplete",
      status: "incomplete",
      incomplete_details: { reason: "max_output_tokens" },
      output: [],
    })
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(tokenLimited)
      .mockResolvedValueOnce(completedResponse())
    global.fetch = fetchMock

    await expect(CreativeAIService.generate({
      property,
      contentType: "reel",
      creativeDirection: "minimal",
      settings,
    })).resolves.toMatchObject({ caption: creative.caption })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const first = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    const recovery = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string)
    expect(first.max_output_tokens).toBe(MARKETING_OUTPUT_TOKEN_BUDGETS.reel)
    expect(recovery.max_output_tokens).toBe(MARKETING_OUTPUT_TOKEN_BUDGETS.reel)
    expect(recovery.input[0].content).toContain("previous response exceeded its output budget")
  })

  it("stops after one output-token recovery and returns a user-safe error", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(response({
      id: "resp_incomplete",
      status: "incomplete",
      incomplete_details: { reason: "max_output_tokens" },
      output: [],
    })))
    global.fetch = fetchMock

    await expect(CreativeAIService.generate({
      property,
      contentType: "reel",
      creativeDirection: "minimal",
      settings,
    })).rejects.toThrow(CONTENT_GENERATION_TOO_LONG_MESSAGE)
    expect(fetchMock).toHaveBeenCalledTimes(2)
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
    global.fetch = vi.fn().mockResolvedValue(completedResponse({
      ...creative,
      caption: "Guaranteed returns at Villa Verde.",
      factsUsed: ["title"],
      claimProvenance: [{ text: "Villa Verde", factKey: "title", factValue: "Villa Verde" }],
    }))
    await expect(CreativeAIService.generate({
      property,
      contentType: "reel",
      creativeDirection: "minimal",
      settings,
    })).rejects.toThrow("excluded language")
  })

  it("instructs the storyboard model to use mobile-safe overlay limits", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    const fetchMock = vi.fn().mockResolvedValue(completedResponse(storyboard))
    global.fetch = fetchMock

    await CreativeAIService.improveReelStoryboard({ property, creativeDirection: "minimal", settings, sourceAssetIds: [sourceAssetId], userPrompt: "Use a more minimal opening." })

    const request = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    expect(request.input[0].content).toContain("hook/title overlay ≤80 characters")
    expect(request.input[0].content).toContain("at most 2–3 short lines")
    expect(request.max_output_tokens).toBe(MARKETING_OUTPUT_TOKEN_BUDGETS.reel_storyboard)
    expect(JSON.parse(request.input[1].content)).not.toHaveProperty("brandSettings")
  })

  it("deterministically fits overly long storyboard overlays to the mobile-safe layout", () => {
    const fitted = fitStoryboardCopyForReelLayout({
      ...storyboard,
      scenes: [{ ...storyboard.scenes[0], overlayText: "A beautifully designed villa located in the heart of Siolim offering refined interiors, lush landscaping and a considered approach to tropical living.", overlayType: "hook" }],
      endCard: { headline: "Discover a beautifully designed home with refined interiors and lush tropical landscaping", cta: "Arrange a private viewing with our expert team today" },
    })

    expect(fitted.scenes[0].overlayText.length).toBeLessThanOrEqual(80)
    expect(`${fitted.endCard.headline}\n${fitted.endCard.cta}`.length).toBeLessThanOrEqual(100)
  })

  it("runs one bounded repair request when only an overlay length is invalid", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    const tooLong = {
      ...storyboard,
      scenes: [{ ...storyboard.scenes[0], overlayText: "This is deliberately far too long for a concise mobile-first hook and keeps going until it exceeds the strict eighty character hook layout limit." }],
    }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(completedResponse(tooLong))
      .mockResolvedValueOnce(completedResponse(storyboard))
    global.fetch = fetchMock

    const output = await CreativeAIService.improveReelStoryboard({ property, creativeDirection: "minimal", settings, sourceAssetIds: [sourceAssetId], userPrompt: "Use a concise opening." })

    expect(output.scenes[0].overlayText).toBe("Villa Verde")
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const repairRequest = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string)
    expect(repairRequest.input[0].content).toContain("Repair only the text lengths")
  })

  it("surfaces a friendly message after the bounded overlay repair also fails", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    const tooLong = {
      ...storyboard,
      scenes: [{ ...storyboard.scenes[0], overlayText: "This is deliberately far too long for a concise mobile-first hook and keeps going until it exceeds the strict eighty character hook layout limit." }],
    }
    global.fetch = vi.fn()
      .mockResolvedValueOnce(completedResponse(tooLong))
      .mockResolvedValueOnce(completedResponse(tooLong))

    await expect(CreativeAIService.improveReelStoryboard({ property, creativeDirection: "minimal", settings, sourceAssetIds: [sourceAssetId], userPrompt: "Use a concise opening." }))
      .rejects.toThrow("AI generated text that was too long for the Reel layout. Please try again or use a shorter creative instruction.")
  })
})
