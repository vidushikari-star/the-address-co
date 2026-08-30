import { describe, expect, it } from "vitest"

import {
  fitStoryCopy,
  layoutStoryCopy,
  STORY_COPY_GUIDANCE,
  STORY_LAYOUT,
  storyCopyEditorFeedback,
  storyLayoutError,
  storyLogoLayout,
} from "@/lib/marketing/story-layout"
import { normalizeStoryCopyForLayout } from "@/lib/marketing/story-copy-normalization"
import type { StoryComposition, StoryCopy } from "@/lib/marketing/types"

const shortCopy: StoryCopy = {
  headline: "Villa Verde",
  supportingLine: "Parra, Goa",
  highlights: ["Four bedrooms"],
  priceLine: "",
  cta: "Arrange a viewing",
}

describe("Story mobile-safe layout", () => {
  it("uses the explicit 1080 by 1920 canvas and safe region", () => {
    expect(STORY_LAYOUT).toMatchObject({ width: 1080, height: 1920 })
    expect(STORY_LAYOUT.safe.bottom).toBeGreaterThan(0)
  })

  it("shares final wrapped lines with the renderer plan and never overflows the safe width", () => {
    const plans = layoutStoryCopy({
      ...shortCopy,
      headline: "A considered arrival in North Goa with bright, generous interiors",
      supportingLine: "A quiet address shaped for slow tropical living and private entertaining.",
    })

    expect(plans.every(plan => plan.fits)).toBe(true)
    expect(plans.every(plan => plan.lines.every(line => line.length > 0))).toBe(true)
    expect(plans.find(plan => plan.role === "headline")?.lines.length).toBeLessThanOrEqual(STORY_COPY_GUIDANCE.headline.maximumLines)
  })

  it("makes each selected editorial Story layout materially distinct while preserving the safe copy contract", () => {
    const editorial = layoutStoryCopy(shortCopy, "editorial_panel")
    const lowerThird = layoutStoryCopy(shortCopy, "lower_third")
    const statement = layoutStoryCopy(shortCopy, "dark_panel")

    expect(lowerThird.find(plan => plan.role === "headline")?.y).not.toBe(editorial.find(plan => plan.role === "headline")?.y)
    expect(statement.find(plan => plan.role === "headline")?.boxOpacity).toBeGreaterThan(editorial.find(plan => plan.role === "headline")!.boxOpacity)
    expect([...editorial, ...lowerThird, ...statement].every(plan => plan.fits)).toBe(true)
  })

  it("reduces type and spacing before shortening visual text", () => {
    const copy = {
      ...shortCopy,
      headline: "An exceptionally considered villa designed for relaxed tropical living",
    }
    const fit = fitStoryCopy(copy)

    expect(fit.fits).toBe(true)
    expect(fit.plans.find(plan => plan.role === "headline")?.fontSize).toBeLessThanOrEqual(76)
  })

  it("shortens three long highlights to three readable one-line safe entries", () => {
    const fit = fitStoryCopy({
      ...shortCopy,
      highlights: [
        "Four bedroom private residence with a large landscaped garden and pool deck",
        "Thoughtful interiors with generous daylight and a calm material palette",
        "A quiet North Goa setting for private entertaining and long weekends",
      ],
    })

    const highlights = fit.plans.find(plan => plan.role === "highlights")!
    expect(fit.fits).toBe(true)
    expect(fit.truncatedHighlights).toBe(true)
    expect(highlights.lines).toHaveLength(3)
    expect(highlights.lines.every(line => line.startsWith("• "))).toBe(true)
    expect(fit.storyCopy.highlights).toHaveLength(3)
  })

  it("persists a safe fallback for an unbreakable word instead of only clipping it at render time", () => {
    const fit = fitStoryCopy({
      ...shortCopy,
      headline: "ExtraordinarilyLongUnbrokenPropertyDescriptorThatCannotFitOnOneMobileLine",
    })

    expect(fit.fits).toBe(true)
    expect(fit.storyCopy.headline).toContain("…")
    expect(fit.storyCopy.headline).not.toBe("ExtraordinarilyLongUnbrokenPropertyDescriptorThatCannotFitOnOneMobileLine")
  })

  it("normalizes punctuation and Unicode without splitting words into invalid text", () => {
    const fit = fitStoryCopy({
      ...shortCopy,
      headline: "D'Souza’s ₹4.5 Cr home in São Tomé–North Goa",
      highlights: ["Indo-Portuguese • Tuscan • Japandi"],
    })

    expect(fit.fits).toBe(true)
    expect(fit.plans.map(plan => plan.text).join(" ")).toContain("D'Souza’s")
    expect(fit.plans.map(plan => plan.text).join(" ")).toContain("₹4.5")
  })

  it("exposes editor feedback instead of allowing an invisible overflow", () => {
    expect(storyCopyEditorFeedback({
      ...shortCopy,
      highlights: ["This deliberately long highlight needs to be compacted before it reaches the final mobile Story render."],
    })).toContain("shortened")
  })

  it("has no layout error after deterministic fitting, so legacy oversized copy can recover", () => {
    expect(storyLayoutError({
      ...shortCopy,
      highlights: ["An excessively long highlight that previously would have blocked Story generation even though the renderer can safely compact it."],
    })).toBeNull()
  })

  it("normalizes visual overflows at natural boundaries without rewriting a price", () => {
    const longPrice = "₹1,25,00,000 (inclusive of all applicable charges and registration)"
    const normalized = normalizeStoryCopyForLayout({
      objective: "open_house",
      storyCopy: {
        headline: "Villa Verde in Parra with considered tropical architecture and generous light-filled interiors throughout",
        supportingLine: "A calm North Goa address for private entertaining and long weekends, shaped by generous proportions, quiet outdoor spaces, a considered daily rhythm, and an enduringly elegant sense of arrival throughout the year.",
        highlights: [
          "Four bedrooms with a landscaped garden and private pool deck for relaxed tropical living",
          "Generous interiors shaped for quiet family time and considered entertaining",
        ],
        priceLine: longPrice,
        cta: "Request a private presentation and personalised property details today.",
      },
    })

    expect(normalized.fits).toBe(true)
    expect(normalized.storyCopy.headline.length).toBeLessThanOrEqual(72)
    expect(normalized.storyCopy.supportingLine.length).toBeLessThanOrEqual(150)
    expect(normalized.storyCopy.highlights.every(highlight => highlight.length <= 60)).toBe(true)
    expect(normalized.storyCopy.priceLine).toBe("")
    expect(normalized.storyCopy.cta).toBe("Request details")
    expect([normalized.storyCopy.headline, normalized.storyCopy.supportingLine, ...normalized.storyCopy.highlights, normalized.storyCopy.cta].some(value => value.endsWith("…"))).toBe(false)
    expect(fitStoryCopy(normalized.storyCopy).fits).toBe(true)
    expect(normalized.diagnostics.map(item => item.field)).toEqual(expect.arrayContaining(["headline", "supportingLine", "priceLine", "cta", "highlights[0]"]))
  })

  it("retains a renderer-safe price line byte-for-byte", () => {
    const priceLine = "₹1,25,00,000"
    const normalized = normalizeStoryCopyForLayout({
      storyCopy: { ...shortCopy, priceLine },
    })

    expect(normalized.storyCopy.priceLine).toBe(priceLine)
  })

  it("keeps a Story logo inside the same mobile-safe region", () => {
    const composition: StoryComposition = {
      propertyId: "1e149a39-7321-42d1-900c-7389c0da37a3",
      format: "story",
      aspectRatio: "9:16",
      sourceAssetId: "b2041f1f-89e9-4a59-a8de-00169502f523",
      storyCopy: shortCopy,
      layoutStyle: "editorial_panel",
      typographyStyle: "modern_sans",
      renderToken: "34d1e601-18e9-4caa-9cc4-8af4c11888f1",
      logo: { enabled: true, placement: "bottom_right", scale: "large", opacity: 0.8 },
    }
    const logo = storyLogoLayout(composition)!
    expect(logo.x + logo.size).toBeLessThanOrEqual(STORY_LAYOUT.width - STORY_LAYOUT.safe.right)
    expect(logo.y + logo.size).toBeLessThanOrEqual(STORY_LAYOUT.height - STORY_LAYOUT.safe.bottom)
  })
})
