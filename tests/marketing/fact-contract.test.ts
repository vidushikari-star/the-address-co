import { describe, expect, it } from "vitest"

import {
  isMarketingSafeFactKey,
  marketingPromptFacts,
  marketingSafeFacts,
} from "@/lib/marketing/fact-contract"
import type { PropertyFactSnapshot } from "@/lib/marketing/types"

const property: PropertyFactSnapshot = {
  id: "property-1",
  title: "Villa Verde",
  location: "Parra, Goa",
  locality: "North Goa",
  price: "₹6 Cr",
  bedrooms: 4,
  bathrooms: 4,
  carpetArea: 3_000,
  builtUpArea: 4_200,
  propertyType: "Villa",
  furnishing: "fully furnished",
  amenities: ["Private pool", "Landscaped garden"],
  features: ["Architectural character", "Private pool"],
  description: "A thoughtfully furnished private retreat designed for poolside living and quiet evenings in Parra.",
  transactionType: "Sale",
  listingType: "Primary",
  developer: "Example Developments",
  media: [],
}

describe("Marketing generation property context", () => {
  it("exposes only the bounded authoritative snapshot", () => {
    const facts = marketingSafeFacts(property)

    expect(facts).toMatchObject({
      title: "Villa Verde",
      location: "Parra, Goa",
      price: "₹6 Cr",
      bedrooms: 4,
      bathrooms: 4,
      carpet_area: 3_000,
      built_up_area: 4_200,
      property_type: "Villa",
      furnishing: "fully furnished",
      amenities: ["Private pool", "Landscaped garden"],
      features: ["Architectural character", "Private pool"],
    })
    expect(Object.keys(facts)).not.toContain("internal_notes")
    expect(Object.keys(facts)).not.toContain("commission")
  })

  it("provides the complete available snapshot to the provider without semantic canonicalization", () => {
    const promptFacts = marketingPromptFacts(property)

    expect(promptFacts).toMatchObject({
      price: "₹6 Cr",
      bedrooms: 4,
      bathrooms: 4,
      carpet_area: 3_000,
      built_up_area: 4_200,
      property_type: "Villa",
      furnishing: "fully furnished",
      location: "Parra, Goa",
      amenities: ["Private pool", "Landscaped garden"],
      features: ["Architectural character", "Private pool"],
      description: property.description,
    })
  })

  it("bounds only prompt context and preserves generation-safe key checking", () => {
    const promptFacts = marketingPromptFacts({
      ...property,
      description: "A calm, considered home. ".repeat(80),
      amenities: ["Private pool", "private pool", "Garden"],
    })

    expect(String(promptFacts.description).length).toBeLessThanOrEqual(600)
    expect(promptFacts.amenities).toEqual(["Private pool", "Garden"])
    expect(isMarketingSafeFactKey("furnishing")).toBe(true)
    expect(isMarketingSafeFactKey("internal_notes")).toBe(false)
  })
})
