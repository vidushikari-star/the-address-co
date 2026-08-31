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

export const FACTUAL_VALIDATION_REASON_CODES = [
  "missing_claim_provenance",
  "unavailable_fact_reference",
  "ungrounded_claim_value",
  "claim_text_not_found",
  "unsupported_numeric_claim",
] as const

export type FactualValidationReasonCode = (typeof FACTUAL_VALIDATION_REASON_CODES)[number]

const FACTUAL_VALIDATION_DIAGNOSTIC = Symbol.for("the-address-co.marketing.factual-validation-diagnostic")

type FactualDiagnosticError = Error & {
  [FACTUAL_VALIDATION_DIAGNOSTIC]?: true
  reasonCode?: unknown
  ruleId?: unknown
  field?: unknown
  factCategory?: unknown
  violationCount?: unknown
}

/**
 * The factual contract deliberately exposes only metadata that is safe for
 * server diagnostics. Never attach generated copy or property values here.
 */
export class FactualValidationError extends Error {
  readonly reasonCode: FactualValidationReasonCode
  readonly ruleId: string
  readonly field: string | null
  readonly factCategory: MarketingSafeFactKey | "area" | null
  readonly violationCount: number

  constructor(input: {
    message: string
    reasonCode: FactualValidationReasonCode
    ruleId: string
    field?: string | null
    factCategory?: MarketingSafeFactKey | "area" | null
    violationCount?: number
  }) {
    super(input.message)
    this.name = "FactualValidationError"
    this.reasonCode = input.reasonCode
    this.ruleId = input.ruleId
    this.field = input.field ?? null
    this.factCategory = input.factCategory ?? null
    this.violationCount = input.violationCount ?? 1
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

  return {
    reasonCode: typeof diagnostic.reasonCode === "string" ? diagnostic.reasonCode : null,
    ruleId: typeof diagnostic.ruleId === "string" ? diagnostic.ruleId : null,
    field: typeof diagnostic.field === "string" ? diagnostic.field : null,
    factCategory: typeof diagnostic.factCategory === "string" ? diagnostic.factCategory : null,
    violationCount: typeof diagnostic.violationCount === "number" ? diagnostic.violationCount : null,
  }
}

function normalize(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase()
}

/**
 * Claim provenance asks the provider for a quote, but harmless punctuation,
 * whitespace, hyphen, and digit-word presentation differences must not turn
 * an otherwise grounded claim into a false failure. This is deliberately not
 * semantic matching: the same normalized phrase must still be visible.
 */
function normalizeClaimText(value: unknown) {
  return normalize(value)
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[’'`]/g, "")
    .replace(/[–—-]/g, " ")
    .replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/gu, word => ({
      one: "1", two: "2", three: "3", four: "4", five: "5",
      six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
    })[word] ?? word)
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
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
  for (const [index, key] of input.factsUsed.entries()) {
    if (!factValues(input.property, key).length) {
      throw new FactualValidationError({
        message: `Generated copy references unavailable inventory fact: ${key}.`,
        reasonCode: "unavailable_fact_reference",
        ruleId: "facts_used_available",
        field: `factsUsed[${index}]`,
        factCategory: key,
      })
    }
  }
  const normalizedCopy = normalizeClaimText(input.copy)
  for (const [index, claim] of input.claims.entries()) {
    const allowed = factValues(input.property, claim.factKey)
    const factValue = normalize(claim.factValue)
    // A long description may be compacted before it reaches the model. An
    // exact source excerpt remains grounded while avoiding provenance that
    // repeats an entire internal description or generated caption.
    if (!allowed.length || !allowed.some(value => value === factValue || value.includes(factValue))) {
      throw new FactualValidationError({
        message: `Generated claim is not grounded in the property snapshot: ${claim.factKey}.`,
        reasonCode: "ungrounded_claim_value",
        ruleId: "claim_fact_value_grounded",
        field: `claimProvenance[${index}].factValue`,
        factCategory: claim.factKey,
      })
    }
    if (!normalizedCopy.includes(normalizeClaimText(claim.text))) {
      throw new FactualValidationError({
        message: "Generated claim provenance does not match the generated copy.",
        reasonCode: "claim_text_not_found",
        ruleId: "claim_text_visible_in_copy",
        field: `claimProvenance[${index}].text`,
        factCategory: claim.factKey,
      })
    }
  }
  return true
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
