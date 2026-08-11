type DatabaseErrorShape = {
  code?: unknown
  message?: unknown
  details?: unknown
  hint?: unknown
}

const MAX_DATABASE_ERROR_TEXT_LENGTH = 500
const SAFE_EXTERNAL_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,179}$/

function sanitizeDatabaseText(value: unknown) {
  if (typeof value !== "string") return undefined

  const sanitized = value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/https?:\/\/[^\s'"`)}\]]+/gi, "[redacted-url]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
    .replace(
      /\b(HOUSING_INVENTORY_API_KEY|SUPABASE_SERVICE_ROLE_KEY|authorization)(\s*[=:])\s*[^\s,;]+/gi,
      (_match, name: string, separator: string) => `${name}${separator}[redacted]`
    )
    .replace(/\bKey\s*\([^)]*\)\s*=\s*\([^)]*\)/gi, "Key ([redacted])=([redacted])")
    .replace(/\b(Token|Value|Input)\s+(["'])[^"']*\2/gi, "$1 [redacted]")
    // Database error text can include a rejected JSON value. Never retain it in logs.
    .replace(/[\[{][\s\S]*[\]}]/g, "[redacted-structured-value]")
    .trim()

  return sanitized ? sanitized.slice(0, MAX_DATABASE_ERROR_TEXT_LENGTH) : undefined
}

function sanitizeDatabaseCode(value: unknown) {
  if (typeof value !== "string") return undefined
  return /^[A-Z0-9]{3,12}$/i.test(value) ? value : undefined
}

function safeExternalId(externalId: string | undefined) {
  return externalId && SAFE_EXTERNAL_ID.test(externalId) ? externalId : undefined
}

export function logHousingInventoryPersistenceError(input: {
  requestId: string
  externalId?: string
  error: unknown
  stage?: "persistence" | "validation"
}) {
  const databaseError = (input.error && typeof input.error === "object" ? input.error : {}) as DatabaseErrorShape
  const entry = {
    requestId: input.requestId,
    stage: input.stage ?? "persistence",
    status: "failed",
    db_code: sanitizeDatabaseCode(databaseError.code),
    message: sanitizeDatabaseText(databaseError.message),
    details: sanitizeDatabaseText(databaseError.details),
    hint: sanitizeDatabaseText(databaseError.hint),
    external_id: safeExternalId(input.externalId),
  }

  console.error("[housing-inventory]", Object.fromEntries(
    Object.entries(entry).filter(([, value]) => value !== undefined)
  ))
}
