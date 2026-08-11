import OpenAI from "openai"
import { zodTextFormat } from "openai/helpers/zod"

import { CreativeOutputSchema, ReelStoryboardSchema } from "@/lib/marketing/schemas"
import type {
  CreativeDirection,
  MarketingBrandSettings,
  MarketingContentType,
  PropertyFactSnapshot,
  ReelStoryboard,
} from "@/lib/marketing/types"

type CreativeOutput = ReturnType<typeof CreativeOutputSchema.parse>
type ReelStoryboardOutput = ReturnType<typeof ReelStoryboardSchema.parse>

const DEFAULT_MARKETING_MODEL = "gpt-5.2"
const MARKETING_MAX_OUTPUT_TOKENS = 1_200

function factLines(property: PropertyFactSnapshot) {
  return {
    title: property.title,
    location: property.location,
    price: property.price,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    carpetArea: property.carpetArea,
    builtUpArea: property.builtUpArea,
    plotArea: property.plotArea,
    description: property.description,
    amenities: property.amenities,
    features: property.features,
    propertyType: property.propertyType,
    developmentStage: property.developmentStage,
  }
}

function validateBrandSafety<T extends CreativeOutput | ReelStoryboard>(output: T, settings: MarketingBrandSettings): T {
  const outputValues = "scenes" in output
    ? [output.hook, ...output.scenes.map(scene => scene.overlayText), output.endCard.headline, output.endCard.cta]
    : [
        output.campaignConcept, output.hook, output.headline, output.caption,
        output.shortCaption, output.cta, output.coverText, output.altText,
        ...output.onScreenText, ...output.carouselSlides, ...output.storyCopy,
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
    contentType: MarketingContentType
    creativeDirection: CreativeDirection | string
    settings: MarketingBrandSettings
    recentContent?: Array<{ hook?: string | null; headline?: string | null; creativeDirection?: string | null }>
  }): Promise<CreativeOutput> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured")
    }

    const instructions = [
      "You are the private editorial marketing assistant for a luxury real-estate CRM.",
      "Return the structured output that matches the supplied schema.",
      "Use only the supplied inventory facts. Never invent amenities, views, ROI, availability, room counts, size, price, location facts, or urgency.",
      "When a fact is absent, omit it. Generic stylistic language is allowed only when it does not imply an unsupported property fact.",
      "Use premium, sophisticated, editorial wording. Avoid cheesy sales language and excessive emojis.",
      `Brand tone: ${input.settings.preferredTone}`,
      input.settings.brandName ? `Brand name: ${input.settings.brandName}` : "",
      input.settings.instagramHandle ? `Instagram handle: @${input.settings.instagramHandle}` : "",
      input.settings.website ? `Website: ${input.settings.website}` : "",
      input.settings.whatsappCta ? `Contact / WhatsApp CTA: ${input.settings.whatsappCta}` : "",
      input.settings.preferredCta ? `Preferred CTA: ${input.settings.preferredCta}` : "",
      input.settings.excludedWords.length ? `Excluded words: ${input.settings.excludedWords.join(", ")}` : "",
      input.recentContent?.length
        ? `Avoid repeating these recently used hooks/headlines for this property: ${input.recentContent.map(item => item.hook || item.headline).filter(Boolean).join(" | ")}`
        : "",
    ].filter(Boolean).join("\n")

    const openai = openAiClient()

    let response
    try {
      response = await openai.responses.parse({
        model: process.env.OPENAI_MARKETING_MODEL ?? DEFAULT_MARKETING_MODEL,
        max_output_tokens: MARKETING_MAX_OUTPUT_TOKENS,
        input: [
          { role: "system", content: instructions },
          {
            role: "user",
            content: JSON.stringify({
              requestedContentType: input.contentType,
              creativeDirection: input.creativeDirection,
              propertyFacts: factLines(input.property),
              brandSettings: {
                brandName: input.settings.brandName,
                instagramHandle: input.settings.instagramHandle,
                website: input.settings.website,
                whatsappCta: input.settings.whatsappCta,
                preferredTone: input.settings.preferredTone,
                preferredCta: input.settings.preferredCta,
                typographyPreference: input.settings.fontFamily,
                defaultHashtags: input.settings.defaultHashtags,
                excludedWords: input.settings.excludedWords,
              },
            }),
          },
        ],
        text: {
          format: zodTextFormat(CreativeOutputSchema, "marketing_creative"),
        },
      })
    } catch (error) {
      logRequestFailure(error)
      if (isStructuredOutputParseError(error)) {
        throw new Error("OpenAI structured output could not be parsed.")
      }
      throw new Error("OpenAI generation request failed.")
    }

    const diagnostics = logResponseDiagnostics(response)
    if (diagnostics.refused) throw new Error("OpenAI refused the request.")
    if (response.status === "incomplete") {
      if (response.incomplete_details?.reason === "max_output_tokens") {
        throw new Error("OpenAI output exceeded configured token limit.")
      }
      throw new Error("OpenAI response was incomplete.")
    }
    if (response.status && response.status !== "completed") {
      throw new Error("OpenAI response was not completed.")
    }
    if (!response.output_parsed) {
      if (diagnostics.hasText) throw new Error("OpenAI structured output could not be parsed.")
      throw new Error("OpenAI returned no generated content.")
    }

    // responses.parse validates with this same Zod schema before exposing output_parsed.
    const output = CreativeOutputSchema.parse(response.output_parsed)
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
        max_output_tokens: MARKETING_MAX_OUTPUT_TOKENS,
        input: [
          { role: "system", content: storyboardInstructions({ ...input, repairInstruction }) },
          {
            role: "user",
            content: JSON.stringify({
              propertyFacts: factLines(input.property),
              sourceAssetIds: input.sourceAssetIds,
              currentStoryboard: input.currentStoryboard ?? null,
              brandSettings: {
                brandName: input.settings.brandName,
                preferredTone: input.settings.preferredTone,
                preferredCta: input.settings.preferredCta,
                defaultHashtags: input.settings.defaultHashtags,
                excludedWords: input.settings.excludedWords,
              },
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
}
