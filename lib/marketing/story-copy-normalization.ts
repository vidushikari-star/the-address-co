import { STORY_COPY_SCHEMA_LIMITS, StoryCopySchema } from "@/lib/marketing/schemas"
import { fitStoryCopy } from "@/lib/marketing/story-layout"
import type { MarketingObjective, StoryCopy } from "@/lib/marketing/types"

type StoryVisualField = "headline" | "supportingLine" | "highlights" | "priceLine" | "cta"

export type StoryCopyNormalizationDiagnostic = {
  field: StoryVisualField | `highlights[${number}]`
  originalCharacters: number
  finalCharacters: number
}

export type StoryCopyNormalization = {
  storyCopy: StoryCopy
  fits: boolean
  diagnostics: StoryCopyNormalizationDiagnostic[]
}

function tidy(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function cleanEnding(value: string) {
  return value
    .replace(/[\s,;:/\-–—]+$/u, "")
    .replace(/[([{]\s*$/u, "")
    .trim()
}

/** Keeps complete words and favors the leading useful phrase. */
function shortenAtWordBoundary(value: string, maximum: number, fallback: string) {
  const source = tidy(value)
  if (source.length <= maximum) return source

  let candidate = source.slice(0, maximum + 1).replace(/\s+\S*$/u, "")
  candidate = cleanEnding(candidate)
  return candidate || fallback
}

/** A supporting line may retain a complete first sentence or clause. */
function shortenSupportingLine(value: string) {
  const source = tidy(value)
  if (source.length <= STORY_COPY_SCHEMA_LIMITS.supportingLine) return source

  const boundaries = [...source.matchAll(/[.!?;,]/gu)]
    .map(match => match.index === undefined ? "" : cleanEnding(source.slice(0, match.index + 1)))
    .filter(candidate => candidate.length > 0 && candidate.length <= STORY_COPY_SCHEMA_LIMITS.supportingLine)
  return boundaries.at(-1) || shortenAtWordBoundary(source, STORY_COPY_SCHEMA_LIMITS.supportingLine, "")
}

function objectiveFallbackCta(objective: MarketingObjective) {
  switch (objective) {
    case "open_house": return "Book a viewing"
    case "recently_sold": return "Speak to an advisor"
    case "brand_editorial": return "Discover more"
    case "availability":
    case "price_update": return "Request details"
    default: return "View property"
  }
}

function derivedCta(value: string, objective: MarketingObjective) {
  const normalized = tidy(value).toLocaleLowerCase()
  if (/\b(private viewing|viewing|site visit|property visit|tour)\b/u.test(normalized)) return "Book a private viewing"
  if (/\b(details?|brochure|information|presentation)\b/u.test(normalized)) return "Request details"
  if (/\b(speak|advisor|expert|consult)\b/u.test(normalized)) return "Speak to an advisor"
  if (/\b(enquire|inquire|contact|call|whatsapp)\b/u.test(normalized)) return "Enquire now"
  if (/\b(view|explore|discover|see)\b/u.test(normalized)) return "View property"
  return objectiveFallbackCta(objective)
}

/**
 * Shortening a CTA by slicing changes its intent. Select a concise action
 * phrase from that intent first, then use the objective-specific fallback.
 */
function conciseCta(value: string, objective: MarketingObjective) {
  const source = tidy(value)
  if (source.length <= STORY_COPY_SCHEMA_LIMITS.cta) return source
  return derivedCta(source, objective)
}

function removeLastWord(value: string, fallback: string) {
  const words = tidy(value).split(" ").filter(Boolean)
  if (words.length < 2) return fallback
  return cleanEnding(words.slice(0, -1).join(" ")) || fallback
}

/**
 * `fitStoryCopy` is shared with the renderer. Its legacy emergency fallback
 * can add an ellipsis, so feed it only values that already fit at complete
 * word boundaries. CTA and price use semantic/strict alternatives instead.
 */
function preserveNaturalRendererCopy(copy: StoryCopy, objective: MarketingObjective) {
  let storyCopy = copy

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const fitted = fitStoryCopy(storyCopy)
    const rendered = fitted.storyCopy
    const headlineChanged = rendered.headline !== storyCopy.headline
    const supportingLineChanged = rendered.supportingLine !== storyCopy.supportingLine
    const priceChanged = rendered.priceLine !== storyCopy.priceLine
    const ctaChanged = rendered.cta !== storyCopy.cta
    const highlightChanges = storyCopy.highlights.some((highlight, index) => rendered.highlights[index] !== highlight)

    if (!headlineChanged && !supportingLineChanged && !priceChanged && !ctaChanged && !highlightChanges && fitted.fits) {
      return { storyCopy, fitted }
    }

    const next: StoryCopy = {
      ...storyCopy,
      headline: headlineChanged
        ? removeLastWord(storyCopy.headline, "Property details")
        : storyCopy.headline,
      supportingLine: supportingLineChanged
        ? removeLastWord(storyCopy.supportingLine, "")
        : storyCopy.supportingLine,
      priceLine: priceChanged ? "" : storyCopy.priceLine,
      cta: ctaChanged
        ? derivedCta(storyCopy.cta, objective) === storyCopy.cta
          ? objectiveFallbackCta(objective)
          : derivedCta(storyCopy.cta, objective)
        : storyCopy.cta,
      highlights: storyCopy.highlights
        .map((highlight, index) => rendered.highlights[index] === highlight ? highlight : removeLastWord(highlight, ""))
        .filter(Boolean),
    }

    if (JSON.stringify(next) === JSON.stringify(storyCopy)) break
    storyCopy = next
  }

  throw new Error("Story visual copy could not be normalized safely.")
}

function changesBetween(before: StoryCopy, after: StoryCopy) {
  const diagnostics: StoryCopyNormalizationDiagnostic[] = []
  for (const field of ["headline", "supportingLine", "priceLine", "cta"] as const) {
    if (before[field] !== after[field]) {
      diagnostics.push({ field, originalCharacters: before[field].length, finalCharacters: after[field].length })
    }
  }
  const maximum = Math.max(before.highlights.length, after.highlights.length)
  for (let index = 0; index < maximum; index += 1) {
    const original = before.highlights[index] ?? ""
    const final = after.highlights[index] ?? ""
    if (original !== final) {
      diagnostics.push({ field: `highlights[${index}]`, originalCharacters: original.length, finalCharacters: final.length })
    }
  }
  return diagnostics
}

/**
 * The one final path into Story persistence and rendering. It converts only
 * visual overflows to concise renderer-safe copy; captions, facts, media, and
 * the supplied property snapshot remain untouched.
 */
export function normalizeStoryCopyForLayout(input: {
  storyCopy: StoryCopy
  objective?: MarketingObjective
}): StoryCopyNormalization {
  const objective = input.objective ?? "property_spotlight"
  const original: StoryCopy = {
    headline: tidy(input.storyCopy.headline),
    supportingLine: tidy(input.storyCopy.supportingLine),
    highlights: input.storyCopy.highlights.map(tidy).filter(Boolean),
    priceLine: tidy(input.storyCopy.priceLine),
    cta: tidy(input.storyCopy.cta),
  }
  const bounded: StoryCopy = {
    headline: shortenAtWordBoundary(original.headline, STORY_COPY_SCHEMA_LIMITS.headline, "Property details"),
    supportingLine: shortenSupportingLine(original.supportingLine),
    highlights: original.highlights
      .map(item => shortenAtWordBoundary(item, STORY_COPY_SCHEMA_LIMITS.highlight, ""))
      .filter(Boolean)
      .slice(0, STORY_COPY_SCHEMA_LIMITS.maximumHighlights),
    // Pricing is factual. It is either retained exactly or removed from the
    // optional visual slot; captions and supported provenance are untouched.
    priceLine: original.priceLine.length > STORY_COPY_SCHEMA_LIMITS.priceLine ? "" : original.priceLine,
    cta: conciseCta(original.cta, objective),
  }

  const { storyCopy, fitted } = preserveNaturalRendererCopy(bounded, objective)

  const final = StoryCopySchema.safeParse(storyCopy)
  if (!final.success || !fitted.fits) {
    throw new Error("Story visual copy could not be normalized safely.")
  }
  return {
    storyCopy: final.data,
    fits: fitted.fits,
    diagnostics: changesBetween(original, final.data),
  }
}
