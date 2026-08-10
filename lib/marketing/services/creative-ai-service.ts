import OpenAI from "openai"
import { zodTextFormat } from "openai/helpers/zod"

import { CreativeOutputSchema } from "@/lib/marketing/schemas"
import type {
  CreativeDirection,
  MarketingBrandSettings,
  MarketingContentType,
  PropertyFactSnapshot,
} from "@/lib/marketing/types"

type CreativeOutput = ReturnType<typeof CreativeOutputSchema.parse>

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

function validateBrandSafety(output: CreativeOutput, settings: MarketingBrandSettings) {
  const copy = [
    output.campaignConcept, output.hook, output.headline, output.caption,
    output.shortCaption, output.cta, output.coverText, output.altText,
    ...output.onScreenText, ...output.carouselSlides, ...output.storyCopy,
  ].join(" ").toLocaleLowerCase()

  const excluded = settings.excludedWords.find(word =>
    word.trim() && copy.includes(word.trim().toLocaleLowerCase())
  )

  if (excluded) {
    throw new Error(`The generated copy used excluded language: ${excluded}`)
  }

  return output
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

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 45_000,
      maxRetries: 1,
    })

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
}
