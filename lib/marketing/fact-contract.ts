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

function compact(value: unknown, maximum: number) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim()
  if (text.length <= maximum) return text
  const bounded = text.slice(0, maximum)
  const withinLimit = bounded.replace(/\s+\S*$/, "").trim()
  return withinLimit || bounded.trim()
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

/**
 * The complete safe snapshot remains the source of truth for validation. The
 * generation prompt receives a compact, de-duplicated view so a long CRM
 * description or repeated amenity tags cannot consume the model's context.
 */
export function marketingPromptFacts(property: PropertyFactSnapshot): Partial<Record<MarketingSafeFactKey, string | number | string[]>> {
  const facts = marketingSafeFacts(property)
  const compacted: Partial<Record<MarketingSafeFactKey, string | number | string[]>> = {}
  const seenListValues = new Set<string>()

  for (const key of MARKETING_SAFE_FACT_KEYS) {
    const value = facts[key]
    if (value === undefined || value === null || value === "") continue
    if (Array.isArray(value)) {
      const values = value
        .map(item => compact(item, 80))
        .filter(Boolean)
        .filter(item => {
          const normalized = normalize(item)
          if (seenListValues.has(normalized)) return false
          seenListValues.add(normalized)
          return true
        })
        .slice(0, 12)
      if (values.length) compacted[key] = values
      continue
    }
    if (typeof value === "number") {
      compacted[key] = value
      continue
    }
    const maximum = key === "description" ? 600 : 180
    const valueForPrompt = compact(value, maximum)
    if (valueForPrompt) compacted[key] = valueForPrompt
  }

  return compacted
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
    const factValue = normalize(claim.factValue)
    // A long description may be compacted before it reaches the model. An
    // exact source excerpt remains grounded while avoiding provenance that
    // repeats an entire internal description or generated caption.
    if (!allowed.length || !allowed.some(value => value === factValue || value.includes(factValue))) {
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
