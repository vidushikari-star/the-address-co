import { describe, expect, it, vi } from "vitest"

const repository = vi.hoisted(() => ({
  getContentById: vi.fn(),
  getPropertySnapshot: vi.fn(),
  getBrandSettings: vi.fn(),
  getActiveBrandLogo: vi.fn(),
  updateContent: vi.fn(),
  enqueueJob: vi.fn(),
  queueReelRender: vi.fn(),
  queueStaticRender: vi.fn(),
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
  storyCopy: { headline: "Villa Verde", supportingLine: "Parra, Goa", highlights: ["Four bedrooms"], priceLine: "", cta: "Arrange a private viewing." },
  coverText: "Villa Verde",
  altText: "Villa Verde in Parra, Goa.",
  suggestedDuration: 30,
  transitions: ["fade"],
  audioStyle: "manual_instagram",
  factsUsed: ["title", "location", "bedrooms"],
}

describe("POST /api/marketing/content/:id/generate", () => {
  it("creates and queues a valid Reel composition from the main Create Studio generation path", async () => {
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
      assets: [{
        id: "34d1e601-18e9-4caa-9cc4-8af4c11888f1",
        kind: "original_reference",
        mediaType: "image",
        sourceUrl: "https://project.supabase.co/storage/v1/object/sign/villa.jpg",
        metadata: { isCover: true },
        sortOrder: 0,
        createdAt: "2026-08-10T00:00:00.000Z",
      }],
    })
    repository.getPropertySnapshot.mockResolvedValue(property)
    repository.getBrandSettings.mockResolvedValue({
      preferredTone: "Premium",
      defaultHashtags: ["#NorthGoa"],
      excludedWords: [],
      brandColors: {},
      timezone: "Asia/Kolkata",
      defaultReelLogoPlacement: "none",
      defaultReelLogoScale: "small",
      defaultReelLogoOpacity: 0.65,
    })
    repository.getActiveBrandLogo.mockResolvedValue(null)
    generate.mockResolvedValue(creative)
    repository.updateContent.mockResolvedValue({ id: "1e149a39-7321-42d1-900c-7389c0da37a3", ...creative })
    repository.addAuditLog.mockResolvedValue(undefined)
    repository.recordUsage.mockResolvedValue(undefined)
    repository.queueReelRender.mockResolvedValue({ id: "reel-job-1", status: "queued" })

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
        composition: expect.objectContaining({
          format: "reel",
          aspectRatio: "9:16",
          scenes: [expect.objectContaining({ assetId: "34d1e601-18e9-4caa-9cc4-8af4c11888f1" })],
        }),
      }),
      "admin-1"
    )
    expect(repository.queueReelRender).toHaveBeenCalledWith(expect.objectContaining({
      contentId: "1e149a39-7321-42d1-900c-7389c0da37a3",
      updatedBy: "admin-1",
      idempotencyKey: expect.stringMatching(/^render-reel:1e149a39-7321-42d1-900c-7389c0da37a3:/),
    }))
    expect(generate).toHaveBeenCalledWith(expect.objectContaining({
      property,
      format: "reel",
      objective: "property_spotlight",
    }))
    expect(repository.getPropertySnapshot).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toMatchObject({
      fields: ["headline", "hook", "caption", "cta", "hashtags", "story_copy"],
      content: expect.objectContaining({ headline: creative.headline, hashtags: creative.hashtags }),
    })
  })

  it("queues a Story-owned 1080×1920 creative instead of publishing its raw source", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    const sourceAssetId = "34d1e601-18e9-4caa-9cc4-8af4c11888f1"
    repository.getContentById.mockResolvedValue({
      content: { id: "1e149a39-7321-42d1-900c-7389c0da37a3", primaryPropertyId: property.id, propertySnapshot: property, contentType: "story", creativeDirection: "luxury_editorial", status: "rendering", composition: {} },
      assets: [{ id: sourceAssetId, kind: "original_reference", mediaType: "image", sourceUrl: "https://images.example/villa.jpg", metadata: {}, sortOrder: 0, createdAt: "2026-08-10T00:00:00.000Z" }],
    })
    repository.getPropertySnapshot.mockResolvedValue(property)
    repository.getBrandSettings.mockResolvedValue({ preferredTone: "Premium", defaultHashtags: ["#NorthGoa"], excludedWords: [], brandColors: {}, timezone: "Asia/Kolkata" })
    repository.getActiveBrandLogo.mockResolvedValue({ id: "8ae7a13d-bcaa-4b58-9355-c3d161f8ae42" })
    repository.updateContent.mockResolvedValue({ id: "1e149a39-7321-42d1-900c-7389c0da37a3", ...creative })
    repository.queueStaticRender.mockResolvedValue({ content: { id: "1e149a39-7321-42d1-900c-7389c0da37a3", ...creative }, job: { id: "job-1" } })
    repository.addAuditLog.mockResolvedValue(undefined)
    repository.recordUsage.mockResolvedValue(undefined)
    generate.mockResolvedValue(creative)

    const response = await POST(new Request("http://localhost/api/marketing/content/1e149a39-7321-42d1-900c-7389c0da37a3/generate", { method: "POST", body: JSON.stringify({}) }), { params: Promise.resolve({ id: "1e149a39-7321-42d1-900c-7389c0da37a3" }) })

    expect(response.status).toBe(200)
    expect(repository.queueStaticRender).toHaveBeenCalledWith(expect.objectContaining({
      contentId: "1e149a39-7321-42d1-900c-7389c0da37a3",
      type: "render_image",
      renderToken: expect.any(String),
      changes: expect.objectContaining({
        composition: expect.objectContaining({ format: "story", aspectRatio: "9:16", sourceAssetId, storyCopy: creative.storyCopy }),
      }),
    }))
  })

  it("rejects invalid selected media before AI generation or rendering can begin", async () => {
    vi.clearAllMocks()
    process.env.OPENAI_API_KEY = "server-only-test-key"
    repository.getContentById.mockResolvedValue({
      content: { id: "1e149a39-7321-42d1-900c-7389c0da37a3", propertySnapshot: property, contentType: "single_image", creativeDirection: "luxury_editorial", status: "draft", composition: {} },
      assets: [{ id: "34d1e601-18e9-4caa-9cc4-8af4c11888f1", kind: "original_reference", mediaType: "video", sourceUrl: "https://project.supabase.co/storage/v1/object/sign/tour.mp4", metadata: { probedMediaType: "video" }, sortOrder: 0, createdAt: "2026-08-10T00:00:00.000Z" }],
    })

    const response = await POST(new Request("http://localhost/api/marketing/content/1e149a39-7321-42d1-900c-7389c0da37a3/generate", { method: "POST", body: JSON.stringify({}) }), { params: Promise.resolve({ id: "1e149a39-7321-42d1-900c-7389c0da37a3" }) })

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining("still image") })
    expect(generate).not.toHaveBeenCalled()
    expect(repository.queueStaticRender).not.toHaveBeenCalled()
  })

  it("returns the bounded token-recovery message without exposing provider details", async () => {
    vi.clearAllMocks()
    process.env.OPENAI_API_KEY = "server-only-test-key"
    repository.getContentById.mockResolvedValue({
      content: {
        id: "1e149a39-7321-42d1-900c-7389c0da37a3",
        primaryPropertyId: property.id,
        propertySnapshot: property,
        contentType: "reel",
        creativeDirection: "luxury_editorial",
        status: "draft",
        composition: {},
      },
      assets: [{
        id: "34d1e601-18e9-4caa-9cc4-8af4c11888f1",
        kind: "original_reference",
        mediaType: "image",
        sourceUrl: "https://images.example/villa.jpg",
        metadata: {},
        sortOrder: 0,
        createdAt: "2026-08-10T00:00:00.000Z",
      }],
    })
    repository.getBrandSettings.mockResolvedValue({ preferredTone: "Premium", defaultHashtags: [], excludedWords: [], brandColors: {}, timezone: "Asia/Kolkata" })
    generate.mockRejectedValue(new Error("Content generation was too long to complete. Please try again or shorten the creative brief."))

    const response = await POST(new Request("http://localhost/api/marketing/content/1e149a39-7321-42d1-900c-7389c0da37a3/generate", {
      method: "POST",
      body: JSON.stringify({}),
    }), { params: Promise.resolve({ id: "1e149a39-7321-42d1-900c-7389c0da37a3" }) })

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ error: "Content generation was too long to complete. Please try again or shorten the creative brief." })
  })

  it("returns a friendly Story-schema repair error without raw Zod details", async () => {
    vi.clearAllMocks()
    process.env.OPENAI_API_KEY = "server-only-test-key"
    repository.getContentById.mockResolvedValue({
      content: {
        id: "1e149a39-7321-42d1-900c-7389c0da37a3",
        primaryPropertyId: property.id,
        propertySnapshot: property,
        contentType: "story",
        creativeDirection: "luxury_editorial",
        status: "draft",
        composition: {},
      },
      assets: [{
        id: "34d1e601-18e9-4caa-9cc4-8af4c11888f1",
        kind: "original_reference",
        mediaType: "image",
        sourceUrl: "https://images.example/villa.jpg",
        metadata: {},
        sortOrder: 0,
        createdAt: "2026-08-10T00:00:00.000Z",
      }],
    })
    repository.getBrandSettings.mockResolvedValue({ preferredTone: "Premium", defaultHashtags: [], excludedWords: [], brandColors: {}, timezone: "Asia/Kolkata" })
    generate.mockRejectedValue(new Error("Story copy was too long to format. Please regenerate the Story copy."))

    const response = await POST(new Request("http://localhost/api/marketing/content/1e149a39-7321-42d1-900c-7389c0da37a3/generate", {
      method: "POST",
      body: JSON.stringify({}),
    }), { params: Promise.resolve({ id: "1e149a39-7321-42d1-900c-7389c0da37a3" }) })

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ error: "Story copy was too long to format. Please regenerate the Story copy." })
  })
})
