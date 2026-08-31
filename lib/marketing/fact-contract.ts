import type { MarketingFormat, PropertyFactSnapshot } from "@/lib/marketing/types"

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

/**
 * Marketing source data is intentionally classified before it reaches the
 * factual validator. Source text is approved editorial context, but is not a
 * scalar fact that a provider can truthfully restate through factValue.
 */
export type GroundingSource = "scalar" | "enum" | "collection" | "source_text"

export const MARKETING_FACT_GROUNDING_SOURCES = {
  title: "scalar",
  location: "scalar",
  locality: "scalar",
  price: "scalar",
  bedrooms: "scalar",
  bathrooms: "scalar",
  carpet_area: "scalar",
  built_up_area: "scalar",
  plot_area: "scalar",
  description: "source_text",
  amenities: "collection",
  features: "collection",
  property_type: "enum",
  listing_type: "enum",
  transaction_type: "enum",
  furnishing: "enum",
  development_stage: "enum",
  status: "enum",
  developer: "scalar",
} as const satisfies Record<MarketingSafeFactKey, GroundingSource>

/** New provider provenance may point only to deterministic canonical facts. */
export type MarketingProvenanceFactKey = Exclude<MarketingSafeFactKey, "description">
export const MARKETING_PROVENANCE_FACT_KEYS = MARKETING_SAFE_FACT_KEYS.filter(
  (key): key is MarketingProvenanceFactKey => MARKETING_FACT_GROUNDING_SOURCES[key] !== "source_text",
)

export function marketingFactGroundingSource(key: MarketingSafeFactKey): GroundingSource {
  return MARKETING_FACT_GROUNDING_SOURCES[key]
}

export function isMarketingSafeFactKey(key: string): key is MarketingSafeFactKey {
  return (MARKETING_SAFE_FACT_KEYS as readonly string[]).includes(key)
}

/**
 * Description provenance remains parseable for historic creative records, but
 * only canonical sources may be requested or deterministically validated now.
 */
export function isCanonicalProvenanceFactKey(key: MarketingSafeFactKey): key is MarketingProvenanceFactKey {
  return marketingFactGroundingSource(key) !== "source_text"
}

export type ClaimProvenance = {
  /** Optional legacy audit note; source-text keys remain readable but are not revalidated. */
  text?: string
  factKey: MarketingSafeFactKey
  factValue: string
}

export const FACTUAL_VALIDATION_REASON_CODES = [
  "missing_claim_provenance",
  "unavailable_fact_reference",
  "ungrounded_claim_value",
  "unsupported_numeric_claim",
  "unsupported_objective_claim",
  "unsupported_derived_claim",
] as const

export type FactualValidationReasonCode = (typeof FACTUAL_VALIDATION_REASON_CODES)[number]
export type FactualFactCategory = MarketingSafeFactKey | "area" | "distance" | "investment" | "view" | "availability"
type AmenityMatchMode = "canonical_exact" | "normalized_exact" | "alias" | "no_match"

export type FactualValidationWarningCode =
  | "missing_claim_provenance"
  | "unavailable_fact_reference"
  | "ungrounded_claim_value"
  | "unknown_provenance_fact_reference"

export type FactualValidationWarning = {
  warningCode: FactualValidationWarningCode
  ruleId: string
  field: string | null
  factCategory: FactualFactCategory | null
  violationCount: number
}

export type MarketingFactualValidationResult = {
  hardViolations: FactualValidationError[]
  warnings: FactualValidationWarning[]
}

const FACTUAL_VALIDATION_DIAGNOSTIC = Symbol.for("the-address-co.marketing.factual-validation-diagnostic")

type FactualDiagnosticError = Error & {
  [FACTUAL_VALIDATION_DIAGNOSTIC]?: true
  reasonCode?: unknown
  ruleId?: unknown
  field?: unknown
  factCategory?: unknown
  violationCount?: unknown
  matchMode?: unknown
  snapshotAmenityCount?: unknown
  amenitySources?: unknown
}

/**
 * The factual contract deliberately exposes only metadata that is safe for
 * server diagnostics. Never attach generated copy or property values here.
 */
export class FactualValidationError extends Error {
  readonly reasonCode: FactualValidationReasonCode
  readonly ruleId: string
  readonly field: string | null
  readonly factCategory: FactualFactCategory | null
  readonly violationCount: number
  /** Amenity-only, metadata-safe comparison diagnostics. */
  readonly matchMode: AmenityMatchMode | null
  readonly snapshotAmenityCount: number | null
  readonly amenitySources: Array<"amenities" | "features"> | null

  constructor(input: {
    message: string
    reasonCode: FactualValidationReasonCode
    ruleId: string
    field?: string | null
    factCategory?: FactualFactCategory | null
    violationCount?: number
    matchMode?: AmenityMatchMode | null
    snapshotAmenityCount?: number | null
    amenitySources?: Array<"amenities" | "features"> | null
  }) {
    super(input.message)
    this.name = "FactualValidationError"
    this.reasonCode = input.reasonCode
    this.ruleId = input.ruleId
    this.field = input.field ?? null
    this.factCategory = input.factCategory ?? null
    this.violationCount = input.violationCount ?? 1
    this.matchMode = input.matchMode ?? null
    this.snapshotAmenityCount = input.snapshotAmenityCount ?? null
    this.amenitySources = input.amenitySources ?? null
    Object.defineProperty(this, FACTUAL_VALIDATION_DIAGNOSTIC, {
      configurable: true,
      enumerable: false,
      value: true,
    })
  }
}

/** Metadata-only diagnostics; copy and inventory values never leave the validator. */
export function factualValidationErrorDiagnostics(error: unknown) {
  const diagnostic = error && typeof error === "object" ? error as FactualDiagnosticError : null
  if (!diagnostic?.[FACTUAL_VALIDATION_DIAGNOSTIC]) {
    return {
      reasonCode: null,
      ruleId: null,
      field: null,
      factCategory: null,
      violationCount: null,
    }
  }

  const base = {
    reasonCode: typeof diagnostic.reasonCode === "string" ? diagnostic.reasonCode : null,
    ruleId: typeof diagnostic.ruleId === "string" ? diagnostic.ruleId : null,
    field: typeof diagnostic.field === "string" ? diagnostic.field : null,
    factCategory: typeof diagnostic.factCategory === "string" ? diagnostic.factCategory : null,
    violationCount: typeof diagnostic.violationCount === "number" ? diagnostic.violationCount : null,
  }
  const matchMode = diagnostic.matchMode
  const snapshotAmenityCount = diagnostic.snapshotAmenityCount
  const amenitySources = diagnostic.amenitySources
  if (
    typeof matchMode !== "string" ||
    typeof snapshotAmenityCount !== "number" ||
    !Array.isArray(amenitySources) ||
    !amenitySources.every(source => source === "amenities" || source === "features")
  ) return base

  return {
    ...base,
    matchMode,
    snapshotAmenityCount,
    amenitySources,
  }
}

/** Allows the route to return a user-safe error without exposing validator internals. */
export function isFactualValidationError(error: unknown) {
  return Boolean(error && typeof error === "object" && (error as FactualDiagnosticError)[FACTUAL_VALIDATION_DIAGNOSTIC])
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

/**
 * Property amenities are free-form strings in the CRM, not a database enum.
 * This creates a stable key without broad semantic matching: punctuation,
 * casing, separators, a few app-recognized aliases, and nothing else.
 */
const AMENITY_ALIASES: Readonly<Record<string, string>> = {
  private_swimming_pool: "private_pool",
  private_pool: "private_pool",
  private_pools: "private_pool",
  swimming_pool: "pool",
  swimming_pools: "pool",
  pools: "pool",
  air_conditioner: "air_conditioning",
  ac: "air_conditioning",
  staff_quarter: "staff_quarters",
  gardens: "garden",
}

const WEAKER_AMENITY_CLAIM_SOURCES: Readonly<Record<string, readonly string[]>> = {
  pool: ["private_pool"],
  garden: ["private_garden"],
  parking: ["covered_parking", "open_parking"],
  security: ["24_7_security"],
}

function normalizeObjectiveText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Exposed for tests and prompt construction; it never turns a broad substring into an amenity. */
export function canonicalizeAmenity(value: unknown) {
  const normalized = normalizeObjectiveText(String(value ?? ""))
  if (!normalized) return ""
  const key = normalized.replaceAll(" ", "_")
  return AMENITY_ALIASES[key] ?? key
}

function canonicalizeStructuredFactValue(key: MarketingSafeFactKey, value: unknown) {
  if (!isCanonicalProvenanceFactKey(key)) return ""
  if (marketingFactGroundingSource(key) === "collection") return canonicalizeAmenity(value)
  if (["location", "locality", "furnishing", "property_type", "listing_type", "transaction_type", "development_stage", "status"].includes(key)) {
    return normalizeObjectiveText(String(value ?? ""))
  }
  return normalize(value)
}

type GroundingValue = {
  value: string
  source: "amenities" | "features" | null
}

/** Amenities and tags are both persisted, structured property feature sources. */
function groundingValues(property: PropertyFactSnapshot, key: MarketingProvenanceFactKey): GroundingValue[] {
  if (key === "amenities" || key === "features") {
    return [
      ...factValues(property, "amenities").map(value => ({ value, source: "amenities" as const })),
      ...factValues(property, "features").map(value => ({ value, source: "features" as const })),
    ]
  }
  return factValues(property, key).map(value => ({ value, source: null }))
}

function phraseContains(source: string, candidate: string) {
  return ` ${source} `.includes(` ${candidate} `)
}

function amenityMatch(source: string, candidate: string): AmenityMatchMode | null {
  const sourceCanonical = canonicalizeAmenity(source)
  const candidateCanonical = canonicalizeAmenity(candidate)
  if (!sourceCanonical || !candidateCanonical) return null
  if (sourceCanonical === candidateCanonical) {
    return normalize(source) === normalize(candidate) ? "canonical_exact" : "alias"
  }
  return WEAKER_AMENITY_CLAIM_SOURCES[candidateCanonical]?.includes(sourceCanonical) ? "alias" : null
}

function groundingMatch(key: MarketingProvenanceFactKey, source: string, candidate: string): AmenityMatchMode | null {
  if (key === "amenities" || key === "features") return amenityMatch(source, candidate)

  const sourceCanonical = canonicalizeStructuredFactValue(key, source)
  const candidateCanonical = canonicalizeStructuredFactValue(key, candidate)
  if (!sourceCanonical || !candidateCanonical) return null
  if (sourceCanonical === candidateCanonical) {
    return normalize(source) === normalize(candidate) ? "canonical_exact" : "normalized_exact"
  }
  // Location labels may use a complete canonical token phrase, never an
  // arbitrary substring fragment. Free-text descriptions are not provenance.
  if (["location", "locality"].includes(key) && phraseContains(sourceCanonical, candidateCanonical)) {
    return "normalized_exact"
  }
  return null
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
        .map(item => key === "amenities" || key === "features" ? canonicalizeAmenity(item) : compact(item, 80))
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
    const valueForPrompt = ["furnishing", "property_type", "listing_type", "transaction_type", "development_stage", "status"].includes(key)
      ? canonicalizeStructuredFactValue(key, value)
      : compact(value, maximum)
    if (valueForPrompt) compacted[key] = valueForPrompt
  }

  return compacted
}

export function factValues(property: PropertyFactSnapshot, key: MarketingSafeFactKey) {
  return stringValues(marketingSafeFacts(property)[key])
}

/**
 * Provenance is audit metadata, never the decision boundary for generated
 * copy. These warnings deliberately contain no generated or source values.
 */
export function validateClaimProvenance(input: {
  property: PropertyFactSnapshot
  claims: ReadonlyArray<{ factKey: string; factValue: unknown; text?: unknown }>
  factsUsed: readonly string[]
  /** Compatibility-only audit input; intentionally not a validation gate. */
  copy?: string
}) {
  const warnings: FactualValidationWarning[] = []
  for (const [index, key] of input.factsUsed.entries()) {
    if (!isMarketingSafeFactKey(key)) {
      warnings.push({
        warningCode: "unknown_provenance_fact_reference",
        ruleId: "facts_used_key_known",
        field: `factsUsed[${index}]`,
        factCategory: null,
        violationCount: 1,
      })
      continue
    }
    // Historic source-text provenance remains readable audit history.
    if (!isCanonicalProvenanceFactKey(key)) continue
    if (!groundingValues(input.property, key).length) {
      warnings.push({
        warningCode: "unavailable_fact_reference",
        ruleId: "facts_used_available",
        field: `factsUsed[${index}]`,
        factCategory: key,
        violationCount: 1,
      })
    }
  }
  for (const [index, claim] of input.claims.entries()) {
    const factKey = claim.factKey
    if (!isMarketingSafeFactKey(factKey)) {
      warnings.push({
        warningCode: "unknown_provenance_fact_reference",
        ruleId: "claim_provenance_key_known",
        field: `claimProvenance[${index}].factKey`,
        factCategory: null,
        violationCount: 1,
      })
      continue
    }
    if (!isCanonicalProvenanceFactKey(factKey)) continue
    const allowed = groundingValues(input.property, factKey)
    const factValue = String(claim.factValue ?? "")
    if (!allowed.length || !allowed.some(value => groundingMatch(factKey, value.value, factValue))) {
      warnings.push({
        warningCode: "ungrounded_claim_value",
        ruleId: "claim_fact_value_grounded",
        field: `claimProvenance[${index}].factValue`,
        factCategory: factKey,
        violationCount: 1,
      })
    }
  }
  return warnings
}

type NumericFactCategory = "price" | "bedrooms" | "bathrooms" | "area"

type UnsupportedNumericClaim = {
  factCategory: NumericFactCategory
}

function numericValue(value: string) {
  const parsed = Number(value.replaceAll(",", ""))
  return Number.isFinite(parsed) ? parsed : null
}

function priceValues(property: PropertyFactSnapshot) {
  const values = new Set<number>()
  for (const source of factValues(property, "price")) {
    for (const match of source.matchAll(/\d[\d,.]*(?:\s*(cr|crore|lakh))?/gi)) {
      const numeric = match[0].match(/\d[\d,.]*/)?.[0]
      const value = numeric ? numericValue(numeric) : null
      if (value === null) continue
      const unit = match[1]?.toLocaleLowerCase()
      values.add(Math.round(value * (unit === "cr" || unit === "crore" ? 10_000_000 : unit === "lakh" ? 100_000 : 1)))
    }
  }
  return values
}

function numericFactValues(property: PropertyFactSnapshot, key: "bedrooms" | "bathrooms" | "carpet_area" | "built_up_area" | "plot_area") {
  const values = new Set<number>()
  for (const source of factValues(property, key)) {
    for (const value of source.matchAll(/\d[\d,.]*/g)) {
      const parsed = numericValue(value[0])
      if (parsed !== null) values.add(parsed)
    }
  }
  return values
}

function valueIsAllowed(value: string, permitted: Set<number>, unit?: string) {
  const parsed = numericValue(value)
  if (parsed === null) return false
  const normalizedUnit = unit?.toLocaleLowerCase()
  const multiplier = normalizedUnit === "cr" || normalizedUnit === "crore" ? 10_000_000 : normalizedUnit === "lakh" ? 100_000 : 1
  return permitted.has(Math.round(parsed * multiplier))
}

/**
 * Detect only explicit inventory-shaped numeric claims. The former generic
 * digit scan rejected fact-grounded names, editorial ordinals, and hashtags
 * (for example, "Villa 18") as though they were prices or room counts.
 */
function unsupportedNumericClaim(copy: string, property: PropertyFactSnapshot): UnsupportedNumericClaim | null {
  const checks: Array<{
    factCategory: NumericFactCategory
    pattern: RegExp
    permitted: Set<number>
    unit?: (match: RegExpMatchArray) => string | undefined
  }> = [
    {
      factCategory: "price",
      pattern: /(?:₹|rs\.?|inr)\s*(\d[\d,.]*)(?:\s*(cr|crore|lakh))?|\b(\d[\d,.]*)\s*(cr|crore|lakh)\b/gi,
      permitted: priceValues(property),
      unit: match => match[2] ?? match[4],
    },
    {
      factCategory: "bedrooms",
      pattern: /\b(\d[\d,.]*)\s*[-\s]?(?:bed(?:room)?s?|bhk)\b/gi,
      permitted: numericFactValues(property, "bedrooms"),
    },
    {
      factCategory: "bathrooms",
      pattern: /\b(\d[\d,.]*)\s*[-\s]?(?:bath(?:room)?s?)\b/gi,
      permitted: numericFactValues(property, "bathrooms"),
    },
    {
      factCategory: "area",
      pattern: /\b(\d[\d,.]*)\s*(?:sq\.?\s*(?:ft|m)|sqm|sq\.?\s*met(?:er|re)s?|square\s*(?:feet|foot|met(?:er|re)s?))\b/gi,
      permitted: new Set([
        ...numericFactValues(property, "carpet_area"),
        ...numericFactValues(property, "built_up_area"),
        ...numericFactValues(property, "plot_area"),
      ]),
    },
  ]

  for (const check of checks) {
    for (const match of copy.matchAll(check.pattern)) {
      const value = match[1] ?? match[3]
      if (!valueIsAllowed(value, check.permitted, check.unit?.(match))) {
        return { factCategory: check.factCategory }
      }
    }
  }
  return null
}

/** Detects explicit unsupported numeric assertions before a human review. */
export function detectUnsupportedNumericClaim(copy: string, property: PropertyFactSnapshot) {
  const unsupported = unsupportedNumericClaim(copy, property)
  return unsupported ? "Generated copy contains an unsupported numeric claim." : null
}

/** Throws a structured factual error for the generation route’s safe logs. */
export function assertSupportedNumericClaims(copy: string, property: PropertyFactSnapshot, field = "copy") {
  const unsupported = unsupportedNumericClaim(copy, property)
  if (!unsupported) return true
  throw new FactualValidationError({
    message: "Generated copy contains an unsupported numeric claim.",
    reasonCode: "unsupported_numeric_claim",
    ruleId: "explicit_numeric_claim_grounded",
    field,
    factCategory: unsupported.factCategory,
  })
}

export type MarketingRenderedCopy = {
  field: string
  value: string
}

type MarketingCopyCandidate = {
  headline?: unknown
  hook?: unknown
  caption?: unknown
  shortCaption?: unknown
  cta?: unknown
  altText?: unknown
  coverText?: unknown
  onScreenText?: unknown
  carouselSlides?: unknown
  storyCopy?: unknown
}

function textField(field: string, value: unknown): MarketingRenderedCopy | null {
  return typeof value === "string" ? { field, value } : null
}

function textFields(prefix: string, value: unknown) {
  return Array.isArray(value)
    ? value.flatMap((item, index) => textField(`${prefix}[${index}]`, item) ?? [])
    : []
}

function storyFields(value: unknown) {
  const story = value && typeof value === "object" ? value as Record<string, unknown> : {}
  return [
    textField("storyCopy.headline", story.headline),
    textField("storyCopy.supportingLine", story.supportingLine),
    ...textFields("storyCopy.highlights", story.highlights),
    textField("storyCopy.priceLine", story.priceLine),
    textField("storyCopy.cta", story.cta),
  ].filter((field): field is MarketingRenderedCopy => Boolean(field))
}

/**
 * The factual boundary receives only copy that the selected delivery format
 * actually renders or exposes. Historic compatibility projections are never
 * treated as another format’s generated claim surface.
 */
export function marketingRenderedCopyForFormat(format: MarketingFormat, output: MarketingCopyCandidate): MarketingRenderedCopy[] {
  switch (format) {
    case "feed_single":
      return [
        textField("headline", output.headline),
        textField("caption", output.caption),
        textField("cta", output.cta),
      ].filter((field): field is MarketingRenderedCopy => Boolean(field))
    case "carousel":
      return [
        textField("caption", output.caption),
        ...textFields("carouselSlides", output.carouselSlides),
      ].filter((field): field is MarketingRenderedCopy => Boolean(field))
    case "story":
      return storyFields(output.storyCopy)
    case "reel":
      return [
        textField("hook", output.hook),
        textField("caption", output.caption),
        ...textFields("onScreenText", output.onScreenText),
      ].filter((field): field is MarketingRenderedCopy => Boolean(field))
  }
}

function sourceContainsWords(property: PropertyFactSnapshot, keys: MarketingSafeFactKey[], words: string[]) {
  const meaningful = words.filter(Boolean)
  return factValuesForKeys(property, keys).some(source => {
    const normalized = normalizeObjectiveText(source)
    return meaningful.every(word => normalized.includes(normalizeObjectiveText(word)))
  })
}

function factValuesForKeys(property: PropertyFactSnapshot, keys: MarketingSafeFactKey[]) {
  return keys.flatMap(key => factValues(property, key))
}

type ObjectiveRule = {
  ruleId: string
  factCategory: FactualFactCategory
  pattern: RegExp
  factKeys: MarketingSafeFactKey[]
  requiredWords: (match: RegExpMatchArray) => string[]
}

/**
 * These are deliberately narrow, objective-property patterns. They do not
 * classify normal luxury/editorial language as factual and do not perform
 * semantic guessing. More complex factual statements remain represented by
 * the canonical factKey/factValue references above.
 */
const OBJECTIVE_CLAIM_RULES: readonly ObjectiveRule[] = [
  {
    ruleId: "explicit_pool_claim_grounded",
    factCategory: "amenities",
    pattern: /\b(?:(private)\s+)?(?:(swimming)\s+)?pool\b/gi,
    factKeys: ["amenities", "features"],
    requiredWords: match => [match[1] ?? "", "pool"],
  },
  {
    ruleId: "explicit_furnishing_claim_grounded",
    factCategory: "furnishing",
    pattern: /\b(fully furnished|semi[-\s]?furnished|unfurnished)\b/gi,
    factKeys: ["furnishing", "features"],
    requiredWords: match => [match[1]],
  },
  {
    ruleId: "explicit_view_claim_grounded",
    factCategory: "view",
    pattern: /\b(sea|ocean|beach|river|mountain|garden)\s+views?\b/gi,
    factKeys: ["amenities", "features"],
    requiredWords: match => [match[1], "view"],
  },
  {
    ruleId: "explicit_property_type_claim_grounded",
    factCategory: "property_type",
    pattern: /\b(villa|apartment|penthouse|bungalow|plot|land)\b/gi,
    factKeys: ["property_type", "title"],
    requiredWords: match => [match[1]],
  },
  {
    ruleId: "explicit_location_claim_grounded",
    factCategory: "location",
    // Keep this intentionally grammatical and case-sensitive. A generic
    // case-insensitive `at <Proper Noun>` rule mistakes titles (for example,
    // "at Villa Verde") for locations, while a case-insensitive continuation
    // consumes ordinary sentence words after a real location.
    pattern: /\b(?:in|[Ll]ocated in)\s+([A-Z][\p{L}]*(?:[ -][A-Z][\p{L}]*){0,2})\b/gu,
    factKeys: ["location", "locality"],
    requiredWords: match => [match[1]],
  },
  {
    ruleId: "explicit_availability_claim_grounded",
    factCategory: "availability",
    pattern: /\b(ready to move|move[-\s]?in ready|immediate possession|available now)\b/gi,
    factKeys: ["development_stage", "status"],
    requiredWords: match => [match[1]],
  },
]

function assertSupportedObjectiveClaims(copy: string, property: PropertyFactSnapshot, field: string) {
  for (const rule of OBJECTIVE_CLAIM_RULES) {
    // Objective rules are shared across fields and requests. Clone the global
    // expression for each field so a previous `matchAll` cannot carry its
    // `lastIndex` into the next rendered value.
    const expression = new RegExp(rule.pattern.source, rule.pattern.flags)
    for (const match of copy.matchAll(expression)) {
      if (sourceContainsWords(property, rule.factKeys, rule.requiredWords(match))) continue
      throw new FactualValidationError({
        message: "Generated copy contains an unsupported objective property claim.",
        reasonCode: "unsupported_objective_claim",
        ruleId: rule.ruleId,
        field,
        factCategory: rule.factCategory,
      })
    }
  }
}

const UNSUPPORTED_DERIVED_CLAIM_RULES: ReadonlyArray<{
  ruleId: string
  factCategory: "distance" | "investment"
  pattern: RegExp
}> = [
  {
    ruleId: "unsupported_distance_or_travel_time_claim",
    factCategory: "distance",
    pattern: /\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:minutes?|mins?|km|kilomet(?:er|re)s?)\s+(?:from|to|walk|drive)\b|\bwalking distance\s+(?:from|to)\b/i,
  },
  {
    ruleId: "unsupported_investment_or_yield_claim",
    factCategory: "investment",
    pattern: /\b(?:high|strong|excellent|guaranteed|assured)\s+(?:(?:rental\s+)?yields?|returns?|appreciation|investment\s+performance)\b|\b(?:guaranteed|assured)\s+(?:investment\s+)?(?:returns?|appreciation|performance)\b|\b\d+(?:\.\d+)?\s*%\s*(?:annual\s+)?(?:(?:rental\s+)?yields?|returns?|appreciation)\b|\b(?:ideal\s+for\s+investment|excellent\s+investment)\b/i,
  },
]

function assertNoUnsupportedDerivedClaims(copy: string, field: string) {
  for (const rule of UNSUPPORTED_DERIVED_CLAIM_RULES) {
    if (!rule.pattern.test(copy)) continue
    throw new FactualValidationError({
      message: "Generated copy contains an unsupported derived property claim.",
      reasonCode: "unsupported_derived_claim",
      ruleId: rule.ruleId,
      field,
      factCategory: rule.factCategory,
    })
  }
}

/**
 * Assesses only rendered Marketing copy. Provenance is retained as safe audit
 * metadata and cannot make normal creative generation fail.
 */
export function assessMarketingFacts(input: {
  format: MarketingFormat
  renderedCopy: MarketingRenderedCopy[]
  propertySnapshot: PropertyFactSnapshot
  factsUsed: readonly string[]
  provenance: ReadonlyArray<{ factKey: string; factValue: unknown }>
}): MarketingFactualValidationResult {
  const warnings = validateClaimProvenance({
    property: input.propertySnapshot,
    factsUsed: input.factsUsed,
    claims: input.provenance,
  })
  const canonicalFactsUsed = input.factsUsed.filter((key): key is MarketingProvenanceFactKey =>
    isMarketingSafeFactKey(key) && isCanonicalProvenanceFactKey(key)
  )
  const canonicalProvenance = input.provenance.filter(claim =>
    isMarketingSafeFactKey(claim.factKey) && isCanonicalProvenanceFactKey(claim.factKey)
  )
  if (canonicalFactsUsed.length && !canonicalProvenance.length) {
    warnings.push({
      warningCode: "missing_claim_provenance",
      ruleId: "canonical_provenance_required_for_facts_used",
      field: "claimProvenance",
      factCategory: null,
      violationCount: canonicalFactsUsed.length,
    })
  }
  const hardViolations: FactualValidationError[] = []
  for (const rendered of input.renderedCopy) {
    for (const check of [
      () => assertSupportedNumericClaims(rendered.value, input.propertySnapshot, rendered.field),
      () => assertSupportedObjectiveClaims(rendered.value, input.propertySnapshot, rendered.field),
      () => assertNoUnsupportedDerivedClaims(rendered.value, rendered.field),
    ]) {
      try {
        check()
      } catch (error) {
        if (error instanceof FactualValidationError) hardViolations.push(error)
        else throw error
      }
    }
  }
  return { hardViolations, warnings }
}

/** Throws only when rendered output contains a clear factual contradiction. */
export function validateMarketingFacts(input: Parameters<typeof assessMarketingFacts>[0]) {
  const result = assessMarketingFacts(input)
  if (result.hardViolations.length) throw result.hardViolations[0]
  return result
}

/** Logs grouped audit warnings without generated copy or property values. */
export function logMarketingFactualWarnings(format: MarketingFormat, result: MarketingFactualValidationResult) {
  const grouped = new Map<string, FactualValidationWarning>()
  for (const warning of result.warnings) {
    const key = `${warning.warningCode}:${warning.factCategory ?? "none"}`
    const existing = grouped.get(key)
    if (existing) existing.violationCount += warning.violationCount
    else grouped.set(key, { ...warning })
  }
  for (const warning of grouped.values()) {
    console.info("Marketing factual warning:", JSON.stringify({
      format,
      warningCode: warning.warningCode,
      category: warning.factCategory,
      count: warning.violationCount,
    }))
  }
}
