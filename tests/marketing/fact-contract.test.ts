import { describe, expect, it } from "vitest"

import {
  assertSupportedNumericClaims,
  detectUnsupportedNumericClaim,
  factualValidationErrorDiagnostics,
  marketingPromptFacts,
  marketingSafeFacts,
  validateClaimProvenance,
} from "@/lib/marketing/fact-contract"
import type { PropertyFactSnapshot } from "@/lib/marketing/types"

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
})
