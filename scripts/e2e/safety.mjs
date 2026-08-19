import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const requiredKeys = [
  "E2E_SUPABASE_URL",
  "E2E_SUPABASE_PROJECT_REF",
  "E2E_EXPECTED_PROJECT_NAME",
  "E2E_SUPABASE_MANAGEMENT_TOKEN",
  "E2E_SUPABASE_ANON_KEY",
  "E2E_SUPABASE_SERVICE_ROLE_KEY",
  "E2E_BASE_URL",
  "E2E_KNOWN_PRODUCTION_PROJECT_REF",
  "E2E_KNOWN_PRODUCTION_SUPABASE_URL",
  "E2E_KNOWN_PRODUCTION_APP_URL",
  "E2E_ADMIN_EMAIL",
  "E2E_ADMIN_PASSWORD",
  "E2E_SALES_EMAIL",
  "E2E_SALES_PASSWORD",
  "E2E_UNPROFILED_EMAIL",
  "E2E_UNPROFILED_PASSWORD",
]

function fail(message) {
  throw new Error(`E2E safety check failed: ${message}`)
}

function parseEnvFile(contents) {
  const parsed = {}

  for (const rawLine of contents.split(/\r?\n/u)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue

    const separator = line.indexOf("=")
    if (separator <= 0) {
      fail(".env.e2e.local contains an invalid assignment")
    }

    const key = line.slice(0, separator).trim()
    let value = line.slice(separator + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    parsed[key] = value
  }

  return parsed
}

/** Load local-only E2E variables without ever printing their values. */
export function loadE2eEnvironment() {
  const envFile = resolve(process.env.E2E_ENV_FILE ?? ".env.e2e.local")

  let entries
  try {
    entries = parseEnvFile(readFileSync(envFile, "utf8"))
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      fail("missing .env.e2e.local (copy .env.e2e.example and populate it locally)")
    }
    throw error
  }

  for (const [key, value] of Object.entries(entries)) {
    if (process.env[key] === undefined) process.env[key] = value
  }

  return process.env
}

function parseUrl(value, label) {
  try {
    return new URL(value)
  } catch {
    fail(`${label} is not a valid absolute URL`)
  }
}

function isClearlySafeAppHost(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    /(?:^|[-.])(e2e|test|staging|disposable)(?:[-.]|$)/iu.test(hostname)
  )
}

function supabaseProjectRef(url) {
  const match = /^https:\/\/([a-z0-9]{20})\.supabase\.co\/?$/iu.exec(url.toString())
  return match?.[1] ?? null
}

/**
 * Refuses destructive E2E work unless an authenticated Supabase Management
 * API response proves the configured target is the named non-production
 * project. This validation intentionally fails closed on any network or API
 * error and never logs credentials or response bodies.
 */
export async function assertDisposableE2eTarget(env = process.env) {
  if (env.E2E_ALLOW_DESTRUCTIVE_TESTS !== "true") {
    fail("E2E_ALLOW_DESTRUCTIVE_TESTS must be exactly true")
  }

  for (const key of requiredKeys) {
    if (!env[key]?.trim()) fail(`${key} is required`)
  }

  const targetSupabaseUrl = parseUrl(env.E2E_SUPABASE_URL, "E2E_SUPABASE_URL")
  const productionSupabaseUrl = parseUrl(
    env.E2E_KNOWN_PRODUCTION_SUPABASE_URL,
    "E2E_KNOWN_PRODUCTION_SUPABASE_URL"
  )
  const targetAppUrl = parseUrl(env.E2E_BASE_URL, "E2E_BASE_URL")
  const productionAppUrl = parseUrl(
    env.E2E_KNOWN_PRODUCTION_APP_URL,
    "E2E_KNOWN_PRODUCTION_APP_URL"
  )

  const targetRef = supabaseProjectRef(targetSupabaseUrl)
  if (!targetRef || targetRef !== env.E2E_SUPABASE_PROJECT_REF) {
    fail("E2E_SUPABASE_URL does not identify E2E_SUPABASE_PROJECT_REF")
  }
  if (targetRef === env.E2E_KNOWN_PRODUCTION_PROJECT_REF) {
    fail("configured project ref is the known production project")
  }
  if (targetSupabaseUrl.origin === productionSupabaseUrl.origin) {
    fail("configured Supabase URL is the known production Supabase URL")
  }
  if (targetAppUrl.origin === productionAppUrl.origin) {
    fail("configured app URL is the known production app URL")
  }
  if (!isClearlySafeAppHost(targetAppUrl.hostname)) {
    fail("E2E_BASE_URL must be local or visibly named as an e2e/test/staging/disposable host")
  }

  let response
  try {
    response = await fetch(`https://api.supabase.com/v1/projects/${targetRef}`, {
      headers: { Authorization: `Bearer ${env.E2E_SUPABASE_MANAGEMENT_TOKEN}` },
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    fail("could not verify the target project with the Supabase Management API")
  }

  if (!response.ok) {
    fail("Supabase Management API did not authorize target-project verification")
  }

  let project
  try {
    project = await response.json()
  } catch {
    fail("Supabase Management API returned an unreadable project record")
  }

  if (project?.ref !== targetRef) {
    fail("Supabase Management API project ref differs from the configured ref")
  }
  if (project?.name !== env.E2E_EXPECTED_PROJECT_NAME) {
    fail("Supabase Management API project name differs from E2E_EXPECTED_PROJECT_NAME")
  }
  if (!/(e2e|test|staging|disposable)/iu.test(project.name)) {
    fail("verified project name is not explicitly marked e2e, test, staging, or disposable")
  }

  return { projectRef: targetRef, projectName: project.name }
}
