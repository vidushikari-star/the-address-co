import { CreativeOutputSchema } from "@/lib/marketing/schemas"
import type {
  CreativeDirection,
  MarketingBrandSettings,
  MarketingContentType,
  PropertyFactSnapshot,
} from "@/lib/marketing/types"

const CREATIVE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "campaignConcept", "hook", "headline", "caption", "shortCaption", "cta",
    "hashtags", "onScreenText", "carouselSlides", "storyCopy", "coverText",
    "altText", "suggestedDuration", "transitions", "audioStyle", "factsUsed",
  ],
  properties: {
    campaignConcept: { type: "string" },
    hook: { type: "string" },
    headline: { type: "string" },
    caption: { type: "string" },
    shortCaption: { type: "string" },
    cta: { type: "string" },
    hashtags: { type: "array", items: { type: "string" } },
    onScreenText: { type: "array", items: { type: "string" } },
    carouselSlides: { type: "array", items: { type: "string" } },
    storyCopy: { type: "array", items: { type: "string" } },
    coverText: { type: "string" },
    altText: { type: "string" },
    suggestedDuration: { type: "integer", enum: [15, 20, 30, 45, 60] },
    transitions: { type: "array", items: { type: "string", enum: ["fade", "cross_dissolve", "slide", "zoom", "blur"] } },
    audioStyle: { type: "string", enum: ["cinematic", "luxury_lounge", "tropical", "upbeat", "ambient", "architectural", "emotional", "trending_style", "manual_instagram"] },
    factsUsed: { type: "array", items: { type: "string", enum: ["title", "location", "price", "bedrooms", "bathrooms", "carpet_area", "built_up_area", "plot_area", "description", "amenities", "features", "property_type", "development_stage"] } },
  },
} as const

type CreativeOutput = ReturnType<typeof CreativeOutputSchema.parse>

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase())
}

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

function fallbackCreative(input: {
  property: PropertyFactSnapshot
  contentType: MarketingContentType
  settings: MarketingBrandSettings
}) {
  const { property, contentType, settings } = input
  const location = property.location ? ` in ${property.location}` : ""
  const bedroomLine = property.bedrooms ? `${property.bedrooms} bedrooms` : null
  const bathroomLine = property.bathrooms ? `${property.bathrooms} bathrooms` : null
  const details = [bedroomLine, bathroomLine, property.propertyType].filter(Boolean).join(" · ")
  const factSentence = details ? `${details}.` : ""
  const title = property.title
  const cta = settings.preferredCta || "Arrange a private viewing."
  const hashtags = [...settings.defaultHashtags].slice(0, 12)

  return CreativeOutputSchema.parse({
    campaignConcept: `${titleCase(contentType)} for ${title}${location}, with an editorial focus on the property’s available imagery.`,
    hook: `Discover ${title}${location}.`,
    headline: title,
    caption: `${title}${location}. ${factSentence} ${cta}`.replace(/\s+/g, " ").trim(),
    shortCaption: `${title}${location}. ${cta}`,
    cta,
    hashtags,
    onScreenText: [title, details, cta].filter(Boolean),
    carouselSlides: [title, details || "Explore the available details", cta],
    storyCopy: [title, cta],
    coverText: title,
    altText: property.location ? `${title} in ${property.location}.` : title,
    suggestedDuration: contentType === "reel" ? 30 : 15,
    transitions: ["cross_dissolve", "fade"],
    audioStyle: "manual_instagram",
    factsUsed: [
      "title",
      ...(property.location ? ["location"] : []),
      ...(property.bedrooms ? ["bedrooms"] : []),
      ...(property.bathrooms ? ["bathrooms"] : []),
      ...(property.propertyType ? ["property_type"] : []),
    ],
  })
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

export class CreativeAIService {
  static async generate(input: {
    property: PropertyFactSnapshot
    contentType: MarketingContentType
    creativeDirection: CreativeDirection | string
    settings: MarketingBrandSettings
    recentContent?: Array<{ hook?: string | null; headline?: string | null; creativeDirection?: string | null }>
  }): Promise<CreativeOutput> {
    const fallback = fallbackCreative(input)

    if (!process.env.OPENAI_API_KEY) {
      return validateBrandSafety(fallback, input.settings)
    }

    const instructions = [
      "You are the private editorial marketing assistant for a luxury real-estate CRM.",
      "Return only structured JSON matching the supplied schema.",
      "Use only the supplied inventory facts. Never invent amenities, views, ROI, availability, room counts, size, price, location facts, or urgency.",
      "When a fact is absent, omit it. Generic stylistic language is allowed only when it does not imply an unsupported property fact.",
      "Use premium, sophisticated, editorial wording. Avoid cheesy sales language and excessive emojis.",
      `Brand tone: ${input.settings.preferredTone}`,
      input.settings.preferredCta ? `Preferred CTA: ${input.settings.preferredCta}` : "",
      input.settings.excludedWords.length ? `Excluded words: ${input.settings.excludedWords.join(", ")}` : "",
      input.recentContent?.length
        ? `Avoid repeating these recently used hooks/headlines for this property: ${input.recentContent.map(item => item.hook || item.headline).filter(Boolean).join(" | ")}`
        : "",
    ].filter(Boolean).join("\n")

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MARKETING_MODEL ?? "gpt-5.2",
        input: [
          { role: "system", content: instructions },
          {
            role: "user",
            content: JSON.stringify({
              requestedContentType: input.contentType,
              creativeDirection: input.creativeDirection,
              propertyFacts: factLines(input.property),
              defaultHashtags: input.settings.defaultHashtags,
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "marketing_creative",
            strict: true,
            schema: CREATIVE_SCHEMA,
          },
        },
      }),
      signal: AbortSignal.timeout(45_000),
    })

    if (!response.ok) {
      throw new Error(`OpenAI generation failed (${response.status}).`)
    }

    const payload = await response.json() as { output_text?: string }
    if (!payload.output_text) {
      throw new Error("OpenAI did not return creative output.")
    }

    const output = CreativeOutputSchema.parse(JSON.parse(payload.output_text))
    return validateBrandSafety(output, input.settings)
  }
}
