import { afterEach, describe, expect, it, vi } from "vitest"

import { MARKETING_GENERATION_DIAGNOSTIC_VERSION } from "@/lib/marketing/generation-diagnostics"
import { INVALID_MARKETING_GENERATION_OUTPUT_MESSAGE } from "@/lib/marketing/generation-errors"
import { StoryCopySchema } from "@/lib/marketing/schemas"

const repository = vi.hoisted(() => ({
  getContentById: vi.fn(),
  getBrandSettings: vi.fn(),
  getActiveBrandLogo: vi.fn(),
  queueStaticRender: vi.fn(),
  updateContent: vi.fn(),
  queueReelRender: vi.fn(),
  addAuditLog: vi.fn(),
  recordUsage: vi.fn(),
}))

vi.mock("@/lib/auth/marketing", () => ({
  requireMarketingApiAccess: vi.fn().mockResolvedValue({
    user: { id: "admin-1" },
    error: null,
    status: null,
  }),
}))

vi.mock("@/lib/marketing/repositories/marketing-repository", () => ({ MarketingRepository: repository }))

import { POST } from "@/app/api/marketing/content/[id]/generate/route"

const contentId = "1e149a39-7321-42d1-900c-7389c0da37a3"
const sourceAssetId = "34d1e601-18e9-4caa-9cc4-8af4c11888f1"
const originalApiKey = process.env.OPENAI_API_KEY
const originalFetch = global.fetch

const property = {
  id: "b2041f1f-89e9-4a59-a8de-00169502f523",
  title: "Villa Verde",
  location: "Parra, Goa",
  bedrooms: 4,
  amenities: [],
  features: [],
  media: [],
}

const settings = {
  preferredTone: "Premium",
  defaultHashtags: ["#NorthGoa"],
  excludedWords: [],
  brandColors: {},
  timezone: "Asia/Kolkata",
  defaultReelLogoPlacement: "none" as const,
  defaultReelLogoScale: "small" as const,
  defaultReelLogoOpacity: 0.65,
}

const validStoryProviderOutput = {
  caption: "Discover Villa Verde in Parra, Goa. Four bedrooms. Arrange a private viewing.",
  hashtags: ["#NorthGoa"],
  altText: "Villa Verde in Parra, Goa.",
  storyCopy: {
    headline: "Villa Verde",
    supportingLine: "Parra, Goa",
    highlights: ["Four bedrooms"],
    priceLine: "",
    cta: "Arrange a private viewing.",
  },
  factsUsed: ["title", "location", "bedrooms"],
  claimProvenance: [
    { text: "Villa Verde", factKey: "title", factValue: "Villa Verde" },
    { text: "Parra, Goa", factKey: "location", factValue: "Parra, Goa" },
    { text: "Four bedrooms", factKey: "bedrooms", factValue: "4" },
  ],
}

const validFeedProviderOutput = {
  headline: "Villa Verde, Parra",
  caption: "Discover Villa Verde in Parra, Goa. Four bedrooms. Arrange a private viewing.",
  shortCaption: "Villa Verde in Parra, Goa.",
  cta: "A".repeat(61),
  hashtags: ["#NorthGoa"],
  altText: "Villa Verde in Parra, Goa.",
  factsUsed: ["title", "location", "bedrooms"],
  claimProvenance: [
    { text: "Villa Verde", factKey: "title", factValue: "Villa Verde" },
    { text: "Parra, Goa", factKey: "location", factValue: "Parra, Goa" },
    { text: "Four bedrooms", factKey: "bedrooms", factValue: "4" },
  ],
}

const longNonStoryCta = "A".repeat(80)

const validCarouselProviderOutput = {
  caption: validFeedProviderOutput.caption,
  cta: longNonStoryCta,
  hashtags: validFeedProviderOutput.hashtags,
  altText: validFeedProviderOutput.altText,
  factsUsed: validFeedProviderOutput.factsUsed,
  claimProvenance: validFeedProviderOutput.claimProvenance,
}

const validReelProviderOutput = {
  hook: "Discover Villa Verde in Parra, Goa.",
  caption: validFeedProviderOutput.caption,
  shortCaption: validFeedProviderOutput.shortCaption,
  cta: longNonStoryCta,
  hashtags: validFeedProviderOutput.hashtags,
  altText: validFeedProviderOutput.altText,
  coverText: "Villa Verde",
  onScreenText: ["Villa Verde", "Parra, Goa"],
  suggestedDuration: 30,
  transitions: ["fade"],
  factsUsed: validFeedProviderOutput.factsUsed,
  claimProvenance: validFeedProviderOutput.claimProvenance,
}

function providerResponse(content: Record<string, unknown>) {
  return new Response(JSON.stringify({
    id: "resp_test_123",
    status: "completed",
    output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(content) }] }],
  }), {
    status: 200,
    headers: { "content-type": "application/json" },
  })
}

function storyMarketingContract() {
  return {
    version: "v2" as const,
    format: "story" as const,
    objective: "property_spotlight" as const,
    creativeDirection: "luxury_editorial" as const,
    mediaSelection: { mode: "curated" as const, assetIds: [sourceAssetId] },
    brandTreatment: {
      version: "v1" as const,
      logo: { enabled: false, assetId: null, placement: "none" as const, scale: "small" as const, opacity: 0.8 },
    },
  }
}

function configureStoryStudioRoute(persistedContract = false) {
  repository.getContentById.mockResolvedValue({
    content: {
      id: contentId,
      primaryPropertyId: property.id,
      propertySnapshot: property,
      contentType: "story",
      creativeDirection: "luxury_editorial",
      status: "draft",
      composition: persistedContract ? { marketingContract: storyMarketingContract() } : {},
    },
    assets: [{
      id: sourceAssetId,
      kind: "original_reference",
      mediaType: "image",
      sourceUrl: "https://images.example/villa.jpg",
      metadata: {},
      sortOrder: 0,
      createdAt: "2026-08-10T00:00:00.000Z",
    }],
  })
  repository.getBrandSettings.mockResolvedValue(settings)
  repository.queueStaticRender.mockImplementation(async input => ({
    content: { id: input.contentId, ...input.changes },
    job: { id: "render-job-1" },
  }))
  repository.addAuditLog.mockResolvedValue(undefined)
  repository.recordUsage.mockResolvedValue(undefined)
}

function configureFeedStudioRoute() {
  repository.getContentById.mockResolvedValue({
    content: {
      id: contentId,
      primaryPropertyId: property.id,
      propertySnapshot: property,
      contentType: "single_image",
      creativeDirection: "luxury_editorial",
      status: "draft",
      composition: {},
    },
    assets: [{
      id: sourceAssetId,
      kind: "original_reference",
      mediaType: "image",
      sourceUrl: "https://images.example/villa.jpg",
      metadata: {},
      sortOrder: 0,
      createdAt: "2026-08-10T00:00:00.000Z",
    }],
  })
  repository.getBrandSettings.mockResolvedValue(settings)
  repository.queueStaticRender.mockImplementation(async input => ({
    content: { id: input.contentId, ...input.changes },
    job: { id: "render-job-1" },
  }))
  repository.addAuditLog.mockResolvedValue(undefined)
  repository.recordUsage.mockResolvedValue(undefined)
}

function configureCarouselStudioRoute() {
  repository.getContentById.mockResolvedValue({
    content: {
      id: contentId,
      primaryPropertyId: property.id,
      propertySnapshot: property,
      contentType: "carousel",
      creativeDirection: "luxury_editorial",
      status: "draft",
      composition: {},
    },
    assets: [0, 1].map(sortOrder => ({
      id: `${sourceAssetId}-${sortOrder}`,
      kind: "original_reference",
      mediaType: "image",
      sourceUrl: `https://images.example/villa-${sortOrder}.jpg`,
      metadata: {},
      sortOrder,
      createdAt: "2026-08-10T00:00:00.000Z",
    })),
  })
  repository.getBrandSettings.mockResolvedValue(settings)
  repository.queueStaticRender.mockImplementation(async input => ({
    content: { id: input.contentId, ...input.changes },
    job: { id: "render-job-1" },
  }))
  repository.addAuditLog.mockResolvedValue(undefined)
  repository.recordUsage.mockResolvedValue(undefined)
}

function configureReelStudioRoute() {
  repository.getContentById.mockResolvedValue({
    content: {
      id: contentId,
      primaryPropertyId: property.id,
      propertySnapshot: property,
      contentType: "reel",
      creativeDirection: "luxury_editorial",
      status: "draft",
      composition: {},
    },
    assets: [{
      id: sourceAssetId,
      kind: "original_reference",
      mediaType: "image",
      sourceUrl: "https://images.example/villa.jpg",
      metadata: {},
      sortOrder: 0,
      createdAt: "2026-08-10T00:00:00.000Z",
    }],
  })
  repository.getBrandSettings.mockResolvedValue(settings)
  repository.getActiveBrandLogo.mockResolvedValue(null)
  repository.updateContent.mockImplementation(async (id, changes) => ({ id, ...changes }))
  repository.queueReelRender.mockResolvedValue({ id: "render-job-1" })
  repository.addAuditLog.mockResolvedValue(undefined)
  repository.recordUsage.mockResolvedValue(undefined)
}

function generateRequest() {
  return POST(
    new Request(`http://localhost/api/marketing/content/${contentId}/generate`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
    { params: Promise.resolve({ id: contentId }) },
  )
}

afterEach(() => {
  vi.clearAllMocks()
  if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY
  else process.env.OPENAI_API_KEY = originalApiKey
  global.fetch = originalFetch
})

describe("Create Studio generation route with the real repair-aware generator", () => {
  it("accepts a CTA of 71 characters at the OpenAI structured-output boundary, then repairs it", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    configureStoryStudioRoute()
    const tooLongCta = "Request a private presentation and personalised property details today."
    expect(tooLongCta).toHaveLength(71)
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(providerResponse({
        ...validStoryProviderOutput,
        storyCopy: { ...validStoryProviderOutput.storyCopy, cta: tooLongCta },
      }))
      .mockResolvedValueOnce(providerResponse(validStoryProviderOutput))
    global.fetch = fetchMock

    const response = await generateRequest()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const firstRequest = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)
    const repairRequest = JSON.parse((fetchMock.mock.calls[1]![1] as RequestInit).body as string)
    expect(Object.keys(firstRequest.text.format.schema.properties)).toContain("storyCopy")
    expect(Object.keys(firstRequest.text.format.schema.properties)).not.toContain("campaignConcept")
    // This is the actual schema sent through zodTextFormat to OpenAI. The
    // renderer's 60-character CTA cap must not appear at this boundary.
    expect(firstRequest.text.format.schema.properties.storyCopy.properties.cta.maxLength).toBe(1_000)
    expect(firstRequest.text.format.schema.properties.storyCopy.properties.cta.maxLength).not.toBe(60)
    expect(repairRequest.input[0].content).toContain("Repair only storyCopy")
    expect(body).toMatchObject({ content: { creative: { storyCopy: { cta: validStoryProviderOutput.storyCopy.cta } } } })
    expect(JSON.stringify(body)).not.toContain("Too big")
    expect(JSON.stringify(body)).not.toContain("storyCopy.cta")
  })

  it("resolves the persisted Create Studio Story contract as story before calling the service", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    configureStoryStudioRoute(true)
    const fetchMock = vi.fn().mockResolvedValue(providerResponse(validStoryProviderOutput))
    global.fetch = fetchMock
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined)

    const response = await generateRequest()
    const body = await response.json()

    expect(response.status).toBe(200)
    const providerRequest = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)
    expect(Object.keys(providerRequest.text.format.schema.properties)).toContain("storyCopy")
    const resolvedFormat = info.mock.calls
      .filter(([message]) => message === "Marketing generation breadcrumb:")
      .map(([, metadata]) => JSON.parse(metadata as string))
      .find(breadcrumb => breadcrumb.event === "format_resolved")
    expect(resolvedFormat).toMatchObject({ format: "story" })
    expect(body.content.composition.marketingContract).toMatchObject({ format: "story" })
    info.mockRestore()
  })

  it("normalizes an overlong repair CTA through the real Create Studio route before final validation", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    configureStoryStudioRoute()
    const tooLongCta = "Request a private presentation and personalised property details today."
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(providerResponse({
      ...validStoryProviderOutput,
      storyCopy: { ...validStoryProviderOutput.storyCopy, cta: tooLongCta },
    })))
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined)
    global.fetch = fetchMock

    const response = await generateRequest()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(body.content.creative.storyCopy.cta).toBe("Request details")
    expect(body.content.creative.storyCopy.cta.length).toBeLessThanOrEqual(60)
    expect(body.content.creative.storyCopy.cta.endsWith("…")).toBe(false)
    expect(body.content.creative.storyCopy.headline.length).toBeLessThanOrEqual(72)
    expect(body.content.creative.storyCopy.supportingLine.length).toBeLessThanOrEqual(150)
    expect(body.content.creative.storyCopy.highlights.every((highlight: string) => highlight.length <= 60)).toBe(true)
    expect(body.content.creative.storyCopy.priceLine.length).toBeLessThanOrEqual(64)
    const queued = repository.queueStaticRender.mock.calls[0]?.[0]
    expect(queued?.changes.creative.storyCopy.cta).toBe(body.content.creative.storyCopy.cta)
    expect(queued?.changes.composition.storyCopy.cta).toBe(body.content.creative.storyCopy.cta)
    const stages = info.mock.calls
      .filter(([message]) => message === "Story generation validation:")
      .map(([, metadata]) => JSON.parse(metadata as string).stage)
    expect(stages).toEqual(expect.arrayContaining([
      "provider_schema",
      "provider_response_received",
      "provider_output_access",
      "provider_parse",
      "overflow_detection",
      "repair_request",
      "repair_parse",
      "normalization",
      "final_renderer_validation",
      "creative_output_validation",
      "persistence_mapping",
      "persistence",
    ]))
    expect(stages).not.toContain(null)
    const runtime = info.mock.calls
      .filter(([message]) => message === "Marketing generation runtime:")
      .map(([, metadata]) => JSON.parse(metadata as string))
    expect(runtime).toEqual([expect.objectContaining({
      route: "/api/marketing/content/[id]/generate",
      diagnosticVersion: MARKETING_GENERATION_DIAGNOSTIC_VERSION,
    })])
    const breadcrumbs = info.mock.calls
      .filter(([message]) => message === "Marketing generation breadcrumb:")
      .map(([, metadata]) => JSON.parse(metadata as string))
    expect(breadcrumbs).toEqual(expect.arrayContaining([
      ...[
        "route_entered",
        "content_row_loaded",
        "format_resolved",
        "creative_ai_service_entered",
        "openai_request_started",
        "openai_response_received",
        "provider_output_access",
        "structural_parse",
        "factual_validation",
        "overflow_detection",
        "repair_request",
        "repair_parse",
        "normalization",
        "final_renderer_validation",
        "creative_output_validation",
        "composition_creation",
        "persistence_start",
        "persistence_complete",
        "route_success",
      ].map(event => expect.objectContaining({
        diagnosticVersion: MARKETING_GENERATION_DIAGNOSTIC_VERSION,
        route: "/api/marketing/content/[id]/generate",
        event,
      })),
    ]))
    expect(JSON.stringify(body)).not.toContain("Too big")
    expect(JSON.stringify(body)).not.toContain("storyCopy.cta")
    info.mockRestore()
  })

  it("rejects structurally unreasonable Story output without a visual repair", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    configureStoryStudioRoute()
    const fetchMock = vi.fn().mockResolvedValue(providerResponse({
      ...validStoryProviderOutput,
      storyCopy: { ...validStoryProviderOutput.storyCopy, cta: "A".repeat(1_001) },
    }))
    global.fetch = fetchMock

    const response = await generateRequest()
    const body = await response.json()

    expect(response.status).toBe(502)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(body).toEqual({ error: INVALID_MARKETING_GENERATION_OUTPUT_MESSAGE })
    expect(JSON.stringify(body)).not.toContain("storyCopy.cta")
  })

  it("does not attempt Story length repair for a non-length structured-output failure", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    configureStoryStudioRoute()
    const fetchMock = vi.fn().mockResolvedValue(providerResponse({
      ...validStoryProviderOutput,
      storyCopy: { ...validStoryProviderOutput.storyCopy, headline: "" },
    }))
    global.fetch = fetchMock

    const response = await generateRequest()
    const body = await response.json()

    expect(response.status).toBe(502)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(body).toEqual({ error: INVALID_MARKETING_GENERATION_OUTPUT_MESSAGE })
    expect(JSON.stringify(body)).not.toContain("too_small")
    expect(JSON.stringify(body)).not.toContain("storyCopy.headline")
  })

  it("tags a persistence-boundary validation failure without exposing Story copy", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    configureStoryStudioRoute()
    global.fetch = vi.fn().mockResolvedValue(providerResponse(validStoryProviderOutput))
    repository.queueStaticRender.mockImplementation(() => {
      StoryCopySchema.parse({
        ...validStoryProviderOutput.storyCopy,
        cta: "A".repeat(61),
      })
    })
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined)

    const response = await generateRequest()
    const body = await response.json()

    expect(response.status).toBe(502)
    expect(body).toEqual({ error: "Story copy was too long to format. Please regenerate the Story copy." })
    const diagnostics = errorLog.mock.calls
      .filter(([message]) => message === "Marketing AI generation failed:")
      .map(([, metadata]) => JSON.parse(metadata as string))
    expect(diagnostics).toEqual([
      expect.objectContaining({
        origin: "content_generate_route",
        diagnosticVersion: MARKETING_GENERATION_DIAGNOSTIC_VERSION,
        format: "story",
        stage: "persistence",
        issueCodes: ["too_big"],
        issuePaths: ["cta"],
        storyLengthFields: ["cta"],
      }),
    ])
    expect(JSON.stringify(diagnostics)).not.toContain("A".repeat(61))
    errorLog.mockRestore()
  })

  it("preserves a Feed CTA of 80 characters through the real Create Studio route", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    configureFeedStudioRoute()
    const providerOutput = { ...validFeedProviderOutput, cta: longNonStoryCta }
    global.fetch = vi.fn().mockResolvedValue(providerResponse(providerOutput))

    const response = await generateRequest()
    const body = await response.json()

    expect(longNonStoryCta).toHaveLength(80)
    expect(response.status).toBe(200)
    expect(body.content.creative.cta).toBe(longNonStoryCta)
    expect(body.content.creative.storyCopy.cta).toBe(longNonStoryCta)
    expect(body.content.composition.cta).toBe(longNonStoryCta)
  })

  it("preserves a Carousel CTA of 80 characters through the real Create Studio route", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    configureCarouselStudioRoute()
    global.fetch = vi.fn().mockResolvedValue(providerResponse(validCarouselProviderOutput))

    const response = await generateRequest()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.content.creative.cta).toBe(longNonStoryCta)
    expect(body.content.creative.storyCopy.cta).toBe(longNonStoryCta)
    expect(body.content.composition.cta).toBe(longNonStoryCta)
  })

  it("preserves a Reel CTA of 80 characters through the real Create Studio route", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    configureReelStudioRoute()
    global.fetch = vi.fn().mockResolvedValue(providerResponse(validReelProviderOutput))

    const response = await generateRequest()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.content.creative.cta).toBe(longNonStoryCta)
    expect(body.content.creative.storyCopy.cta).toBe(longNonStoryCta)
    expect(repository.updateContent).toHaveBeenCalledWith(contentId, expect.objectContaining({
      cta: longNonStoryCta,
      creative: expect.objectContaining({ cta: longNonStoryCta }),
    }), "admin-1")
  })
})
