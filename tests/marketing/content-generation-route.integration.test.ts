import { afterEach, describe, expect, it, vi } from "vitest"

import { INVALID_MARKETING_GENERATION_OUTPUT_MESSAGE } from "@/lib/marketing/generation-errors"

const repository = vi.hoisted(() => ({
  getContentById: vi.fn(),
  getBrandSettings: vi.fn(),
  getActiveBrandLogo: vi.fn(),
  queueStaticRender: vi.fn(),
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

function configureStoryStudioRoute() {
  repository.getContentById.mockResolvedValue({
    content: {
      id: contentId,
      primaryPropertyId: property.id,
      propertySnapshot: property,
      contentType: "story",
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

describe("Create Studio Story generation route with the real repair-aware generator", () => {
  it("repairs an overlong Story CTA once and returns a successful Create Studio response", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    configureStoryStudioRoute()
    const tooLongCta = "Request a private presentation and personalised property details today."
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
    expect(repairRequest.input[0].content).toContain("Repair only storyCopy")
    expect(body).toMatchObject({ content: { creative: { storyCopy: { cta: validStoryProviderOutput.storyCopy.cta } } } })
    expect(JSON.stringify(body)).not.toContain("Too big")
    expect(JSON.stringify(body)).not.toContain("storyCopy.cta")
  })

  it("deterministically completes when the repair CTA is still too long", async () => {
    process.env.OPENAI_API_KEY = "server-only-test-key"
    configureStoryStudioRoute()
    const tooLongCta = "Request a private presentation and personalised property details today."
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(providerResponse({
      ...validStoryProviderOutput,
      storyCopy: { ...validStoryProviderOutput.storyCopy, cta: tooLongCta },
    })))
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
    expect(JSON.stringify(body)).not.toContain("Too big")
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
})
