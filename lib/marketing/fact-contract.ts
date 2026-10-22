import type { PropertyFactSnapshot } from "@/lib/marketing/types"

/**
 * The bounded inventory snapshot that can be supplied to Marketing generation.
 * It is prompt context and optional audit metadata only; it is deliberately not
 * used to reinterpret or reject natural-language creative after generation.
 */
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

export function isMarketingSafeFactKey(key: string): key is MarketingSafeFactKey {
  return (MARKETING_SAFE_FACT_KEYS as readonly string[]).includes(key)
}

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

function compact(value: string, maximum: number) {
  const normalized = value.replace(/\s+/g, " ").trim()
  if (normalized.length <= maximum) return normalized
  const words = normalized.slice(0, maximum + 1).replace(/\s+\S*$/, "").trim()
  return words || normalized.slice(0, maximum).trimEnd()
}

/**
 * Supplies a compact, deterministic view of the authoritative snapshot to the
 * provider. This only limits prompt size and removes exact duplicate list
 * values; it does not classify, canonicalize, or validate generated prose.
 */
export function marketingPromptFacts(property: PropertyFactSnapshot): Partial<Record<MarketingSafeFactKey, string | number | string[]>> {
  const compacted: Partial<Record<MarketingSafeFactKey, string | number | string[]>> = {}
  const facts = marketingSafeFacts(property)

  for (const key of MARKETING_SAFE_FACT_KEYS) {
    const value = facts[key]
    if (value === undefined || value === null || value === "") continue
    if (Array.isArray(value)) {
      const seen = new Set<string>()
      const values = value
        .map(item => compact(item, 80))
        .filter(Boolean)
        .filter(item => {
          const normalized = item.toLocaleLowerCase()
          if (seen.has(normalized)) return false
          seen.add(normalized)
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
    const normalized = compact(value, maximum)
    if (normalized) compacted[key] = normalized
  }

  return compacted
}
