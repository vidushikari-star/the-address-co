import OpenAI from "openai"
import { zodTextFormat } from "openai/helpers/zod"

import {
  CONTENT_GENERATION_TOO_LONG_MESSAGE,
  STORY_COPY_TOO_LONG_MESSAGE,
  boundedStoryLengthValidationFields,
  marketingGenerationValidationIssues,
  tagStoryGenerationError,
  type StoryGenerationValidationStage,
} from "@/lib/marketing/generation-errors"
import {
  CreativeOutputSchema,
  ReelStoryboardSchema,
  STORY_COPY_PROVIDER_SAFETY_LIMIT,
  STORY_COPY_SCHEMA_LIMITS,
  StoryCreativeGenerationSchema,
  StoryCopyStructuralSchema,
  StoryCopySchema,
  type StoryGeneratedCreativeCandidate,
  creativeOutputSchemaForFormat,
  creativeGenerationProviderSchemaForFormat,
  type MarketingGeneratedCreative,
} from "@/lib/marketing/schemas"
import { detectUnsupportedNumericClaim, marketingPromptFacts, validateClaimProvenance } from "@/lib/marketing/fact-contract"
import { legacyContractForContentType } from "@/lib/marketing/content-contract"
import { logMarketingGenerationBreadcrumb } from "@/lib/marketing/generation-diagnostics"
import { generationOutputInstructions } from "@/lib/marketing/generation-output-contract"
import { normalizeStoryCopyForLayout } from "@/lib/marketing/story-copy-normalization"
import { STORY_COPY_GUIDANCE } from "@/lib/marketing/story-layout"
import type {
  CreativeDirection,
  MarketingBrandSettings,
  MarketingContentType,
  MarketingFormat,
  MarketingObjective,
  PropertyFactSnapshot,
  ReelStoryboard,
  StoryCopy,
} from "@/lib/marketing/types"

type CreativeOutput = ReturnType<typeof CreativeOutputSchema.parse>
type ReelStoryboardOutput = ReturnType<typeof ReelStoryboardSchema.parse>

export { CONTENT_GENERATION_TOO_LONG_MESSAGE, STORY_COPY_TOO_LONG_MESSAGE } from "@/lib/marketing/generation-errors"

const DEFAULT_MARKETING_MODEL = "gpt-5.2"

/**
 * These budgets cover compact JSON and its provenance, not long-form prose.
 * Reels need the largest allowance because they include concise overlays and
 * sequence guidance; the other formats intentionally remain smaller.
 */
export const MARKETING_OUTPUT_TOKEN_BUDGETS = Object.freeze({
  feed_single: 700,
  carousel: 700,
  story: 750,
  reel: 1_100,
  reel_storyboard: 1_000,
  story_copy: 450,
})

class OutputTokenLimitError extends Error {
  constructor() {
    super("OpenAI output exceeded the format token budget.")
    this.name = "OutputTokenLimitError"
  }
}

/** A terminal, user-safe generation error. The worker must not retry it. */
export class ContentGenerationTooLongError extends Error {
  constructor() {
    super(CONTENT_GENERATION_TOO_LONG_MESSAGE)
    this.name = "ContentGenerationTooLongError"
  }
}

/** A terminal, user-safe error after the one Story schema-length repair. */
export class StoryCopyTooLongError extends Error {
  constructor() {
    super(STORY_COPY_TOO_LONG_MESSAGE)
    this.name = "StoryCopyTooLongError"
  }
}

function factLines(property: PropertyFactSnapshot) {
  return marketingPromptFacts(property)
}

export const LUXURY_EDITORIAL_POLICY = Object.freeze({
  id: "luxury_editorial",
  tone: ["restrained", "sophisticated", "architectural", "intelligent", "property-led", "premium", "editorial rather than promotional"],
  avoidPhrases: ["dream home", "luxury redefined", "paradise found", "your dream awaits", "once-in-a-lifetime opportunity"],
  avoidPatterns: ["excessive exclamation marks", "excessive emojis", "fake urgency", "unsupported superlatives", "exaggerated ROI language", "generic sales language"],
})

function luxuryEditorialInstructions() {
  return [
    `Creative direction policy: ${LUXURY_EDITORIAL_POLICY.id}.`,
    `Prefer: ${LUXURY_EDITORIAL_POLICY.tone.join(", ")}.`,
    `Never use these phrases: ${LUXURY_EDITORIAL_POLICY.avoidPhrases.join("; ")}.`,
    `Avoid: ${LUXURY_EDITORIAL_POLICY.avoidPatterns.join("; ")}.`,
    "Keep every field concise and editorial. Prefer one clear idea over explanatory prose.",
  ].join("\n")
}

function formatConcisenessInstructions(format: MarketingFormat) {
  switch (format) {
    case "feed_single":
      return "Post schema limits: headline ≤120 characters; caption ≤900; short caption ≤220; one CTA ≤120; 1–8 restrained hashtags, each ≤48; alt text ≤300."
    case "carousel":
      return "Carousel schema limits: one caption ≤900 characters; one CTA ≤120; 1–8 restrained hashtags, each ≤48; alt text ≤300. Do not write slide copy."
    case "story":
      return `${storyCopySchemaInstructions()} Story metadata schema limits: caption ≤700 characters; 1–8 hashtags, each ≤48; alt text ≤300.`
    case "reel":
      return "Reel schema limits: hook ≤100 characters; caption ≤1000; short caption ≤220; one CTA ≤120; 1–8 hashtags, each ≤48; alt text ≤300; cover text ≤80; at most 6 overlays, each ≤80; at most 4 transitions."
  }
}

function storyCopySchemaInstructions() {
  return [
    `Story schema limits: headline ≤${STORY_COPY_SCHEMA_LIMITS.headline} characters; supporting line ≤${STORY_COPY_SCHEMA_LIMITS.supportingLine}; up to ${STORY_COPY_SCHEMA_LIMITS.maximumHighlights} highlights, each ≤${STORY_COPY_SCHEMA_LIMITS.highlight}; price line ≤${STORY_COPY_SCHEMA_LIMITS.priceLine}; CTA ≤${STORY_COPY_SCHEMA_LIMITS.cta}.`,
    `CTA MUST be ${STORY_COPY_SCHEMA_LIMITS.cta} characters or fewer. Prefer 2–6 words where practical: one short action only, with no explanatory sentence or duplicated property facts.`,
    `For mobile readability, aim for the existing editorial targets: headline about ${STORY_COPY_GUIDANCE.headline.recommendedCharacters} characters, supporting line about ${STORY_COPY_GUIDANCE.supportingLine.recommendedCharacters}, highlights about ${STORY_COPY_GUIDANCE.highlights.recommendedCharactersPerItem} each, and CTA about ${STORY_COPY_GUIDANCE.cta.recommendedCharacters}.`,
    "Never put a paragraph or hashtags in storyCopy; it is burned into a 9:16 creative. The feed-style caption remains separate metadata.",
  ].join(" ")
}

function validateBrandSafety<T extends CreativeOutput | ReelStoryboard>(output: T, settings: MarketingBrandSettings): T {
  const outputValues = "scenes" in output
    ? [output.hook, ...output.scenes.map(scene => scene.overlayText), output.endCard.headline, output.endCard.cta]
    : [
        output.campaignConcept, output.hook, output.headline, output.caption,
        output.shortCaption, output.cta, output.coverText, output.altText,
        ...output.onScreenText, ...output.carouselSlides,
        output.storyCopy.headline, output.storyCopy.supportingLine,
        ...output.storyCopy.highlights, output.storyCopy.priceLine, output.storyCopy.cta,
      ]
  const copy = [
    ...outputValues,
  ].join(" ").toLocaleLowerCase()

  const excluded = settings.excludedWords.find(word =>
    word.trim() && copy.includes(word.trim().toLocaleLowerCase())
  )

  if (excluded) {
    throw new Error(`The generated copy used excluded language: ${excluded}`)
  }

  return output
}

function openAiClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 45_000,
    maxRetries: 1,
  })
}

function storyboardInstructions(input: {
  settings: MarketingBrandSettings
  creativeDirection: CreativeDirection | string
  userPrompt: string
  repairInstruction?: string
}) {
  return [
    "You are the private visual-storyboard editor for a luxury real-estate CRM.",
    "Return only the supplied structured storyboard schema.",
    "Use only the provided CRM property facts. Never invent price, location, amenities, area, ROI, availability, developer, completion, views, or lifestyle claims.",
    "Use only a supplied source asset ID in every scene. Do not create, omit, or alter asset IDs.",
    "Overlay text is visual copy, not the long Instagram caption: keep it concise, legible, and fact-grounded. Use no more than one short idea per scene.",
    "Design for the mobile-safe Reel text region: no paragraphs, at most 2–3 short lines, and summarize a long source sentence instead of copying it.",
    "Hard overlay limits: hook/title overlay ≤80 characters; normal scene overlay preferably ≤90 characters and never >120; CTA overlay ≤100 characters. Keep each end-card headline + CTA combined ≤100 characters (headline ≤70, CTA ≤48).",
    "Select only one controlled typographyStyle: editorial_serif for editorial/luxurious requests, refined_serif for classic refined copy, modern_sans for contemporary copy, or minimal_sans for restrained minimal copy. Never request a font file or font name.",
    "Use the end card for the concise CTA. Respect excluded words and brand tone.",
    `Creative direction: ${input.creativeDirection}`,
    `Brand tone: ${input.settings.preferredTone}`,
    input.settings.brandName ? `Brand name: ${input.settings.brandName}` : "",
    input.settings.preferredCta ? `Preferred CTA: ${input.settings.preferredCta}` : "",
    input.settings.excludedWords.length ? `Excluded words: ${input.settings.excludedWords.join(", ")}` : "",
    `Creative instruction: ${input.userPrompt}`,
    input.repairInstruction ?? "",
  ].filter(Boolean).join("\n")
}

function logResponseDiagnostics(response: {
  id: string
  status?: string
  output: Array<{ type: string; content?: Array<{ type: string; text?: string; parsed?: unknown }> }>
  incomplete_details?: { reason?: string | null } | null
}, outputParsed: unknown) {
  const content = response.output.flatMap(item => item.type === "message" ? item.content ?? [] : [])
  const hasText = content.some(item => item.type === "output_text" && Boolean(item.text?.trim()))
  const parsed = outputParsed !== null || content.some(item => item.parsed !== null && item.parsed !== undefined)
  const refused = content.some(item => item.type === "refusal")

  // Keep this deliberately metadata-only: the response can contain property data and generated copy.
  console.info("OpenAI response received:", JSON.stringify({
    id: response.id,
    status: response.status,
    outputItems: response.output.length,
    outputTypes: response.output.map(item => item.type),
    parsed,
    text: hasText,
    refused,
    incompleteReason: response.incomplete_details?.reason ?? null,
  }))

  return { hasText, parsed, refused }
}

function isStructuredOutputParseError(error: unknown) {
  if (error instanceof SyntaxError) return true
  if (!error || typeof error !== "object") return false
  const candidate = error as { name?: unknown; issues?: unknown; message?: unknown }
  return marketingGenerationValidationIssues(error).length > 0 || candidate.name === "ZodError" ||
    (typeof candidate.message === "string" && candidate.message.includes("JSON"))
}

function validationIssues(error: unknown) {
  return marketingGenerationValidationIssues(error)
}

function isOverlayLengthValidationError(error: unknown) {
  const issues = validationIssues(error)
  return Boolean(issues.length) && issues.every(issue => {
    if (issue.code !== "too_big" || !Array.isArray(issue.path)) return false
    const path = issue.path.map(String)
    return path[0] === "scenes" || path[0] === "endCard" || path.includes("overlay") || path.includes("overlayText")
  })
}

function storyCopyLengthValidationFields(error: unknown) {
  return boundedStoryLengthValidationFields(error)
}

class StoryCopySchemaLengthError extends Error {
  constructor(readonly fields: string[]) {
    super("Story structured output exceeded a Story copy length limit.")
    this.name = "StoryCopySchemaLengthError"
  }
}

type StoryVisualLengthField = "headline" | "supportingLine" | "priceLine" | "cta" | `highlights[${number}]`

type StoryVisualLength = {
  field: StoryVisualLengthField
  characters: number
  maximum: number
}

function storyVisualLengths(storyCopy: StoryCopy): StoryVisualLength[] {
  return [
    { field: "headline", characters: storyCopy.headline.length, maximum: STORY_COPY_SCHEMA_LIMITS.headline },
    { field: "supportingLine", characters: storyCopy.supportingLine.length, maximum: STORY_COPY_SCHEMA_LIMITS.supportingLine },
    ...storyCopy.highlights.map((highlight, index) => ({
      field: `highlights[${index}]` as const,
      characters: highlight.length,
      maximum: STORY_COPY_SCHEMA_LIMITS.highlight,
    })),
    { field: "priceLine", characters: storyCopy.priceLine.length, maximum: STORY_COPY_SCHEMA_LIMITS.priceLine },
    { field: "cta", characters: storyCopy.cta.length, maximum: STORY_COPY_SCHEMA_LIMITS.cta },
  ]
}

function storyVisualOverflow(storyCopy: StoryCopy) {
  return storyVisualLengths(storyCopy).filter(field => field.characters > field.maximum)
}

function storyCopyLengthError(error: unknown) {
  const fields = storyCopyLengthValidationFields(error)
  return fields.length ? new StoryCopySchemaLengthError(fields) : null
}

function storyVisualLengthError(fields: StoryVisualLength[]) {
  return new StoryCopySchemaLengthError(fields.map(field => field.field))
}

function logStoryCopySchemaRepair(status: "requested" | "exhausted", fields: string[]) {
  // Validation metadata only; do not log generated copy or property facts.
  console[status === "requested" ? "info" : "error"]("OpenAI Story schema repair:", JSON.stringify({ status, fields, attempts: status === "requested" ? 1 : 2 }))
}

function logStoryVisualParse(stage: "provider_parse" | "repair_parse", fields: StoryVisualLength[]) {
  // Validation metadata only; do not log generated copy or property facts.
  console.info("Story generation validation:", JSON.stringify({
    stage,
    issueCodes: [],
    issuePaths: [],
    fields: fields.map(field => ({
      field: `storyCopy.${field.field}`,
      [stage === "provider_parse" ? "originalCharacters" : "repairedCharacters"]: field.characters,
      rendererMaximum: field.maximum,
    })),
  }))
}

function logStoryProviderSchema() {
  // This is the schema passed to `zodTextFormat`, not the final renderer cap.
  console.info("Story generation validation:", JSON.stringify({
    stage: "provider_schema",
    storyProviderCtaMax: STORY_COPY_PROVIDER_SAFETY_LIMIT,
    issueCodes: [],
    issuePaths: [],
    fields: [{ field: "storyCopy.cta", structuralMaximum: STORY_COPY_PROVIDER_SAFETY_LIMIT }],
  }))
}

function logStoryFactualValidation() {
  console.info("Story generation validation:", JSON.stringify({
    stage: "factual_validation",
    issueCodes: [],
    issuePaths: [],
    fields: [],
  }))
}

function logStoryVisualNormalization(original: StoryCopy, normalized: StoryCopy) {
  // Length metadata only; copy, facts, prompts, and credentials stay out of logs.
  const originalFields = new Map(storyVisualLengths(original).map(field => [field.field, field]))
  console.info("Story generation validation:", JSON.stringify({
    stage: "normalization",
    issueCodes: [],
    issuePaths: [],
    fields: storyVisualLengths(normalized).map(field => ({
      field: `storyCopy.${field.field}`,
      originalCharacters: originalFields.get(field.field)?.characters ?? 0,
      normalizedCharacters: field.characters,
      rendererMaximum: field.maximum,
    })),
  }))
}

function logStoryFinalVisualValidation(storyCopy: StoryCopy) {
  // Final validation logs only field names and lengths, never model output.
  console.info("Story generation validation:", JSON.stringify({
    stage: "final_renderer_validation",
    issueCodes: [],
    issuePaths: [],
    fields: storyVisualLengths(storyCopy).map(field => ({
      field: `storyCopy.${field.field}`,
      normalizedCharacters: field.characters,
      rendererMaximum: field.maximum,
    })),
  }))
}

type StoryGenerationProgress = {
  responseReceived: boolean
  stage: StoryGenerationValidationStage
}

function beginStoryGenerationProgress(): StoryGenerationProgress {
  return { responseReceived: false, stage: "provider_schema" }
}

function markStoryGenerationStage(progress: StoryGenerationProgress, stage: StoryGenerationValidationStage) {
  progress.stage = stage
  if (stage === "provider_response_received") progress.responseReceived = true

  // Deliberately metadata-only. This makes the execution boundary observable
  // without ever retaining model copy, property facts, prompts, or secrets.
  console.info("Story generation validation:", JSON.stringify({
    stage,
    issueCodes: [],
    issuePaths: [],
    fields: [],
  }))
}

/**
 * Native `responses.parse` is the primary path. Some SDK parse failures leave
 * the valid JSON text available but omit `output_parsed`; inspect every output
 * text item as a bounded fallback so we can identify a recoverable length-only
 * validation error without depending on a legacy fixed response index.
 */
function structuredTextFallback(response: {
  output: Array<{ type: string; content?: Array<{ type: string; text?: string }> }>
}) {
  for (const item of response.output) {
    if (item.type !== "message") continue
    for (const content of item.content ?? []) {
      if (content.type !== "output_text" || !content.text?.trim()) continue
      try {
        return JSON.parse(content.text) as unknown
      } catch {
        // A malformed candidate is handled by the normal structured-output
        // error below; keep checking later message items first.
      }
    }
  }
  return null
}

function compactSummary(value: string, maximum = 220) {
  const text = value.replace(/\s+/g, " ").trim()
  if (text.length <= maximum) return text
  const words = text.slice(0, maximum + 1).replace(/\s+\S*$/, "").trim()
  return `${words || text.slice(0, maximum).trimEnd()}…`
}

function fallbackStoryCopy(headline: string, cta: string): StoryCopy {
  return { headline, supportingLine: "", highlights: [], priceLine: "", cta }
}

/**
 * The API receives only fields relevant to its delivery format. Downstream
 * storage intentionally keeps the historic full creative shape, with unused
 * fields deterministic rather than model-generated.
 */
function normalizeGeneratedCreative(input: {
  format: MarketingFormat
  property: PropertyFactSnapshot
  generated: MarketingGeneratedCreative
}): CreativeOutput {
  const outputSchema = creativeOutputSchemaForFormat(input.format)
  const defaults = {
    onScreenText: [] as string[],
    carouselSlides: [] as string[],
    coverText: "",
    suggestedDuration: 30 as const,
    transitions: ["fade"] as Array<"fade" | "cross_dissolve" | "slide" | "zoom" | "blur">,
    audioStyle: "manual_instagram" as const,
  }

  switch (input.format) {
    case "feed_single": {
      const output = input.generated as Extract<MarketingGeneratedCreative, { headline: string; shortCaption: string }>
      return outputSchema.parse({
        campaignConcept: output.headline,
        hook: output.headline,
        headline: output.headline,
        caption: output.caption,
        shortCaption: output.shortCaption,
        cta: output.cta,
        hashtags: output.hashtags,
        altText: output.altText,
        storyCopy: fallbackStoryCopy(output.headline, output.cta),
        factsUsed: output.factsUsed,
        claimProvenance: output.claimProvenance,
        ...defaults,
      })
    }
    case "carousel": {
      const output = input.generated as Extract<MarketingGeneratedCreative, { caption: string; cta: string; altText: string }>
      const derivedHeadline = input.property.title
      return outputSchema.parse({
        campaignConcept: derivedHeadline,
        hook: derivedHeadline,
        headline: derivedHeadline,
        caption: output.caption,
        shortCaption: compactSummary(output.caption),
        cta: output.cta,
        hashtags: output.hashtags,
        altText: output.altText,
        storyCopy: fallbackStoryCopy(derivedHeadline, output.cta),
        factsUsed: output.factsUsed,
        claimProvenance: output.claimProvenance,
        ...defaults,
      })
    }
    case "story": {
      const output = input.generated as Extract<MarketingGeneratedCreative, { storyCopy: StoryCopy; caption: string; altText: string }>
      return outputSchema.parse({
        campaignConcept: output.storyCopy.headline,
        hook: output.storyCopy.headline,
        headline: output.storyCopy.headline,
        caption: output.caption,
        shortCaption: compactSummary(output.caption),
        cta: output.storyCopy.cta,
        hashtags: output.hashtags,
        altText: output.altText,
        storyCopy: output.storyCopy,
        factsUsed: output.factsUsed,
        claimProvenance: output.claimProvenance,
        ...defaults,
      })
    }
    case "reel": {
      const output = input.generated as Extract<MarketingGeneratedCreative, { hook: string; coverText: string; onScreenText: string[] }>
      return outputSchema.parse({
        campaignConcept: output.hook,
        hook: output.hook,
        headline: output.hook,
        caption: output.caption,
        shortCaption: output.shortCaption,
        cta: output.cta,
        hashtags: output.hashtags,
        altText: output.altText,
        coverText: output.coverText,
        onScreenText: output.onScreenText,
        suggestedDuration: output.suggestedDuration,
        transitions: output.transitions,
        storyCopy: fallbackStoryCopy(output.hook, output.cta),
        factsUsed: output.factsUsed,
        claimProvenance: output.claimProvenance,
        carouselSlides: [],
        audioStyle: "manual_instagram",
      })
    }
  }
}

function creativeCopyForClaims(output: Pick<CreativeOutput,
  "hook" | "headline" | "caption" | "shortCaption" | "cta" | "coverText" | "altText" |
  "onScreenText" | "carouselSlides" | "storyCopy"
>) {
  return [
    output.hook, output.headline, output.caption, output.shortCaption, output.cta,
    output.coverText, output.altText, ...output.onScreenText, ...output.carouselSlides,
    output.storyCopy.headline, output.storyCopy.supportingLine, ...output.storyCopy.highlights,
    output.storyCopy.priceLine, output.storyCopy.cta,
  ].join(" ")
}

function generatedStoryCopyForClaims(output: StoryGeneratedCreativeCandidate) {
  return [
    output.caption, output.altText,
    output.storyCopy.headline, output.storyCopy.supportingLine, ...output.storyCopy.highlights,
    output.storyCopy.priceLine, output.storyCopy.cta,
  ].join(" ")
}

function storyCopyText(storyCopy: StoryCopy) {
  return [
    storyCopy.headline, storyCopy.supportingLine, ...storyCopy.highlights,
    storyCopy.priceLine, storyCopy.cta,
  ].join(" ")
}

/**
 * Claim grounding deliberately runs before any visual repair. A later visual
 * normalisation can remove an optional line, but it must never be used to
 * rescue an invented or structurally invalid provider response.
 */
function validateGeneratedFacts(input: {
  property: PropertyFactSnapshot
  factsUsed: CreativeOutput["factsUsed"]
  claimProvenance: CreativeOutput["claimProvenance"]
  copy: string
}) {
  if (input.factsUsed.length && !input.claimProvenance.length) {
    throw new Error("Generated factual copy is missing claim provenance. Try generation again.")
  }
  validateClaimProvenance({
    property: input.property,
    claims: input.claimProvenance,
    factsUsed: input.factsUsed,
    copy: input.copy,
  })
  const unsupportedNumericClaim = detectUnsupportedNumericClaim(input.copy, input.property)
  if (unsupportedNumericClaim) throw new Error(unsupportedNumericClaim)
}

function validateStoryCopyNumericFacts(storyCopy: StoryCopy, property: PropertyFactSnapshot) {
  const unsupportedNumericClaim = detectUnsupportedNumericClaim(storyCopyText(storyCopy), property)
  if (unsupportedNumericClaim) throw new Error(unsupportedNumericClaim)
}

function normalizeForClaimSearch(value: string) {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase()
}

/**
 * An optional Story visual field can be removed when it cannot fit exactly
 * (notably price). Remove only provenance that no longer has visible copy,
 * then keep `factsUsed` in step with the persisted claims.
 */
function removeOmittedStoryClaims(output: CreativeOutput): CreativeOutput {
  const copy = normalizeForClaimSearch(creativeCopyForClaims(output))
  const claimProvenance = output.claimProvenance.filter(claim => copy.includes(normalizeForClaimSearch(claim.text)))
  if (claimProvenance.length === output.claimProvenance.length) return output

  const factKeysWithVisibleClaims = new Set(claimProvenance.map(claim => claim.factKey))
  return {
    ...output,
    factsUsed: output.factsUsed.filter(factKey => factKeysWithVisibleClaims.has(factKey)),
    claimProvenance,
  }
}

class StoryboardOverlayLengthError extends Error {
  constructor() {
    super("AI generated text that was too long for the Reel layout.")
  }
}

/**
 * A bounded last-mile fit for renderer-safe overlays. It preserves whole words
 * and prefers the first complete sentence over a raw character slice.
 */
function shortenVisualCopy(value: string, maximum: number) {
  const text = value.replace(/\s+/g, " ").trim()
  if (text.length <= maximum) return text
  const sentence = text.split(/(?<=[.!?])\s+/).find(item => item.length > 0 && item.length <= maximum)
  if (sentence) return sentence
  const words = text.split(" ")
  const kept: string[] = []
  for (const word of words) {
    const next = [...kept, word].join(" ")
    if (next.length > maximum - 1) break
    kept.push(word)
  }
  return `${kept.join(" ").trimEnd() || text.slice(0, Math.max(1, maximum - 1)).trimEnd()}…`
}

/** Exported for deterministic unit coverage of the mobile-safe fallback. */
export function fitStoryboardCopyForReelLayout(storyboard: ReelStoryboard): ReelStoryboardOutput {
  const scenes = storyboard.scenes.map(scene => {
    const preferredMaximum = scene.overlayType === "hook" ? 80 : scene.overlayType === "cta" ? 100 : 90
    return { ...scene, overlayText: shortenVisualCopy(scene.overlayText, preferredMaximum) }
  })
  let headline = shortenVisualCopy(storyboard.endCard.headline, 70)
  const cta = shortenVisualCopy(storyboard.endCard.cta, 48)
  headline = shortenVisualCopy(headline, Math.max(1, 100 - cta.length - 1))
  return ReelStoryboardSchema.parse({ ...storyboard, scenes, endCard: { headline, cta } })
}

function logRequestFailure(error: unknown) {
  const details = error && typeof error === "object"
    ? error as { name?: unknown; status?: unknown; requestID?: unknown; message?: unknown }
    : {}
  console.error("OpenAI generation request failed:", JSON.stringify({
    name: typeof details.name === "string" ? details.name : "UnknownError",
    status: typeof details.status === "number" ? details.status : null,
    requestId: typeof details.requestID === "string" ? details.requestID : null,
    parseFailure: isStructuredOutputParseError(error),
  }))
}

export class CreativeAIService {
  static async generate(input: {
    property: PropertyFactSnapshot
    format?: MarketingFormat
    objective?: MarketingObjective
    /** Compatibility input for older worker callers; it maps through a finite table. */
    contentType?: MarketingContentType
    creativeDirection: CreativeDirection | string
    settings: MarketingBrandSettings
    recentContent?: Array<{ hook?: string | null; headline?: string | null; creativeDirection?: string | null }>
  }): Promise<CreativeOutput> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured")
    }
    const legacy = input.format && input.objective
      ? null
      : input.contentType ? legacyContractForContentType(input.contentType) : null
    const format = input.format ?? legacy?.format
    const objective = input.objective ?? legacy?.objective
    if (!format || !objective) throw new Error("Marketing generation requires an explicit delivery format and objective.")

    logMarketingGenerationBreadcrumb({ event: "creative_ai_service_entered", format, stage: "provider_schema" })
    const openai = openAiClient()
    const generationProgress = beginStoryGenerationProgress()
    const markGenerationStage = (stage: StoryGenerationValidationStage) => {
      if (format === "story") {
        markStoryGenerationStage(generationProgress, stage)
        return
      }
      generationProgress.stage = stage
      if (stage === "provider_response_received") generationProgress.responseReceived = true
    }
    const requestCreative = async (repairInstruction?: string, normalizeRemainingVisualLength = false) => {
      const providerSchema = creativeGenerationProviderSchemaForFormat(format)
      const storyValidationStage = normalizeRemainingVisualLength ? "repair_parse" as const : "provider_parse" as const
      const maxOutputTokens = MARKETING_OUTPUT_TOKEN_BUDGETS[format]
      const instructions = [
        "You are the private editorial marketing assistant for a luxury real-estate CRM.",
        "Return the structured output that matches the supplied schema.",
        "Use only the supplied inventory facts. Never invent amenities, views, ROI, availability, room counts, size, price, location facts, or urgency.",
        "When a fact is absent, omit it. Generic stylistic language is allowed only when it does not imply an unsupported property fact.",
        "For every factual claim, return one compact claimProvenance entry: quote only the factual phrase, identify the supplied fact key, and use the exact supplied fact value or a compact exact excerpt. Never duplicate a full caption in provenance. Do not add provenance for generic stylistic copy.",
        luxuryEditorialInstructions(),
        generationOutputInstructions(format),
        formatConcisenessInstructions(format),
        `Objective: ${objective}.`,
        format === "story" ? "Story output is a concise visual script for a 1080×1920 mobile-safe renderer." : "",
        `Brand tone: ${input.settings.preferredTone}`,
        input.settings.brandName ? `Brand name: ${input.settings.brandName}` : "",
        input.settings.instagramHandle ? `Instagram handle: @${input.settings.instagramHandle}` : "",
        input.settings.website ? `Website: ${input.settings.website}` : "",
        input.settings.whatsappCta ? `Contact / WhatsApp CTA: ${input.settings.whatsappCta}` : "",
        input.settings.preferredCta ? `Preferred CTA: ${input.settings.preferredCta}` : "",
        input.settings.defaultHashtags.length ? `Prefer these relevant existing hashtags where suitable: ${input.settings.defaultHashtags.join(" ")}` : "",
        input.settings.excludedWords.length ? `Excluded words: ${input.settings.excludedWords.join(", ")}` : "",
        input.recentContent?.length
          ? `Avoid repeating these recently used hooks/headlines for this property: ${input.recentContent.map(item => item.hook || item.headline).filter(Boolean).join(" | ")}`
          : "",
        repairInstruction ?? "",
      ].filter(Boolean).join("\n")

      let response
      try {
        markGenerationStage("provider_schema")
        if (format === "story") logStoryProviderSchema()
        logMarketingGenerationBreadcrumb({ event: "openai_request_started", format, stage: "provider_schema" })
        response = await openai.responses.parse({
          model: process.env.OPENAI_MARKETING_MODEL ?? DEFAULT_MARKETING_MODEL,
          max_output_tokens: maxOutputTokens,
          input: [
            { role: "system", content: instructions },
            {
              role: "user",
              content: JSON.stringify({ propertyFacts: factLines(input.property) }),
            },
          ],
          text: { format: zodTextFormat(providerSchema, "marketing_creative") },
        })
      } catch (error) {
        logRequestFailure(error)
        const requestError = isStructuredOutputParseError(error)
          ? new Error("OpenAI structured output could not be parsed.")
          : new Error("OpenAI generation request failed.")
        throw tagStoryGenerationError(requestError, "provider_schema")
      }

      try {
        // This is intentionally the first statement after the successful
        // provider await. No response property is read before this stage.
        markGenerationStage("provider_response_received")
        logMarketingGenerationBreadcrumb({ event: "openai_response_received", format, stage: "provider_response_received" })
        markGenerationStage("provider_output_access")
        logMarketingGenerationBreadcrumb({ event: "provider_output_access", format, stage: "provider_output_access" })
        const outputParsed = response.output_parsed
        const diagnostics = logResponseDiagnostics(response, outputParsed)
        if (diagnostics.refused) throw new Error("OpenAI refused the request.")
        if (response.status === "incomplete") {
          if (response.incomplete_details?.reason === "max_output_tokens") throw new OutputTokenLimitError()
          throw new Error("OpenAI response was incomplete.")
        }
        if (response.status && response.status !== "completed") throw new Error("OpenAI response was not completed.")
        if (!outputParsed) {
          if (diagnostics.hasText) throw new Error("OpenAI structured output could not be parsed.")
          throw new Error("OpenAI returned no generated content.")
        }
        markGenerationStage(storyValidationStage)
        logMarketingGenerationBreadcrumb({
          event: normalizeRemainingVisualLength ? "repair_parse" : "structural_parse",
          format,
          stage: storyValidationStage,
        })
        const parsed = providerSchema.safeParse(outputParsed)
        if (!parsed.success) {
          throw new Error("OpenAI structured output could not be parsed.")
        }
        let generated: MarketingGeneratedCreative
        if (format === "story") {
          markGenerationStage("generation_result_mapping")
          const candidate = parsed.data as StoryGeneratedCreativeCandidate
          logStoryVisualParse(storyValidationStage, storyVisualLengths(candidate.storyCopy))
          try {
            markGenerationStage("factual_validation")
            logMarketingGenerationBreadcrumb({ event: "factual_validation", format, stage: "factual_validation" })
            validateGeneratedFacts({
              property: input.property,
              factsUsed: candidate.factsUsed,
              claimProvenance: candidate.claimProvenance,
              copy: generatedStoryCopyForClaims(candidate),
            })
            logStoryFactualValidation()
          } catch (error) {
            throw tagStoryGenerationError(error, "factual_validation")
          }
          markGenerationStage("overflow_detection")
          logMarketingGenerationBreadcrumb({ event: "overflow_detection", format, stage: "overflow_detection" })
          const visualOverflow = storyVisualOverflow(candidate.storyCopy)
          if (visualOverflow.length && !normalizeRemainingVisualLength) {
            throw tagStoryGenerationError(storyVisualLengthError(visualOverflow), "overflow_detection")
          }
          // This is intentionally before the only strict Story schema parse:
          // visual copy is deterministic renderer-safe before it is persisted.
          let normalized: ReturnType<typeof normalizeStoryCopyForLayout>
          try {
            markGenerationStage("normalization")
            logMarketingGenerationBreadcrumb({ event: "normalization", format, stage: "normalization" })
            normalized = normalizeStoryCopyForLayout({ storyCopy: candidate.storyCopy, objective })
          } catch (error) {
            throw tagStoryGenerationError(error, "normalization")
          }
          logStoryVisualNormalization(candidate.storyCopy, normalized.storyCopy)
          markGenerationStage("final_renderer_validation")
          logMarketingGenerationBreadcrumb({ event: "final_renderer_validation", format, stage: "final_renderer_validation" })
          const finalStory = StoryCreativeGenerationSchema.safeParse({ ...candidate, storyCopy: normalized.storyCopy })
          if (!finalStory.success) {
            throw new Error("Story visual copy could not be normalized safely.")
          }
          logStoryFinalVisualValidation(finalStory.data.storyCopy)
          generated = finalStory.data
        } else {
          generated = parsed.data as MarketingGeneratedCreative
        }
        markGenerationStage("creative_output_validation")
        logMarketingGenerationBreadcrumb({ event: "creative_output_validation", format, stage: "creative_output_validation" })
        return normalizeGeneratedCreative({ format, property: input.property, generated })
      } catch (error) {
        if (format === "story") {
          const lengthError = storyCopyLengthError(error)
          throw tagStoryGenerationError(lengthError ?? error, generationProgress.stage)
        }
        if (generationProgress.responseReceived) throw tagStoryGenerationError(error, generationProgress.stage)
        throw error
      }
    }

    const requestWithTokenRecovery = async (repairInstruction?: string, normalizeRemainingVisualLength = false) => {
      try {
        return await requestCreative(repairInstruction, normalizeRemainingVisualLength)
      } catch (error) {
        if (!(error instanceof OutputTokenLimitError)) throw error
        console.warn("OpenAI output-token recovery requested:", JSON.stringify({ format, maxOutputTokens: MARKETING_OUTPUT_TOKEN_BUDGETS[format], attempts: 1 }))
        const tokenRecoveryInstruction = [
          repairInstruction,
          "The previous response exceeded its output budget. Return one concise, valid response within every stated field limit. Preserve only essential fact-grounded editorial copy and compact provenance.",
        ].filter(Boolean).join(" ")
        try {
          return await requestCreative(tokenRecoveryInstruction, normalizeRemainingVisualLength)
        } catch (recoveryError) {
          if (recoveryError instanceof OutputTokenLimitError) {
            console.error("OpenAI output-token recovery exhausted:", JSON.stringify({ format, maxOutputTokens: MARKETING_OUTPUT_TOKEN_BUDGETS[format], attempts: 2 }))
            throw new ContentGenerationTooLongError()
          }
          throw recoveryError
        }
      }
    }

    const repairStoryCopySchema = async (error: StoryCopySchemaLengthError) => {
      markGenerationStage("repair_request")
      logMarketingGenerationBreadcrumb({ event: "repair_request", format, stage: "repair_request" })
      logStoryCopySchemaRepair("requested", error.fields)
      try {
        return await requestWithTokenRecovery("Repair only storyCopy. Return the same factual content and editorial direction, but shorten the invalid fields to satisfy every Story schema limit. Keep the CTA to one short action, 60 characters or fewer. Do not add facts.", true)
      } catch (repairError) {
        if (repairError instanceof StoryCopySchemaLengthError) {
          logStoryCopySchemaRepair("exhausted", repairError.fields)
          throw new StoryCopyTooLongError()
        }
        throw repairError
      }
    }

    try {
      let output: CreativeOutput
      try {
        output = await requestWithTokenRecovery()
      } catch (error) {
        if (!(error instanceof StoryCopySchemaLengthError)) throw error
        output = await repairStoryCopySchema(error)
      }
      if (format === "story") {
        markGenerationStage("generation_result_mapping")
        output = removeOmittedStoryClaims(output)
      }
      try {
        markGenerationStage("factual_validation")
        if (format !== "story") logMarketingGenerationBreadcrumb({ event: "factual_validation", format, stage: "factual_validation" })
        validateGeneratedFacts({
          property: input.property,
          factsUsed: output.factsUsed,
          claimProvenance: output.claimProvenance,
          copy: creativeCopyForClaims(output),
        })
      } catch (error) {
        if (generationProgress.responseReceived) throw tagStoryGenerationError(error, generationProgress.stage)
        throw error
      }
      markGenerationStage("creative_output_validation")
      if (format !== "story") logMarketingGenerationBreadcrumb({ event: "creative_output_validation", format, stage: "creative_output_validation" })
      return validateBrandSafety(output, input.settings)
    } catch (error) {
      if (generationProgress.responseReceived) throw tagStoryGenerationError(error, generationProgress.stage)
      throw error
    }
  }

  /**
   * Generates a new editable Reel storyboard. The existing approved render is
   * deliberately an input only; this method never mutates it.
   */
  static async improveReelStoryboard(input: {
    property: PropertyFactSnapshot
    creativeDirection: CreativeDirection | string
    settings: MarketingBrandSettings
    sourceAssetIds: string[]
    currentStoryboard?: ReelStoryboard | null
    userPrompt: string
  }): Promise<ReelStoryboard> {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured")
    if (!input.sourceAssetIds.length) throw new Error("A Reel needs at least one selected property asset.")

    const requestStoryboard = async (repairInstruction?: string): Promise<ReelStoryboardOutput> => {
      let response
      try {
        response = await openAiClient().responses.parse({
        model: process.env.OPENAI_MARKETING_MODEL ?? DEFAULT_MARKETING_MODEL,
        max_output_tokens: MARKETING_OUTPUT_TOKEN_BUDGETS.reel_storyboard,
        input: [
          { role: "system", content: storyboardInstructions({ ...input, repairInstruction }) },
          {
            role: "user",
            content: JSON.stringify({
              propertyFacts: factLines(input.property),
              sourceAssetIds: input.sourceAssetIds,
              currentStoryboard: input.currentStoryboard ?? null,
            }),
          },
        ],
        text: { format: zodTextFormat(ReelStoryboardSchema, "marketing_reel_storyboard") },
      })
      } catch (error) {
        logRequestFailure(error)
        if (isOverlayLengthValidationError(error)) throw new StoryboardOverlayLengthError()
        if (isStructuredOutputParseError(error)) throw new Error("OpenAI structured storyboard could not be parsed.")
        throw new Error("OpenAI storyboard generation request failed.")
      }

      const diagnostics = logResponseDiagnostics(response, response.output_parsed)
      if (diagnostics.refused) throw new Error("OpenAI refused the storyboard request.")
      if (response.status === "incomplete") {
        if (response.incomplete_details?.reason === "max_output_tokens") throw new Error("OpenAI storyboard output exceeded configured token limit.")
        throw new Error("OpenAI storyboard response was incomplete.")
      }
      if (response.status && response.status !== "completed") throw new Error("OpenAI storyboard response was not completed.")
      const structuredOutput = response.output_parsed ?? structuredTextFallback(response)
      if (!structuredOutput) {
        if (diagnostics.hasText) throw new Error("OpenAI structured storyboard could not be parsed.")
        throw new Error("OpenAI returned no generated storyboard.")
      }

      const parsed = ReelStoryboardSchema.safeParse(structuredOutput)
      if (!parsed.success) {
        if (isOverlayLengthValidationError(parsed.error)) throw new StoryboardOverlayLengthError()
        throw new Error("OpenAI structured storyboard could not be parsed.")
      }
      return parsed.data
    }

    let storyboard: ReelStoryboard
    try {
      storyboard = await requestStoryboard()
    } catch (error) {
      if (!(error instanceof StoryboardOverlayLengthError)) throw error
      console.info("OpenAI storyboard overlay repair requested:", JSON.stringify({ reason: "overlay_length", attempts: 1 }))
      try {
        storyboard = await requestStoryboard("Repair only the text lengths: regenerate the same fact-grounded storyboard with shorter mobile-safe overlays. Preserve the source asset IDs, property facts, intent, scene order where possible, and brand exclusions.")
      } catch (repairError) {
        if (repairError instanceof StoryboardOverlayLengthError || isStructuredOutputParseError(repairError)) {
          throw new Error("AI generated text that was too long for the Reel layout. Please try again or use a shorter creative instruction.")
        }
        throw repairError
      }
    }

    storyboard = fitStoryboardCopyForReelLayout(storyboard)
    const knownAssets = new Set(input.sourceAssetIds)
    if (storyboard.scenes.some(scene => !knownAssets.has(scene.assetId))) {
      throw new Error("OpenAI storyboard referenced an unavailable source asset.")
    }
    return validateBrandSafety(storyboard, input.settings)
  }

  /** Produces visual Story copy only; feed captions and hashtags are never used as an overlay fallback. */
  static async improveStoryCopy(input: {
    property: PropertyFactSnapshot
    creativeDirection: CreativeDirection | string
    settings: MarketingBrandSettings
    currentStoryCopy: CreativeOutput["storyCopy"]
    userPrompt: string
  }): Promise<CreativeOutput["storyCopy"]> {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured")
    const storyProgress = beginStoryGenerationProgress()
    const markStoryStage = (stage: StoryGenerationValidationStage) => markStoryGenerationStage(storyProgress, stage)
    const requestStoryCopy = async (repairInstruction?: string, normalizeRemainingVisualLength = false) => {
      const storyValidationStage = normalizeRemainingVisualLength ? "repair_parse" as const : "provider_parse" as const
      let response
      try {
        markStoryStage("provider_schema")
        logStoryProviderSchema()
        response = await openAiClient().responses.parse({
          model: process.env.OPENAI_MARKETING_MODEL ?? DEFAULT_MARKETING_MODEL,
          max_output_tokens: MARKETING_OUTPUT_TOKEN_BUDGETS.story_copy,
          input: [
            { role: "system", content: [
              "You are the visual Story editor for a luxury real-estate CRM.",
              "Return only the supplied concise Story copy schema.",
              "Use only supplied property facts. Never invent facts.",
              "Every value is burned into a 1080×1920 Instagram Story.",
              storyCopySchemaInstructions(),
              "Never include a full feed caption, paragraph, hashtag list, or unsupported claim.",
              `Brand tone: ${input.settings.preferredTone}`,
              input.settings.excludedWords.length ? `Excluded words: ${input.settings.excludedWords.join(", ")}` : "",
              `Creative direction: ${input.creativeDirection}`,
              `Requested improvement: ${input.userPrompt}`,
              repairInstruction ?? "",
            ].filter(Boolean).join("\n") },
            { role: "user", content: JSON.stringify({ propertyFacts: factLines(input.property), currentStoryCopy: input.currentStoryCopy }) },
          ],
          text: { format: zodTextFormat(StoryCopyStructuralSchema, "marketing_story_copy") },
        })
      } catch (error) {
        logRequestFailure(error)
        const requestError = isStructuredOutputParseError(error)
          ? new Error("OpenAI structured Story copy could not be parsed.")
          : new Error("OpenAI Story copy generation request failed.")
        throw tagStoryGenerationError(requestError, "provider_schema")
      }
      try {
        markStoryStage("provider_response_received")
        markStoryStage("provider_output_access")
        const outputParsed = response.output_parsed
        const diagnostics = logResponseDiagnostics(response, outputParsed)
        if (diagnostics.refused) throw new Error("OpenAI refused the Story copy request.")
        if (response.status && response.status !== "completed") throw new Error("OpenAI Story copy response was not completed.")
        if (!outputParsed) throw new Error("OpenAI returned no Story copy.")
        markStoryStage(storyValidationStage)
        const parsed = StoryCopyStructuralSchema.safeParse(outputParsed)
        if (!parsed.success) throw new Error("OpenAI structured Story copy could not be parsed.")
        markStoryStage("generation_result_mapping")
        logStoryVisualParse(storyValidationStage, storyVisualLengths(parsed.data))
        try {
          markStoryStage("factual_validation")
          validateStoryCopyNumericFacts(parsed.data, input.property)
          logStoryFactualValidation()
        } catch (error) {
          throw tagStoryGenerationError(error, "factual_validation")
        }
        markStoryStage("overflow_detection")
        const visualOverflow = storyVisualOverflow(parsed.data)
        if (visualOverflow.length && !normalizeRemainingVisualLength) {
          throw tagStoryGenerationError(storyVisualLengthError(visualOverflow), "overflow_detection")
        }
        let normalized: ReturnType<typeof normalizeStoryCopyForLayout>
        try {
          markStoryStage("normalization")
          normalized = normalizeStoryCopyForLayout({ storyCopy: parsed.data })
        } catch (error) {
          throw tagStoryGenerationError(error, "normalization")
        }
        logStoryVisualNormalization(parsed.data, normalized.storyCopy)
        markStoryStage("final_renderer_validation")
        const finalStory = StoryCopySchema.safeParse(normalized.storyCopy)
        if (!finalStory.success) throw new Error("Story visual copy could not be normalized safely.")
        logStoryFinalVisualValidation(finalStory.data)
        return finalStory.data
      } catch (error) {
        const lengthError = storyCopyLengthError(error)
        throw tagStoryGenerationError(lengthError ?? error, storyProgress.stage)
      }
    }

    try {
      let storyCopy: CreativeOutput["storyCopy"]
      try {
        storyCopy = await requestStoryCopy()
      } catch (error) {
        if (!(error instanceof StoryCopySchemaLengthError)) throw error
        markStoryStage("repair_request")
        logStoryCopySchemaRepair("requested", error.fields)
        try {
          storyCopy = await requestStoryCopy("Repair only the invalid Story fields. Return the same factual content and requested edit, but shorten them to satisfy every Story schema limit. Keep the CTA to one short action, 60 characters or fewer. Do not add facts.", true)
        } catch (repairError) {
          if (repairError instanceof StoryCopySchemaLengthError) {
            logStoryCopySchemaRepair("exhausted", repairError.fields)
            throw new StoryCopyTooLongError()
          }
          throw repairError
        }
      }
      markStoryStage("creative_output_validation")
      const checked = validateBrandSafety({
        campaignConcept: "story", hook: storyCopy.headline, headline: storyCopy.headline,
        caption: "story", shortCaption: "story", cta: storyCopy.cta, hashtags: ["#story"],
        onScreenText: [], carouselSlides: [], storyCopy, coverText: "", altText: "",
        suggestedDuration: 15, transitions: [], audioStyle: "ambient", factsUsed: [], claimProvenance: [],
      }, input.settings) as { storyCopy: StoryCopy }
      return checked.storyCopy
    } catch (error) {
      if (storyProgress.responseReceived) throw tagStoryGenerationError(error, storyProgress.stage)
      throw error
    }
  }
}
