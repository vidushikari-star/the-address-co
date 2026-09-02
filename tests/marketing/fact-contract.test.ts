import { describe, expect, it } from "vitest"

import {
  assertSupportedNumericClaims,
  assessMarketingFacts,
  canonicalizeAmenity,
  type ClaimProvenance,
  detectUnsupportedNumericClaim,
  factualValidationErrorDiagnostics,
  isCanonicalProvenanceFactKey,
  MARKETING_FACT_GROUNDING_SOURCES,
  MARKETING_PROVENANCE_FACT_KEYS,
  marketingFactGroundingSource,
  marketingRenderedCopyForFormat,
  marketingPromptFacts,
  marketingSafeFacts,
  validateMarketingFacts,
  validateClaimProvenance,
} from "@/lib/marketing/fact-contract"
import { CreativeOutputSchema } from "@/lib/marketing/schemas"
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

  it("returns no audit warnings for matching provenance", () => {
    expect(validateClaimProvenance({
      property,
      factsUsed: ["bedrooms", "amenities"],
      claims: [
        { text: "3-bedroom residence", factKey: "bedrooms", factValue: "3" },
        { text: "private pool", factKey: "amenities", factValue: "private pool" },
      ],
      copy: "A 3-bedroom residence with a private pool.",
    })).toEqual([])
  })

  it("keeps source description as compact generation context, not canonical provenance", () => {
    const longProperty = {
      ...property,
      description: "A considered villa with a courtyard, private pool, and shaded entertaining terrace. ".repeat(20),
      amenities: ["private pool", "private pool", "shaded entertaining terrace"],
      features: ["private pool", "courtyard"],
    }
    const promptFacts = marketingPromptFacts(longProperty)

    expect(String(promptFacts.description).length).toBeLessThanOrEqual(600)
    expect(promptFacts.amenities).toEqual(["private_pool", "shaded_entertaining_terrace"])
    expect(promptFacts.features).toEqual(["courtyard"])
    expect(marketingFactGroundingSource("description")).toBe("source_text")
    expect(MARKETING_FACT_GROUNDING_SOURCES).toMatchObject({ amenities: "collection", furnishing: "enum", bedrooms: "scalar" })
    expect(MARKETING_PROVENANCE_FACT_KEYS).not.toContain("description")
    expect(isCanonicalProvenanceFactKey("description")).toBe(false)
    expect(String(marketingPromptFacts({ ...property, description: "x".repeat(700) }).description)).toHaveLength(600)
  })

  it("parses and safely ignores legacy description provenance", () => {
    const legacyGrounding = CreativeOutputSchema.pick({ factsUsed: true, claimProvenance: true }).parse({
      factsUsed: ["description"],
      claimProvenance: [{ text: "legacy note", factKey: "description", factValue: "calm interiors" }],
    })
    const sourceProperty = {
      ...property,
      description: "A considered tropical home shaped around calm interiors and effortless indoor-outdoor living.",
    }

    expect(validateClaimProvenance({
      property: sourceProperty,
      factsUsed: legacyGrounding.factsUsed,
      claims: legacyGrounding.claimProvenance,
      copy: "A refined tropical home shaped around calm interiors.",
    })).toEqual([])
    expect(validateMarketingFacts({
      format: "feed_single",
      propertySnapshot: sourceProperty,
      factsUsed: legacyGrounding.factsUsed,
      provenance: legacyGrounding.claimProvenance,
      renderedCopy: [{ field: "caption", value: "A refined tropical home shaped around calm interiors and effortless indoor-outdoor living." }],
    })).toMatchObject({ hardViolations: [], warnings: [] })
  })

  it("downgrades unavailable and mismatched provenance to safe audit warnings", () => {
    expect(validateClaimProvenance({
      property,
      factsUsed: ["development_stage"],
      claims: [],
      copy: "Ready to move.",
    })).toMatchObject([{ warningCode: "unavailable_fact_reference", factCategory: "development_stage" }])
    expect(validateClaimProvenance({
      property,
      factsUsed: ["bedrooms"],
      claims: [{ text: "4-bedroom residence", factKey: "bedrooms", factValue: "4" }],
      copy: "A 4-bedroom residence.",
    })).toMatchObject([{ warningCode: "ungrounded_claim_value", factCategory: "bedrooms" }])
    expect(detectUnsupportedNumericClaim("A 4-bedroom residence in Parra.", property)).toContain("unsupported numeric claim")
    expect(validateClaimProvenance({
      property: { ...property, amenities: ["garden"] },
      factsUsed: ["amenities"],
      claims: [{ text: "private pool", factKey: "amenities", factValue: "private pool" }],
      copy: "A private pool anchors the outdoor setting.",
    })).toMatchObject([{ warningCode: "ungrounded_claim_value", factCategory: "amenities" }])
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
    })).toEqual([])
  })

  it("allows non-objective editorial language without forcing factual provenance", () => {
    const editorial = "A refined, serene, and considered setting for slower days."

    expect(validateClaimProvenance({
      property,
      factsUsed: [],
      claims: [],
      copy: editorial,
    })).toEqual([])
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
    })).toEqual([])
    expect(detectUnsupportedNumericClaim("A 5-bedroom residence.", pricedProperty)).toContain("unsupported numeric claim")
  })

  it("canonicalizes only deterministic CRM amenity labels and known aliases", () => {
    expect(canonicalizeAmenity("Private Swimming Pool")).toBe("private_pool")
    expect(canonicalizeAmenity("private_pool")).toBe("private_pool")
    expect(canonicalizeAmenity("Swimming Pools")).toBe("pool")
    expect(canonicalizeAmenity("AC")).toBe("air_conditioning")
    expect(canonicalizeAmenity("Covered Parking")).toBe("covered_parking")
    expect(canonicalizeAmenity("Rooftop Terrace")).toBe("rooftop_terrace")
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

  it("detects only explicit bedroom labels and never bare identifiers", () => {
    const fourBedroomProperty = { ...property, bedrooms: 4 }

    for (const claim of ["5 bedroom", "5-bedroom", "5 bed", "5-bed", "5 BHK", "five-bedroom"]) {
      expect(() => assertSupportedNumericClaims(`A ${claim} residence.`, fourBedroomProperty, "headline"))
        .toThrow("unsupported numeric claim")
    }

    for (const harmlessText of [
      "Villa 18",
      "Chapter 7",
      "Phase 2",
      "Plot 12",
      "#5bed",
      "Established in 2026",
      "12 Palm Road",
    ]) {
      expect(detectUnsupportedNumericClaim(harmlessText, fourBedroomProperty)).toBeNull()
    }
  })

  it("accepts equivalent structured amenity labels while preserving meaningful qualifiers", () => {
    const amenityProperty: PropertyFactSnapshot = {
      ...property,
      amenities: ["Private Swimming Pool", "Covered Parking", "Garden", "24/7 Security"],
      features: ["air_conditioning", "sea_view"],
      furnishing: "fully_furnished",
      developmentStage: "ready_to_move",
      propertyType: "independent_house",
    }

    expect(validateClaimProvenance({
      property: amenityProperty,
      factsUsed: ["amenities", "features", "furnishing", "development_stage", "property_type"],
      claims: [
        { factKey: "amenities", factValue: "private_pool" },
        { factKey: "amenities", factValue: "private pool" },
        { factKey: "amenities", factValue: "parking" },
        { factKey: "features", factValue: "ac" },
        { factKey: "furnishing", factValue: "fully furnished" },
        { factKey: "development_stage", factValue: "ready to move" },
        { factKey: "property_type", factValue: "independent house" },
      ],
    })).toEqual([])

    expect(() => validateClaimProvenance({
      property: amenityProperty,
      factsUsed: ["amenities"],
      claims: [{ factKey: "amenities", factValue: "covered_parking" }],
    })).not.toThrow()
    expect(validateClaimProvenance({
      property: { ...amenityProperty, amenities: ["Open Parking"] },
      factsUsed: ["amenities"],
      claims: [{ factKey: "amenities", factValue: "covered_parking" }],
    })).toMatchObject([{ warningCode: "ungrounded_claim_value", factCategory: "amenities" }])
    expect(validateClaimProvenance({
      property: { ...amenityProperty, amenities: ["Swimming Pool"] },
      factsUsed: ["amenities"],
      claims: [{ factKey: "amenities", factValue: "pool" }],
    })).toEqual([])
  })

  it("does not let description language silently establish a structured amenity", () => {
    const descriptionOnlyProperty = {
      ...property,
      amenities: [],
      features: [],
      description: "A serene setting, perfect for poolside living.",
    }

    expect(() => validateMarketingFacts({
      format: "feed_single",
      propertySnapshot: descriptionOnlyProperty,
      factsUsed: [],
      provenance: [],
      renderedCopy: [{ field: "caption", value: "A private pool anchors the garden." }],
    })).toThrow("unsupported objective property claim")
  })

  it("grounds pool, furnishing, and views through their correct structured sources", () => {
    const crossCategoryProperty: PropertyFactSnapshot = {
      ...property,
      amenities: ["Private Swimming Pool"],
      features: ["Sea View"],
      furnishing: "fully_furnished",
      description: "A calm setting with poolside-inspired interiors and a coastal feeling.",
    }

    expect(() => validateMarketingFacts({
      format: "feed_single",
      propertySnapshot: crossCategoryProperty,
      factsUsed: [],
      provenance: [],
      renderedCopy: [{ field: "caption", value: "A fully furnished home with a private pool and sea views." }],
    })).not.toThrow()
    expect(() => validateMarketingFacts({
      format: "feed_single",
      propertySnapshot: { ...crossCategoryProperty, amenities: [], features: [] },
      factsUsed: [],
      provenance: [],
      renderedCopy: [{ field: "caption", value: "A fully furnished home with a private pool and sea views." }],
    })).toThrow("unsupported objective property claim")
  })

  it("records provenance mismatches as safe warnings without generated or source labels", () => {
    const warnings = validateClaimProvenance({
      property: { ...property, amenities: ["Garden"], features: ["Covered Parking"] },
      factsUsed: ["amenities"],
      claims: [{ factKey: "amenities", factValue: "private_pool" }],
    })

    expect(warnings).toEqual([expect.objectContaining({
      warningCode: "ungrounded_claim_value",
      ruleId: "claim_fact_value_grounded",
      factCategory: "amenities",
    })])
    expect(JSON.stringify(warnings)).not.toContain("Garden")
    expect(JSON.stringify(warnings)).not.toContain("private_pool")
  })

  it.each(["feed_single", "carousel", "story", "reel"] as const)("uses the same permissive rendered-copy contract for valid %s editorial copy", format => {
    const groundedProperty: PropertyFactSnapshot = {
      ...property,
      title: "Villa 18",
      location: "Parra, Goa",
      bedrooms: 4,
      bathrooms: 4,
      price: "60000000",
      builtUpArea: 450,
      amenities: ["Private Swimming Pool", "Covered Parking", "Garden", "24/7 Security"],
      furnishing: "fully_furnished",
      propertyType: "Villa",
    }
    const output = renderedOutputForFormat(format)
    const provenance = [
      { text: "audit title note", factKey: "title" as const, factValue: "Villa 18" },
      { text: "audit location note", factKey: "location" as const, factValue: "Parra" },
      { text: "audit bedroom note", factKey: "bedrooms" as const, factValue: "4" },
      { text: "audit amenity note", factKey: "amenities" as const, factValue: "private_pool" },
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
    expect(() => validate("A covered parking bay.", { amenities: ["Open Parking"] }, [{ factKey: "amenities", factValue: "covered_parking" }])).not.toThrow()
    expect(() => validate("A rooftop terrace.", { amenities: ["Garden"] }, [{ factKey: "amenities", factValue: "rooftop_terrace" }])).not.toThrow()
    expect(() => validate("24-hour concierge.", { amenities: ["Security"] }, [{ factKey: "amenities", factValue: "24_hour_concierge" }])).not.toThrow()
    expect(() => validate("A home in Candolim.", {}, [{ text: "audit location", factKey: "location", factValue: "Candolim" }])).toThrow("unsupported objective property claim")
    expect(() => validate("Two minutes from the beach.")).toThrow("unsupported derived property claim")
    expect(() => validate("High rental yields.")).toThrow("unsupported derived property claim")
    expect(() => validate("Guaranteed 12% annual returns.")).toThrow("unsupported derived property claim")
  })

  it("returns only warnings for incomplete, unused, or legacy provenance", () => {
    const result = assessMarketingFacts({
      format: "feed_single",
      propertySnapshot: property,
      factsUsed: ["title", "unknown_legacy_key"],
      provenance: [{ factKey: "amenities", factValue: "not-an-inventory-key" }],
      renderedCopy: [{ field: "caption", value: "A refined home in Parra." }],
    })

    expect(result.hardViolations).toEqual([])
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ warningCode: "unknown_provenance_fact_reference" }),
      expect.objectContaining({ warningCode: "ungrounded_claim_value", factCategory: "amenities" }),
    ]))
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
