import type { MarketingFormat } from "@/lib/marketing/types"
import { factualValidationErrorDiagnostics } from "@/lib/marketing/fact-contract"

export const CONTENT_GENERATION_TOO_LONG_MESSAGE = "Content generation was too long to complete. Please try again or shorten the creative brief."
export const STORY_COPY_TOO_LONG_MESSAGE = "Story copy was too long to format. Please regenerate the Story copy."
export const INVALID_MARKETING_GENERATION_OUTPUT_MESSAGE = "AI generated an invalid content format. Please try again."

/**
 * Server-only provenance for a Story validation failure. This stays outside
 * the error message so generated copy cannot leak through diagnostics.
 */
export const STORY_GENERATION_VALIDATION_STAGES = [
  "provider_schema",
  "provider_response_received",
  "provider_output_access",
  "provider_parse",
  "generation_result_mapping",
  "factual_validation",
  "overflow_detection",
  "repair_request",
  "repair_parse",
  "normalization",
  "final_renderer_validation",
  "creative_output_validation",
  "persistence_mapping",
  "persistence",
] as const

export type StoryGenerationValidationStage = (typeof STORY_GENERATION_VALIDATION_STAGES)[number]

const storyGenerationErrorStages = new WeakMap<object, StoryGenerationValidationStage>()
// Turbopack can evaluate a server module in more than one compiled chunk. A
// module-local WeakMap alone is therefore not a durable cross-boundary error
// contract. The global symbol stays non-enumerable and never reaches API
// responses, while preserving the stage on the original Error object.
const STORY_GENERATION_STAGE = Symbol.for("the-address-co.marketing.story-generation-stage")

type StageTaggedError = object & {
  [STORY_GENERATION_STAGE]?: StoryGenerationValidationStage
}

const marketingGenerationErrorFormats = new WeakMap<object, MarketingFormat>()
const MARKETING_GENERATION_FORMAT = Symbol.for("the-address-co.marketing.generation-format")

type FormatTaggedError = object & {
  [MARKETING_GENERATION_FORMAT]?: MarketingFormat
}

export function tagStoryGenerationError(error: unknown, stage: StoryGenerationValidationStage) {
  if (error && typeof error === "object") {
    storyGenerationErrorStages.set(error, stage)
    try {
      Object.defineProperty(error, STORY_GENERATION_STAGE, {
        configurable: true,
        enumerable: false,
        value: stage,
        writable: true,
      })
    } catch {
      // A frozen third-party error can still retain local provenance through
      // the WeakMap above. Never let diagnostics change the original failure.
    }
  }
  return error
}

export function storyGenerationErrorStage(error: unknown) {
  if (!error || typeof error !== "object") return null
  const tagged = error as StageTaggedError
  return tagged[STORY_GENERATION_STAGE] ?? storyGenerationErrorStages.get(error) ?? null
}

/** Keeps format-specific user-safe error mapping available across worker boundaries. */
export function tagMarketingGenerationErrorFormat(error: unknown, format: MarketingFormat) {
  if (error && typeof error === "object") {
    marketingGenerationErrorFormats.set(error, format)
    try {
      Object.defineProperty(error, MARKETING_GENERATION_FORMAT, {
        configurable: true,
        enumerable: false,
        value: format,
        writable: true,
      })
    } catch {
      // Frozen provider errors retain in-process provenance via the WeakMap.
    }
  }
  return error
}

export function marketingGenerationErrorFormat(error: unknown) {
  if (!error || typeof error !== "object") return null
  const tagged = error as FormatTaggedError
  return tagged[MARKETING_GENERATION_FORMAT] ?? marketingGenerationErrorFormats.get(error) ?? null
}

type ValidationIssue = {
  code?: unknown
  path?: unknown
}

function issuesFromValue(value: unknown): ValidationIssue[] {
  if (!Array.isArray(value)) return []
  return value.filter((issue): issue is ValidationIssue => Boolean(issue) && typeof issue === "object")
}

/**
 * Zod 4 exposes `issues` on the error object, while a serialized error can
 * arrive at a boundary as its JSON `message`. Accept both without ever using
 * the generated output itself as an error diagnostic.
 */
export function marketingGenerationValidationIssues(error: unknown): ValidationIssue[] {
  if (!error || typeof error !== "object") return []
  const candidate = error as { issues?: unknown; message?: unknown }
  const direct = issuesFromValue(candidate.issues)
  if (direct.length) return direct
  if (typeof candidate.message !== "string") return []

  try {
    return issuesFromValue(JSON.parse(candidate.message))
  } catch {
    return []
  }
}

export function boundedStoryLengthValidationFields(error: unknown) {
  const issues = marketingGenerationValidationIssues(error)
  if (!issues.length) return []

  const fields: string[] = []
  for (const issue of issues) {
    if (issue.code !== "too_big" || !Array.isArray(issue.path)) return []
    const path = issue.path.map(String)
    const storyPath = path[0] === "storyCopy" ? path.slice(1) : path
    if (!['headline', 'supportingLine', 'highlights', 'priceLine', 'cta'].includes(storyPath[0] ?? "")) return []
    fields.push(storyPath.join("."))
  }
  return fields
}

function errorName(error: unknown) {
  return error && typeof error === "object" && typeof (error as { name?: unknown }).name === "string"
    ? (error as { name: string }).name
    : "UnknownError"
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : ""
}

function applicationStackFrames(error: unknown) {
  if (!(error instanceof Error) || typeof error.stack !== "string") return []

  return error.stack
    .split("\n")
    .map(line => line.match(/(?:app|lib)\/[A-Za-z0-9_./\[\]-]+:\d+(?::\d+)?/)?.[0] ?? null)
    .filter((frame): frame is string => Boolean(frame))
    .slice(0, 3)
}

function isKnownInvalidStructuredOutput(message: string) {
  return [
    "OpenAI structured output could not be parsed.",
    "OpenAI structured Story copy could not be parsed.",
  ].includes(message)
}

/** User-safe mapping for the Marketing generation API and persisted job errors. */
export function safeMarketingGenerationErrorMessage(error: unknown, format?: MarketingFormat | null) {
  const message = errorMessage(error)
  const storyGeneration = format === undefined || format === null || format === "story"
  if (!storyGeneration && message === STORY_COPY_TOO_LONG_MESSAGE) {
    return INVALID_MARKETING_GENERATION_OUTPUT_MESSAGE
  }
  if (storyGeneration && (message === STORY_COPY_TOO_LONG_MESSAGE || boundedStoryLengthValidationFields(error).length)) {
    return STORY_COPY_TOO_LONG_MESSAGE
  }
  if (marketingGenerationValidationIssues(error).length || errorName(error) === "ZodError" || isKnownInvalidStructuredOutput(message)) {
    return INVALID_MARKETING_GENERATION_OUTPUT_MESSAGE
  }
  return message || "AI copy generation failed."
}

/** Metadata-only diagnostics that are safe to retain in server logs. */
export function marketingGenerationErrorDiagnostics(error: unknown) {
  const issues = marketingGenerationValidationIssues(error)
  const storyFields = boundedStoryLengthValidationFields(error)
  const stackFrames = applicationStackFrames(error)
  return {
    stage: storyGenerationErrorStage(error),
    name: errorName(error),
    validation: issues.length > 0 || errorName(error) === "ZodError",
    issueCount: issues.length,
    issueCodes: [...new Set(issues.map(issue => typeof issue.code === "string" ? issue.code : "unknown"))],
    issuePaths: [...new Set(issues.map(issue => Array.isArray(issue.path) ? issue.path.map(String).join(".") : "unknown"))],
    storyLengthFields: storyFields,
    topApplicationStackFrame: stackFrames[0] ?? null,
    applicationStackFrames: stackFrames,
    ...factualValidationErrorDiagnostics(error),
  }
}
