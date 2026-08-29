import { describe, expect, it } from "vitest"

import { detectUnsupportedNumericClaim, marketingSafeFacts, validateClaimProvenance } from "@/lib/marketing/fact-contract"
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
  })
})
