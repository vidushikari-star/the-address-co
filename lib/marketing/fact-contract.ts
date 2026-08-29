import type { PropertyFactSnapshot } from "@/lib/marketing/types"

export const MARKETING_SAFE_FACT_KEYS = [
  "title",
  "location",
  "locality",
  "price",
  "bedrooms",
  "bathrooms",
  "carpet_area",
  "built_up_area",
  "plot_area",
  "description",
  "amenities",
  "features",
  "property_type",
  "listing_type",
  "transaction_type",
  "furnishing",
  "development_stage",
  "status",
  "developer",
] as const

export type MarketingSafeFactKey = (typeof MARKETING_SAFE_FACT_KEYS)[number]

export type ClaimProvenance = {
  text: string
  factKey: MarketingSafeFactKey
  factValue: string
}

function normalize(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase()
}

function stringValues(value: unknown) {
  return Array.isArray(value)
    ? value.map(normalize).filter(Boolean)
    : [normalize(value)].filter(Boolean)
}

/** Explicitly exposes only inventory-safe fields to generation. */
export function marketingSafeFacts(property: PropertyFactSnapshot): Record<MarketingSafeFactKey, string | number | string[] | undefined> {
  return {
    title: property.title,
    location: property.location,
    locality: property.locality,
    price: property.price,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    carpet_area: property.carpetArea,
    built_up_area: property.builtUpArea,
    plot_area: property.plotArea,
    description: property.description,
    amenities: property.amenities,
    features: property.features,
    property_type: property.propertyType,
    listing_type: property.listingType,
    transaction_type: property.transactionType,
    furnishing: property.furnishing,
    development_stage: property.developmentStage,
    status: property.status,
    developer: property.developer,
  }
}

export function factValues(property: PropertyFactSnapshot, key: MarketingSafeFactKey) {
  return stringValues(marketingSafeFacts(property)[key])
}

/**
 * Keeps the first M2 provenance contract small and reviewable. Claims are
 * stored alongside generated creative, then checked again before approval.
 */
export function validateClaimProvenance(input: {
  property: PropertyFactSnapshot
  claims: ClaimProvenance[]
  factsUsed: MarketingSafeFactKey[]
  copy: string
}) {
  for (const key of input.factsUsed) {
    if (!factValues(input.property, key).length) {
      throw new Error(`Generated copy references unavailable inventory fact: ${key}.`)
    }
  }
  for (const claim of input.claims) {
    const allowed = factValues(input.property, claim.factKey)
    if (!allowed.length || !allowed.includes(normalize(claim.factValue))) {
      throw new Error(`Generated claim is not grounded in the property snapshot: ${claim.factKey}.`)
    }
    if (!normalize(input.copy).includes(normalize(claim.text))) {
      throw new Error("Generated claim provenance does not match the generated copy.")
    }
  }
  return true
}

/** Detects common unsupported factual assertions even before a human review. */
export function detectUnsupportedNumericClaim(copy: string, property: PropertyFactSnapshot) {
  const permitted = new Set<string>()
  for (const key of ["price", "bedrooms", "bathrooms", "carpet_area", "built_up_area", "plot_area"] as const) {
    for (const value of factValues(property, key)) {
      for (const numeric of value.match(/\d+(?:[\d,.]*)?/g) ?? []) permitted.add(numeric.replaceAll(",", ""))
    }
  }
  const numbers = copy.match(/(?:₹\s*)?\d+(?:[\d,.]*)?(?:\s*(?:cr|crore|lakh|sq\.?\s*(?:ft|m)|bed(?:room)?s?|bath(?:room)?s?))?/gi) ?? []
  const unsupported = numbers.find(value => {
    const numeric = value.match(/\d+(?:[\d,.]*)?/g)?.[0]?.replaceAll(",", "")
    return numeric && !permitted.has(numeric)
  })
  return unsupported ? `Generated copy contains an unsupported numeric claim: ${unsupported.trim()}.` : null
}
