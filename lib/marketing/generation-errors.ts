export const CONTENT_GENERATION_TOO_LONG_MESSAGE = "Content generation was too long to complete. Please try again or shorten the creative brief."
export const STORY_COPY_TOO_LONG_MESSAGE = "Story copy was too long to format. Please regenerate the Story copy."
export const INVALID_MARKETING_GENERATION_OUTPUT_MESSAGE = "AI generated an invalid content format. Please try again."

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

function isKnownInvalidStructuredOutput(message: string) {
  return [
    "OpenAI structured output could not be parsed.",
    "OpenAI structured Story copy could not be parsed.",
  ].includes(message)
}

/** User-safe mapping for the Marketing generation API and persisted job errors. */
export function safeMarketingGenerationErrorMessage(error: unknown) {
  const message = errorMessage(error)
  if (message === STORY_COPY_TOO_LONG_MESSAGE || boundedStoryLengthValidationFields(error).length) {
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
  return {
    name: errorName(error),
    validation: issues.length > 0 || errorName(error) === "ZodError",
    issueCount: issues.length,
    issueCodes: [...new Set(issues.map(issue => typeof issue.code === "string" ? issue.code : "unknown"))],
    issuePaths: [...new Set(issues.map(issue => Array.isArray(issue.path) ? issue.path.map(String).join(".") : "unknown"))],
    storyLengthFields: storyFields,
  }
}
