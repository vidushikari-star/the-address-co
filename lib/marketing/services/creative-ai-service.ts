import OpenAI from "openai"
import { zodTextFormat } from "openai/helpers/zod"

import {
  CreativeOutputSchema,
  ReelStoryboardSchema,
  STORY_COPY_SCHEMA_LIMITS,
  StoryCopySchema,
  creativeGenerationSchemaForFormat,
  type MarketingGeneratedCreative,
} from "@/lib/marketing/schemas"
import { detectUnsupportedNumericClaim, marketingPromptFacts, validateClaimProvenance } from "@/lib/marketing/fact-contract"
import { legacyContractForContentType } from "@/lib/marketing/content-contract"
import { generationOutputInstructions } from "@/lib/marketing/generation-output-contract"
import { fitStoryCopy, STORY_COPY_GUIDANCE } from "@/lib/marketing/story-layout"
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

export const CONTENT_GENERATION_TOO_LONG_MESSAGE = "Content generation was too long to complete. Please try again or shorten the creative brief."
export const STORY_COPY_TOO_LONG_MESSAGE = "Story copy was too long to format. Please regenerate the Story copy."

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
  output_parsed: unknown
  incomplete_details?: { reason?: string | null } | null
}) {
  const content = response.output.flatMap(item => item.type === "message" ? item.content ?? [] : [])
  const hasText = content.some(item => item.type === "output_text" && Boolean(item.text?.trim()))
  const parsed = response.output_parsed !== null || content.some(item => item.parsed !== null && item.parsed !== undefined)
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
  return Array.isArray(candidate.issues) || candidate.name === "ZodError" ||
    (typeof candidate.message === "string" && candidate.message.includes("JSON"))
}

function validationIssues(error: unknown) {
  if (!error || typeof error !== "object") return []
  const candidate = error as { issues?: unknown }
  return Array.isArray(candidate.issues) ? candidate.issues.filter(issue => issue && typeof issue === "object") as Array<{
    code?: unknown
    path?: unknown
  }> : []
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
  const issues = validationIssues(error)
  if (!issues.length) return []

  const fields: string[] = []
  for (const issue of issues) {
    if (issue.code !== "too_big" || !Array.isArray(issue.path)) return []
    const path = (issue.path as unknown[]).map(String)
    const storyPath = path[0] === "storyCopy" ? path.slice(1) : path
    if (!["headline", "supportingLine", "highlights", "priceLine", "cta"].includes(storyPath[0] ?? "")) return []
    fields.push(storyPath.join("."))
  }
  return fields
}

class StoryCopySchemaLengthError extends Error {
  constructor(readonly fields: string[]) {
    super("Story structured output exceeded a Story copy length limit.")
    this.name = "StoryCopySchemaLengthError"
  }
}

function storyCopyLengthError(error: unknown) {
  const fields = storyCopyLengthValidationFields(error)
  return fields.length ? new StoryCopySchemaLengthError(fields) : null
}

function logStoryCopySchemaRepair(status: "requested" | "exhausted", fields: string[]) {
  // Validation metadata only; do not log generated copy or property facts.
  console[status === "requested" ? "info" : "error"]("OpenAI Story schema repair:", JSON.stringify({ status, fields, attempts: status === "requested" ? 1 : 2 }))
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
      return CreativeOutputSchema.parse({
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
      return CreativeOutputSchema.parse({
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
      return CreativeOutputSchema.parse({
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
      return CreativeOutputSchema.parse({
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

    const openai = openAiClient()
    const requestCreative = async (repairInstruction?: string) => {
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
          text: { format: zodTextFormat(creativeGenerationSchemaForFormat(format), "marketing_creative") },
        })
      } catch (error) {
        logRequestFailure(error)
        if (format === "story") {
          const lengthError = storyCopyLengthError(error)
          if (lengthError) throw lengthError
        }
        if (isStructuredOutputParseError(error)) throw new Error("OpenAI structured output could not be parsed.")
        throw new Error("OpenAI generation request failed.")
      }

      const diagnostics = logResponseDiagnostics(response)
      if (diagnostics.refused) throw new Error("OpenAI refused the request.")
      if (response.status === "incomplete") {
        if (response.incomplete_details?.reason === "max_output_tokens") throw new OutputTokenLimitError()
        throw new Error("OpenAI response was incomplete.")
      }
      if (response.status && response.status !== "completed") throw new Error("OpenAI response was not completed.")
      if (!response.output_parsed) {
        if (diagnostics.hasText) throw new Error("OpenAI structured output could not be parsed.")
        throw new Error("OpenAI returned no generated content.")
      }
      const parsed = creativeGenerationSchemaForFormat(format).safeParse(response.output_parsed)
      if (!parsed.success) {
        if (format === "story") {
          const lengthError = storyCopyLengthError(parsed.error)
          if (lengthError) throw lengthError
        }
        throw new Error("OpenAI structured output could not be parsed.")
      }
      try {
        return normalizeGeneratedCreative({ format, property: input.property, generated: parsed.data })
      } catch (error) {
        if (format === "story") {
          const lengthError = storyCopyLengthError(error)
          if (lengthError) throw lengthError
        }
        throw error
      }
    }

    const requestWithTokenRecovery = async (repairInstruction?: string) => {
      try {
        return await requestCreative(repairInstruction)
      } catch (error) {
        if (!(error instanceof OutputTokenLimitError)) throw error
        console.warn("OpenAI output-token recovery requested:", JSON.stringify({ format, maxOutputTokens: MARKETING_OUTPUT_TOKEN_BUDGETS[format], attempts: 1 }))
        const tokenRecoveryInstruction = [
          repairInstruction,
          "The previous response exceeded its output budget. Return one concise, valid response within every stated field limit. Preserve only essential fact-grounded editorial copy and compact provenance.",
        ].filter(Boolean).join(" ")
        try {
          return await requestCreative(tokenRecoveryInstruction)
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
      logStoryCopySchemaRepair("requested", error.fields)
      try {
        return await requestWithTokenRecovery("Repair only storyCopy. Return the same factual content and editorial direction, but shorten the invalid fields to satisfy every Story schema limit. Keep the CTA to one short action, 60 characters or fewer. Do not add facts.")
      } catch (repairError) {
        if (repairError instanceof StoryCopySchemaLengthError) {
          logStoryCopySchemaRepair("exhausted", repairError.fields)
          throw new StoryCopyTooLongError()
        }
        throw repairError
      }
    }

    let output: CreativeOutput
    try {
      output = await requestWithTokenRecovery()
    } catch (error) {
      if (!(error instanceof StoryCopySchemaLengthError)) throw error
      output = await repairStoryCopySchema(error)
    }
    const copyForClaims = [
      output.hook, output.headline, output.caption, output.shortCaption, output.cta,
      output.coverText, output.altText, ...output.onScreenText, ...output.carouselSlides,
      output.storyCopy.headline, output.storyCopy.supportingLine, ...output.storyCopy.highlights,
      output.storyCopy.priceLine, output.storyCopy.cta,
    ].join(" ")
    if (output.factsUsed.length && !output.claimProvenance.length) {
      throw new Error("Generated factual copy is missing claim provenance. Try generation again.")
    }
    validateClaimProvenance({ property: input.property, claims: output.claimProvenance, factsUsed: output.factsUsed, copy: copyForClaims })
    const unsupportedNumericClaim = detectUnsupportedNumericClaim(copyForClaims, input.property)
    if (unsupportedNumericClaim) throw new Error(unsupportedNumericClaim)

    if (format === "story") {
      let fit = fitStoryCopy(output.storyCopy)
      if (fit.requiresAiCondensation) {
        console.info("OpenAI Story copy repair requested:", JSON.stringify({ reason: "mobile_safe_layout", attempts: 1 }))
        try {
          output = await requestWithTokenRecovery("Repair only storyCopy: preserve the same factual content and editorial direction, but shorten the visual fields to satisfy every Story schema limit. Do not add facts.")
        } catch (error) {
          if (error instanceof StoryCopySchemaLengthError) {
            logStoryCopySchemaRepair("exhausted", error.fields)
            throw new StoryCopyTooLongError()
          }
          throw error
        }
        fit = fitStoryCopy(output.storyCopy)
      }
      if (!fit.fits) throw new StoryCopyTooLongError()
      output = { ...output, storyCopy: fit.storyCopy }
    }
    return validateBrandSafety(output, input.settings)
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

      const diagnostics = logResponseDiagnostics(response)
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
    const requestStoryCopy = async (repairInstruction?: string) => {
      let response
      try {
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
          text: { format: zodTextFormat(StoryCopySchema, "marketing_story_copy") },
        })
      } catch (error) {
        logRequestFailure(error)
        const lengthError = storyCopyLengthError(error)
        if (lengthError) throw lengthError
        if (isStructuredOutputParseError(error)) throw new Error("OpenAI structured Story copy could not be parsed.")
        throw new Error("OpenAI Story copy generation request failed.")
      }
      const diagnostics = logResponseDiagnostics(response)
      if (diagnostics.refused) throw new Error("OpenAI refused the Story copy request.")
      if (response.status && response.status !== "completed") throw new Error("OpenAI Story copy response was not completed.")
      if (!response.output_parsed) throw new Error("OpenAI returned no Story copy.")
      try {
        return StoryCopySchema.parse(response.output_parsed)
      } catch (error) {
        const lengthError = storyCopyLengthError(error)
        if (lengthError) throw lengthError
        throw error
      }
    }

    let storyCopy: CreativeOutput["storyCopy"]
    try {
      storyCopy = await requestStoryCopy()
    } catch (error) {
      if (!(error instanceof StoryCopySchemaLengthError)) throw error
      logStoryCopySchemaRepair("requested", error.fields)
      try {
        storyCopy = await requestStoryCopy("Repair only the invalid Story fields. Return the same factual content and requested edit, but shorten them to satisfy every Story schema limit. Keep the CTA to one short action, 60 characters or fewer. Do not add facts.")
      } catch (repairError) {
        if (repairError instanceof StoryCopySchemaLengthError) {
          logStoryCopySchemaRepair("exhausted", repairError.fields)
          throw new StoryCopyTooLongError()
        }
        throw repairError
      }
    }
    let fit = fitStoryCopy(storyCopy)
    if (fit.requiresAiCondensation) {
      console.info("OpenAI Story copy repair requested:", JSON.stringify({ reason: "mobile_safe_layout", attempts: 1 }))
      try {
        storyCopy = await requestStoryCopy("Repair only the visual text. Preserve supported facts, the requested edit, and brand exclusions; shorten it to satisfy every Story schema limit. Do not add facts.")
      } catch (error) {
        if (error instanceof StoryCopySchemaLengthError) {
          logStoryCopySchemaRepair("exhausted", error.fields)
          throw new StoryCopyTooLongError()
        }
        throw error
      }
      fit = fitStoryCopy(storyCopy)
    }
    if (!fit.fits) throw new StoryCopyTooLongError()
    const checked = validateBrandSafety({
      campaignConcept: "story", hook: fit.storyCopy.headline, headline: fit.storyCopy.headline,
      caption: "story", shortCaption: "story", cta: fit.storyCopy.cta, hashtags: ["#story"],
      onScreenText: [], carouselSlides: [], storyCopy: fit.storyCopy, coverText: "", altText: "",
      suggestedDuration: 15, transitions: [], audioStyle: "ambient", factsUsed: [], claimProvenance: [],
    }, input.settings) as { storyCopy: StoryCopy }
    return checked.storyCopy
  }
}
