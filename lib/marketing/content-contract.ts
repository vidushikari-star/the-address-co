import type {
  CreativeDirection,
  MarketingBrandTreatment,
  MarketingContentContract,
  MarketingContentType,
  MarketingFormat,
  MarketingMediaSelection,
  MarketingObjective,
} from "@/lib/marketing/types"

/**
 * These mappings exist only to read historic `content_type` values safely.
 * New content supplies format and objective independently. Never add a
 * catch-all mapping: an unknown value must be repaired instead of becoming a
 * Feed post by accident.
 */
const LEGACY_CONTENT_TYPE_CONTRACT: Readonly<Record<MarketingContentType, {
  format: MarketingFormat
  objective: MarketingObjective
}>> = Object.freeze({
  reel: { format: "reel", objective: "property_spotlight" },
  single_image: { format: "feed_single", objective: "property_spotlight" },
  carousel: { format: "carousel", objective: "property_spotlight" },
  story: { format: "story", objective: "property_spotlight" },
  infographic: { format: "feed_single", objective: "brand_editorial" },
  property_spotlight: { format: "feed_single", objective: "property_spotlight" },
  new_listing: { format: "feed_single", objective: "new_listing" },
  price_update: { format: "feed_single", objective: "price_update" },
  just_listed: { format: "feed_single", objective: "new_listing" },
  luxury_lifestyle: { format: "feed_single", objective: "lifestyle" },
  investment_opportunity: { format: "feed_single", objective: "investment" },
  location_spotlight: { format: "feed_single", objective: "location" },
  feature_highlight: { format: "feed_single", objective: "amenities_features" },
  architecture_highlight: { format: "feed_single", objective: "architecture" },
  construction_update: { format: "feed_single", objective: "construction_update" },
  inventory_roundup: { format: "carousel", objective: "availability" },
  property_comparison: { format: "carousel", objective: "property_spotlight" },
})

const FORMAT_TO_STORAGE_TYPE: Readonly<Record<MarketingFormat, MarketingContentType>> = Object.freeze({
  feed_single: "single_image",
  carousel: "carousel",
  story: "story",
  reel: "reel",
})

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

export function legacyContractForContentType(contentType: MarketingContentType) {
  const contract = LEGACY_CONTENT_TYPE_CONTRACT[contentType]
  if (!contract) throw new Error(`Unsupported Marketing content type: ${String(contentType)}.`)
  return contract
}

export function storageContentTypeForFormat(format: MarketingFormat) {
  const contentType = FORMAT_TO_STORAGE_TYPE[format]
  if (!contentType) throw new Error(`Unsupported Marketing delivery format: ${String(format)}.`)
  return contentType
}

export function brandTreatmentForFormat(format: MarketingFormat): MarketingBrandTreatment {
  // M2 defaults all formats off; retaining the format argument keeps the
  // treatment factory ready for later format-specific deterministic controls.
  void format
  return {
    version: "v1",
    logo: {
      enabled: false,
      assetId: null,
      placement: "none",
      scale: "small",
      opacity: 0.8,
    },
  }
}

export function defaultMarketingContract(input: {
  format: MarketingFormat
  objective: MarketingObjective
  assetIds?: string[]
  selectionMode?: MarketingMediaSelection["mode"]
  creativeDirection?: CreativeDirection | string
  brandTreatment?: MarketingBrandTreatment
}): MarketingContentContract {
  // M2 establishes Luxury Editorial as the default structured policy. Older
  // creative-direction values remain readable but do not create new policy
  // branches in this contract.
  const creativeDirection = input.creativeDirection === "luxury_editorial"
    ? "luxury_editorial"
    : "luxury_editorial"
  return {
    version: "v2",
    format: input.format,
    objective: input.objective,
    creativeDirection,
    mediaSelection: {
      mode: input.selectionMode ?? "automatic",
      assetIds: [...new Set(input.assetIds ?? [])],
    },
    brandTreatment: input.brandTreatment ?? brandTreatmentForFormat(input.format),
  }
}

/**
 * Reads an explicit V2 contract when present. Historic records map through a
 * finite table above; unknown values fail rather than silently rendering as
 * Feed content.
 */
export function resolveMarketingContract(input: {
  contentType: MarketingContentType
  composition?: unknown
}): MarketingContentContract {
  const raw = object(object(input.composition).marketingContract)
  const format = raw.format
  const objective = raw.objective
  if (raw.version === "v2" && typeof format === "string" && typeof objective === "string") {
    if (!Object.hasOwn(FORMAT_TO_STORAGE_TYPE, format)) throw new Error(`Unsupported Marketing delivery format: ${format}.`)
    const allowedObjectives: readonly string[] = [
      "new_listing", "property_spotlight", "architecture", "interiors", "amenities_features", "lifestyle", "location", "investment", "price_update", "availability", "construction_update", "open_house", "recently_sold", "brand_editorial",
    ]
    if (!allowedObjectives.includes(objective)) throw new Error(`Unsupported Marketing objective: ${objective}.`)
    const selection = object(raw.mediaSelection)
    const treatment = object(raw.brandTreatment)
    const logo = object(treatment.logo)
    return defaultMarketingContract({
      format: format as MarketingFormat,
      objective: objective as MarketingObjective,
      assetIds: Array.isArray(selection.assetIds) ? selection.assetIds.filter((id): id is string => typeof id === "string") : [],
      selectionMode: selection.mode === "curated" ? "curated" : "automatic",
      creativeDirection: raw.creativeDirection as CreativeDirection | string,
      brandTreatment: treatment.version === "v1" ? {
        version: "v1",
        logo: {
          enabled: Boolean(logo.enabled),
          assetId: typeof logo.assetId === "string" ? logo.assetId : null,
          placement: ["none", "top_left", "top_right", "bottom_left", "bottom_right", "end_card_only"].includes(String(logo.placement))
            ? logo.placement as MarketingBrandTreatment["logo"]["placement"]
            : "none",
          scale: ["small", "medium", "large"].includes(String(logo.scale))
            ? logo.scale as MarketingBrandTreatment["logo"]["scale"]
            : "small",
          opacity: typeof logo.opacity === "number" && logo.opacity >= 0.1 && logo.opacity <= 1 ? logo.opacity : 0.8,
        },
      } : undefined,
    })
  }
  const legacy = legacyContractForContentType(input.contentType)
  const legacySelection = object(input.composition).selectedAssetIds
  const assetIds = Array.isArray(legacySelection)
    ? legacySelection.filter((id): id is string => typeof id === "string")
    : []
  return defaultMarketingContract({
    ...legacy,
    assetIds,
    selectionMode: assetIds.length ? "curated" : "automatic",
  })
}

export function withMarketingContract(composition: unknown, contract: MarketingContentContract) {
  return { ...object(composition), marketingContract: contract }
}
