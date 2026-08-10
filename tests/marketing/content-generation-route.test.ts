import { describe, expect, it, vi } from "vitest"

const repository = vi.hoisted(() => ({
  getContentById: vi.fn(),
  getPropertySnapshot: vi.fn(),
  getBrandSettings: vi.fn(),
  updateContent: vi.fn(),
  addAuditLog: vi.fn(),
  recordUsage: vi.fn(),
}))

const generate = vi.hoisted(() => vi.fn())

vi.mock("@/lib/auth/marketing", () => ({
  requireMarketingApiAccess: vi.fn().mockResolvedValue({
    user: { id: "admin-1" },
    error: null,
    status: null,
  }),
}))

vi.mock("@/lib/marketing/repositories/marketing-repository", () => ({ MarketingRepository: repository }))
vi.mock("@/lib/marketing/services/creative-ai-service", () => ({
  CreativeAIService: { generate },
}))

import { POST } from "@/app/api/marketing/content/[id]/generate/route"

const property = {
  id: "b2041f1f-89e9-4a59-a8de-00169502f523",
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

describe("POST /api/marketing/content/:id/generate", () => {
  it("persists generated headline, hook, caption, CTA, and hashtags", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    repository.getContentById.mockResolvedValue({
      content: {
        id: "1e149a39-7321-42d1-900c-7389c0da37a3",
        primaryPropertyId: property.id,
        propertySnapshot: property,
        contentType: "reel",
        creativeDirection: "luxury_editorial",
        status: "draft",
      },
      assets: [],
    })
    repository.getPropertySnapshot.mockResolvedValue(property)
    repository.getBrandSettings.mockResolvedValue({
      preferredTone: "Premium",
      defaultHashtags: ["#NorthGoa"],
      excludedWords: [],
      brandColors: {},
      timezone: "Asia/Kolkata",
    })
    generate.mockResolvedValue(creative)
    repository.updateContent.mockResolvedValue({ id: "1e149a39-7321-42d1-900c-7389c0da37a3", ...creative })
    repository.addAuditLog.mockResolvedValue(undefined)
    repository.recordUsage.mockResolvedValue(undefined)

    const response = await POST(
      new Request("http://localhost/api/marketing/content/1e149a39-7321-42d1-900c-7389c0da37a3/generate", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: "1e149a39-7321-42d1-900c-7389c0da37a3" }) }
    )

    expect(response.status).toBe(200)
    expect(repository.updateContent).toHaveBeenCalledWith(
      "1e149a39-7321-42d1-900c-7389c0da37a3",
      expect.objectContaining({
        headline: creative.headline,
        hook: creative.hook,
        caption: creative.caption,
        cta: creative.cta,
        hashtags: creative.hashtags,
        creative,
        short_caption: creative.shortCaption,
        alt_text: creative.altText,
      }),
      "admin-1"
    )
    await expect(response.json()).resolves.toMatchObject({
      fields: ["headline", "hook", "caption", "cta", "hashtags"],
      content: expect.objectContaining({ headline: creative.headline, hashtags: creative.hashtags }),
    })
  })
})
