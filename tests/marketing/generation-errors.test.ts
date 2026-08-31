import { describe, expect, it } from "vitest"

import {
  INVALID_MARKETING_GENERATION_OUTPUT_MESSAGE,
  STORY_COPY_TOO_LONG_MESSAGE,
  marketingGenerationErrorFormat,
  safeMarketingGenerationErrorMessage,
  tagMarketingGenerationErrorFormat,
} from "@/lib/marketing/generation-errors"
import { StoryCopySchema } from "@/lib/marketing/schemas"

function overlongStoryCtaError() {
  try {
    StoryCopySchema.parse({
      headline: "Villa Verde",
      supportingLine: "",
      highlights: [],
      priceLine: "",
      cta: "A".repeat(61),
    })
  } catch (error) {
    return error
  }
  throw new Error("Expected an overlong Story CTA to fail validation.")
}

describe("Marketing generation error mapping", () => {
  it("only exposes the Story length message for an actual Story format", () => {
    const error = overlongStoryCtaError()

    expect(safeMarketingGenerationErrorMessage(error, "story")).toBe(STORY_COPY_TOO_LONG_MESSAGE)
    expect(safeMarketingGenerationErrorMessage(error, "feed_single")).toBe(INVALID_MARKETING_GENERATION_OUTPUT_MESSAGE)
    expect(safeMarketingGenerationErrorMessage(error, "carousel")).toBe(INVALID_MARKETING_GENERATION_OUTPUT_MESSAGE)
    expect(safeMarketingGenerationErrorMessage(error, "reel")).toBe(INVALID_MARKETING_GENERATION_OUTPUT_MESSAGE)
    expect(safeMarketingGenerationErrorMessage(new Error(STORY_COPY_TOO_LONG_MESSAGE), "feed_single"))
      .toBe(INVALID_MARKETING_GENERATION_OUTPUT_MESSAGE)
  })

  it("retains non-enumerable format provenance for worker-safe mapping", () => {
    const error = new Error("Provider validation failed.")

    tagMarketingGenerationErrorFormat(error, "carousel")

    expect(marketingGenerationErrorFormat(error)).toBe("carousel")
    expect(JSON.stringify(error)).not.toContain("carousel")
  })
})
