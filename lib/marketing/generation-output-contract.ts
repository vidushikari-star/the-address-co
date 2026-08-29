import type { MarketingFormat } from "@/lib/marketing/types"

export type EditorialGenerationContract = {
  format: MarketingFormat
  metadataFields: readonly string[]
  deterministicVisualFields: readonly string[]
  prohibitedVisualFields: readonly string[]
}

/**
 * Generation produces editorial data. Renderers decide, through the format
 * registry, which deterministic visual fields are ever allowed into pixels.
 */
export const EDITORIAL_GENERATION_CONTRACT = Object.freeze({
  feed_single: Object.freeze({
    format: "feed_single",
    metadataFields: ["headline", "caption", "shortCaption", "cta", "hashtags", "altText"],
    deterministicVisualFields: [],
    prohibitedVisualFields: ["headline", "caption", "cta", "hashtags", "coverText", "onScreenText"],
  }),
  carousel: Object.freeze({
    format: "carousel",
    metadataFields: ["headline", "caption", "shortCaption", "cta", "hashtags", "altText", "carouselSlides"],
    deterministicVisualFields: [],
    prohibitedVisualFields: ["headline", "caption", "cta", "hashtags", "carouselSlides"],
  }),
  story: Object.freeze({
    format: "story",
    metadataFields: ["caption", "altText", "hashtags"],
    deterministicVisualFields: ["storyCopy"],
    prohibitedVisualFields: ["caption", "hashtags"],
  }),
  reel: Object.freeze({
    format: "reel",
    metadataFields: ["headline", "caption", "shortCaption", "cta", "hashtags", "altText", "coverText"],
    deterministicVisualFields: ["onScreenText", "storyboard guidance"],
    prohibitedVisualFields: [],
  }),
} satisfies Record<MarketingFormat, EditorialGenerationContract>)

export function generationOutputInstructions(format: MarketingFormat) {
  const contract = EDITORIAL_GENERATION_CONTRACT[format]
  return [
    `Delivery format: ${format}.`,
    `Metadata fields: ${contract.metadataFields.join(", ") || "none"}.`,
    `Deterministic visual fields: ${contract.deterministicVisualFields.join(", ") || "none"}.`,
    contract.prohibitedVisualFields.length
      ? `Never imply these fields are visual pixels for this format: ${contract.prohibitedVisualFields.join(", ")}.`
      : "Visual fields must remain within the controlled renderer contract.",
  ].join("\n")
}
