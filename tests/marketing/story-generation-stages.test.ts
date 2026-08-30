import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const openAiParse = vi.hoisted(() => vi.fn())
const normalizeStoryCopyForLayout = vi.hoisted(() => vi.fn())

vi.mock("openai", () => ({
  default: class OpenAI {
    responses = { parse: openAiParse }
  },
}))

vi.mock("openai/helpers/zod", () => ({
  zodTextFormat: vi.fn(() => ({ type: "json_schema" })),
}))

vi.mock("@/lib/marketing/story-copy-normalization", () => ({
  normalizeStoryCopyForLayout,
}))

import { marketingGenerationErrorDiagnostics } from "@/lib/marketing/generation-errors"
import { CreativeAIService } from "@/lib/marketing/services/creative-ai-service"

const property = {
  id: "b2041f1f-89e9-4a59-a8de-00169502f523",
  title: "Villa Verde",
  amenities: [],
  features: [],
  media: [],
}

const settings = {
  preferredTone: "Premium",
  defaultHashtags: [],
  excludedWords: [],
  brandColors: {},
  timezone: "Asia/Kolkata",
  defaultReelLogoPlacement: "none" as const,
  defaultReelLogoScale: "small" as const,
  defaultReelLogoOpacity: 0.65,
}

const storyCopy = {
  headline: "Villa Verde",
  supportingLine: "",
  highlights: [],
  priceLine: "",
  cta: "Request details",
}

const providerOutput = {
  caption: "Arrange a private viewing.",
  hashtags: ["#Homes"],
  altText: "A property exterior.",
  storyCopy,
  factsUsed: [],
  claimProvenance: [],
}

function completedResponse(output: unknown) {
  return {
    id: "resp_stage_test",
    status: "completed",
    output: [],
    output_parsed: output,
  }
}

async function generateStory() {
  return CreativeAIService.generate({
    property,
    format: "story",
    objective: "property_spotlight",
    creativeDirection: "luxury_editorial",
    settings,
  })
}

async function rejectedDiagnostics(work: Promise<unknown>) {
  try {
    await work
    throw new Error("Expected Story generation to fail")
  } catch (error) {
    return marketingGenerationErrorDiagnostics(error)
  }
}

beforeEach(() => {
  process.env.OPENAI_API_KEY = "server-only-test-key"
  openAiParse.mockReset()
  normalizeStoryCopyForLayout.mockReset()
  normalizeStoryCopyForLayout.mockImplementation(({ storyCopy: input }: { storyCopy: typeof storyCopy }) => ({ storyCopy: input }))
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("Story generation stage provenance", () => {
  it("tags a post-response provider parse failure", async () => {
    openAiParse.mockResolvedValue(completedResponse({
      ...providerOutput,
      storyCopy: { ...storyCopy, cta: "A".repeat(1_001) },
    }))

    const diagnostics = await rejectedDiagnostics(generateStory())

    expect(diagnostics).toMatchObject({
      stage: "provider_parse",
      validation: false,
    })
    expect(diagnostics.stage).not.toBeNull()
  })

  it("tags a final renderer validation failure after normalization", async () => {
    openAiParse.mockResolvedValue(completedResponse(providerOutput))
    normalizeStoryCopyForLayout.mockReturnValue({
      storyCopy: { ...storyCopy, cta: "A".repeat(61) },
    })

    const diagnostics = await rejectedDiagnostics(generateStory())

    expect(diagnostics).toMatchObject({
      stage: "final_renderer_validation",
      validation: false,
    })
    expect(diagnostics.stage).not.toBeNull()
  })
})
