import { describe, expect, it } from "vitest"

import {
  assertSupportedNumericClaims,
  type ClaimProvenance,
  detectUnsupportedNumericClaim,
  factualValidationErrorDiagnostics,
  marketingRenderedCopyForFormat,
  marketingPromptFacts,
  marketingSafeFacts,
  validateMarketingFacts,
  validateClaimProvenance,
} from "@/lib/marketing/fact-contract"
import type { MarketingFormat, PropertyFactSnapshot } from "@/lib/marketing/types"

const property: PropertyFactSnapshot = {
  id: "property-1",
  title: "Villa Verde",
  location: "Parra, Goa",
  price: "6 Cr",
  bedrooms: 3,
  bathrooms: 3,
  amenities: ["private pool"],
  features: ["courtyard"],
  propertyType: "Villa",
  transactionType: "Sale",
  listingType: "Primary",
  developer: "Example Developments",
  media: [],
}

describe("Marketing fact contract", () => {
  it("exposes an explicit Marketing-safe inventory subset and omits unavailable facts", () => {
    const facts = marketingSafeFacts(property)
    expect(facts).toMatchObject({ title: "Villa Verde", bedrooms: 3, amenities: ["private pool"], developer: "Example Developments" })
    expect(facts.development_stage).toBeUndefined()
    expect(Object.keys(facts)).not.toContain("internal_notes")
    expect(Object.keys(facts)).not.toContain("commission")
  })

  it("accepts claim provenance that maps copy back to supplied inventory", () => {
    expect(validateClaimProvenance({
      property,
      factsUsed: ["bedrooms", "amenities"],
      claims: [
        { text: "3-bedroom residence", factKey: "bedrooms", factValue: "3" },
        { text: "private pool", factKey: "amenities", factValue: "private pool" },
      ],
      copy: "A 3-bedroom residence with a private pool.",
    })).toBe(true)
  })

  it("compacts prompt facts while accepting an exact excerpt of a long source fact", () => {
    const longProperty = {
      ...property,
      description: "A considered villa with a courtyard, private pool, and shaded entertaining terrace. ".repeat(20),
      amenities: ["private pool", "private pool", "shaded entertaining terrace"],
      features: ["private pool", "courtyard"],
    }
    const promptFacts = marketingPromptFacts(longProperty)

    expect(String(promptFacts.description).length).toBeLessThanOrEqual(600)
    expect(promptFacts.amenities).toEqual(["private pool", "shaded entertaining terrace"])
    expect(promptFacts.features).toEqual(["courtyard"])
    expect(validateClaimProvenance({
      property: longProperty,
      factsUsed: ["description"],
      claims: [{ text: "private pool", factKey: "description", factValue: "private pool" }],
      copy: "A private pool anchors the outdoor setting.",
    })).toBe(true)
    expect(String(marketingPromptFacts({ ...property, description: "x".repeat(700) }).description)).toHaveLength(600)
  })

  it("rejects unsupported or unavailable factual claims before approval", () => {
    expect(() => validateClaimProvenance({
      property,
      factsUsed: ["development_stage"],
      claims: [],
      copy: "Ready to move.",
    })).toThrow("unavailable inventory fact")
    expect(() => validateClaimProvenance({
      property,
      factsUsed: ["bedrooms"],
      claims: [{ text: "4-bedroom residence", factKey: "bedrooms", factValue: "4" }],
      copy: "A 4-bedroom residence.",
    })).toThrow("not grounded")
    expect(detectUnsupportedNumericClaim("A 4-bedroom residence in Parra.", property)).toContain("unsupported numeric claim")
    expect(() => validateClaimProvenance({
      property: { ...property, amenities: ["garden"] },
      factsUsed: ["amenities"],
      claims: [{ text: "private pool", factKey: "amenities", factValue: "private pool" }],
      copy: "A private pool anchors the outdoor setting.",
    })).toThrow("not grounded")
  })

  it("accepts a factual price when punctuation follows the numeric value", () => {
    const pricedProperty = { ...property, price: "₹1,25,00,000" }

    expect(detectUnsupportedNumericClaim("Listed at ₹1,25,00,000.", pricedProperty)).toBeNull()
  })

  it("does not mistake a fact-grounded property identifier for a numeric inventory claim", () => {
    const numberedProperty = { ...property, title: "Villa 18" }

    expect(detectUnsupportedNumericClaim("Villa 18, Parra, Goa.", numberedProperty)).toBeNull()
    expect(validateClaimProvenance({
      property: numberedProperty,
      factsUsed: ["title"],
      claims: [{ text: "Villa 18", factKey: "title", factValue: "Villa 18" }],
      copy: "Villa 18 — Parra, Goa.",
    })).toBe(true)
  })

  it("allows non-objective editorial language without forcing factual provenance", () => {
    const editorial = "A refined, serene, and considered setting for slower days."

    expect(validateClaimProvenance({
      property,
      factsUsed: [],
      claims: [],
      copy: editorial,
    })).toBe(true)
    expect(detectUnsupportedNumericClaim(editorial, property)).toBeNull()
  })

  it("accepts formatting-equivalent factual claims without permitting a different inventory value", () => {
    const pricedProperty = { ...property, price: "60000000", bedrooms: 4, builtUpArea: 3000 }

    expect(detectUnsupportedNumericClaim("₹6 Cr · a 4-bedroom home · 3,000 sq. ft.", pricedProperty)).toBeNull()
    expect(validateClaimProvenance({
      property: pricedProperty,
      factsUsed: ["bedrooms"],
      claims: [{ text: "4-bedroom", factKey: "bedrooms", factValue: "4" }],
      copy: "A four bedroom residence.",
    })).toBe(true)
    expect(detectUnsupportedNumericClaim("A 5-bedroom residence.", pricedProperty)).toContain("unsupported numeric claim")
  })

  it("returns only safe factual-failure metadata", () => {
    let error: unknown
    try {
      assertSupportedNumericClaims("A 5-bedroom residence.", property, "caption")
    } catch (caught) {
      error = caught
    }

    expect(factualValidationErrorDiagnostics(error)).toEqual({
      reasonCode: "unsupported_numeric_claim",
      ruleId: "explicit_numeric_claim_grounded",
      field: "caption",
      factCategory: "bedrooms",
      violationCount: 1,
    })
    expect(JSON.stringify(factualValidationErrorDiagnostics(error))).not.toContain("5-bedroom")
  })

  it.each(["feed_single", "carousel", "story", "reel"] as const)("uses the same canonical grounding contract for valid %s editorial copy", format => {
    const groundedProperty: PropertyFactSnapshot = {
      ...property,
      title: "Villa 18",
      location: "Parra, Goa",
      bedrooms: 4,
      bathrooms: 4,
      price: "60000000",
      builtUpArea: 450,
      amenities: ["private pool"],
      propertyType: "Villa",
    }
    const output = renderedOutputForFormat(format)
    const provenance = [
      { text: "audit title note", factKey: "title" as const, factValue: "Villa 18" },
      { text: "audit location note", factKey: "location" as const, factValue: "Parra" },
      { text: "audit bedroom note", factKey: "bedrooms" as const, factValue: "4" },
      { text: "audit amenity note", factKey: "amenities" as const, factValue: "private pool" },
    ]

    expect(() => validateMarketingFacts({
      format,
      propertySnapshot: groundedProperty,
      factsUsed: ["title", "location", "bedrooms", "amenities"],
      provenance,
      renderedCopy: marketingRenderedCopyForFormat(format, output),
    })).not.toThrow()
  })

  it.each(["feed_single", "carousel", "story", "reel"] as const)("allows %s editorial prose without provenance but rejects objective hallucinations", format => {
    const groundedProperty: PropertyFactSnapshot = {
      ...property,
      title: "Villa 18",
      bedrooms: 4,
      bathrooms: 4,
      price: "60000000",
      builtUpArea: 450,
      amenities: ["private pool"],
    }
    const validate = (value: string, overrides?: Partial<PropertyFactSnapshot>, provenance = [] as ClaimProvenance[]) => validateMarketingFacts({
      format,
      propertySnapshot: { ...groundedProperty, ...overrides },
      factsUsed: provenance.map(claim => claim.factKey),
      provenance,
      renderedCopy: [{ field: renderedFieldForFormat(format), value }],
    })

    expect(() => validate("A refined, serene, and beautifully considered home for effortless indoor-outdoor living.")).not.toThrow()
    expect(() => validate("A 5-bedroom villa.")).toThrow("unsupported numeric claim")
    expect(() => validate("5 bathrooms.")).toThrow("unsupported numeric claim")
    expect(() => validate("Offered at ₹4.5 Cr.")).toThrow("unsupported numeric claim")
    expect(() => validate("500 sqm of built-up area.")).toThrow("unsupported numeric claim")
    expect(() => validate("A private swimming pool.", { amenities: [] })).toThrow("unsupported objective property claim")
    expect(() => validate("A home in Candolim.", {}, [{ text: "audit location", factKey: "location", factValue: "Candolim" }])).toThrow("not grounded")
    expect(() => validate("Two minutes from the beach.")).toThrow("unsupported derived property claim")
    expect(() => validate("High rental yields.")).toThrow("unsupported derived property claim")
  })
})

function renderedFieldForFormat(format: MarketingFormat) {
  switch (format) {
    case "feed_single": return "caption"
    case "carousel": return "caption"
    case "story": return "storyCopy.highlights[0]"
    case "reel": return "onScreenText[0]"
  }
}

function renderedOutputForFormat(format: MarketingFormat) {
  switch (format) {
    case "feed_single":
      return {
        headline: "Villa 18, Parra",
        caption: "Villa 18 offers a refined expression of tropical living in Parra. Designed around a private pool, this four-bedroom home brings together calm interiors and effortless indoor-outdoor living.",
        shortCaption: "A refined Villa 18 in Parra.",
        cta: "Request details",
        altText: "Villa 18 in Parra.",
      }
    case "carousel":
      return {
        caption: "Villa 18 in Parra pairs a private pool with refined tropical living.",
        cta: "Request details",
        altText: "Villa 18 in Parra.",
        carouselSlides: ["Private pool", "Four-bedroom villa"],
      }
    case "story":
      return {
        caption: "Villa 18 in Parra.",
        altText: "Villa 18 in Parra.",
        storyCopy: {
          headline: "A private retreat in Parra",
          supportingLine: "Four bedrooms arranged around relaxed tropical living.",
          highlights: ["Private pool"],
          priceLine: "",
          cta: "Request details",
        },
      }
    case "reel":
      return {
        hook: "Step inside a calmer side of Goa living.",
        caption: "Villa 18 brings refined tropical living to Parra.",
        shortCaption: "Villa 18, Parra.",
        cta: "Request details",
        altText: "Villa 18 in Parra.",
        coverText: "Villa 18",
        onScreenText: ["Four-bedroom villa in Parra", "Private pool"],
      }
  }
}
