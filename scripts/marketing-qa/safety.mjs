import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const REQUIRED_KEYS = [
  "MARKETING_QA_SUPABASE_URL",
  "MARKETING_QA_SUPABASE_PROJECT_REF",
  "MARKETING_QA_EXPECTED_PROJECT_NAME",
  "MARKETING_QA_SUPABASE_MANAGEMENT_TOKEN",
  "MARKETING_QA_SUPABASE_ANON_KEY",
  "MARKETING_QA_SUPABASE_SERVICE_ROLE_KEY",
  "MARKETING_QA_BASE_URL",
  "MARKETING_QA_KNOWN_PRODUCTION_PROJECT_REF",
  "MARKETING_QA_KNOWN_PRODUCTION_SUPABASE_URL",
  "MARKETING_QA_KNOWN_PRODUCTION_APP_URL",
  "MARKETING_QA_ADMIN_EMAIL",
  "MARKETING_QA_ADMIN_PASSWORD",
]

function fail(message) {
  throw new Error(`Marketing QA safety check failed: ${message}`)
}

function parseEnvFile(contents) {
  const parsed = {}

  for (const rawLine of contents.split(/\r?\n/u)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue

    const separator = line.indexOf("=")
    if (separator <= 0) fail(".env.marketing-qa.local contains an invalid assignment")

    const key = line.slice(0, separator).trim()
    let value = line.slice(separator + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    parsed[key] = value
  }

  return parsed
}

/** Loads a local-only QA file without printing any value from it. */
export function loadMarketingQaEnvironment() {
  const envFile = resolve(process.env.MARKETING_QA_ENV_FILE ?? ".env.marketing-qa.local")

  let entries
  try {
    entries = parseEnvFile(readFileSync(envFile, "utf8"))
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      fail("missing .env.marketing-qa.local (copy .env.marketing-qa.example and populate verified QA values)")
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

function isSafeQaAppHost(hostname) {
  return hostname === "localhost"
    || hostname === "127.0.0.1"
    || /(?:^|[-.])(qa|e2e|test|staging|disposable)(?:[-.]|$)/iu.test(hostname)
}

function supabaseProjectRef(url) {
  const match = /^https:\/\/([a-z0-9]{20})\.supabase\.co\/?$/iu.exec(url.toString())
  return match?.[1] ?? null
}

async function readJson(response, message) {
  try {
    return await response.json()
  } catch {
    fail(message)
  }
}

async function verifyQaAdmin({ env, targetSupabaseUrl, fetchImpl }) {
  let authResponse
  try {
    authResponse = await fetchImpl(new URL("/auth/v1/token?grant_type=password", targetSupabaseUrl), {
      method: "POST",
      headers: {
        apikey: env.MARKETING_QA_SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: env.MARKETING_QA_ADMIN_EMAIL,
        password: env.MARKETING_QA_ADMIN_PASSWORD,
      }),
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    fail("could not verify the configured QA admin login")
  }
  if (!authResponse.ok) fail("the configured QA admin credentials were rejected")

  const auth = await readJson(authResponse, "the QA auth service returned an unreadable login response")
  const userId = auth?.user?.id
  if (typeof userId !== "string" || !userId) fail("the QA auth response did not contain a user identity")

  let profileResponse
  try {
    profileResponse = await fetchImpl(new URL(`/rest/v1/user_profiles?id=eq.${encodeURIComponent(userId)}&select=role`, targetSupabaseUrl), {
      headers: {
        apikey: env.MARKETING_QA_SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.MARKETING_QA_SUPABASE_SERVICE_ROLE_KEY}`,
      },
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    fail("could not verify the configured QA admin profile")
  }
  if (!profileResponse.ok) fail("the QA admin profile could not be verified")

  const profiles = await readJson(profileResponse, "the QA profile service returned an unreadable response")
  if (!Array.isArray(profiles) || profiles.length !== 1 || profiles[0]?.role !== "admin") {
    fail("the configured QA user is not an admin in the verified QA project")
  }
}

/**
 * Verifies a dedicated Marketing QA target. It has no production override and
 * proves project identity through the Management API before checking login.
 */
export async function assertMarketingQaTarget(env = process.env, { fetchImpl = fetch } = {}) {
  for (const key of REQUIRED_KEYS) {
    if (!env[key]?.trim()) fail(`${key} is required`)
  }
  if (env.MARKETING_QA_ENABLED !== "true") fail("MARKETING_QA_ENABLED must be exactly true")
  if (env.MARKETING_QA_PUBLISHING_ENABLED !== "false") fail("MARKETING_QA_PUBLISHING_ENABLED must be exactly false")
  if (env.MARKETING_QA_SCHEDULING_ENABLED !== "false") fail("MARKETING_QA_SCHEDULING_ENABLED must be exactly false")

  const targetSupabaseUrl = parseUrl(env.MARKETING_QA_SUPABASE_URL, "MARKETING_QA_SUPABASE_URL")
  const productionSupabaseUrl = parseUrl(env.MARKETING_QA_KNOWN_PRODUCTION_SUPABASE_URL, "MARKETING_QA_KNOWN_PRODUCTION_SUPABASE_URL")
  const qaAppUrl = parseUrl(env.MARKETING_QA_BASE_URL, "MARKETING_QA_BASE_URL")
  const productionAppUrl = parseUrl(env.MARKETING_QA_KNOWN_PRODUCTION_APP_URL, "MARKETING_QA_KNOWN_PRODUCTION_APP_URL")
  const targetRef = supabaseProjectRef(targetSupabaseUrl)

  if (!targetRef || targetRef !== env.MARKETING_QA_SUPABASE_PROJECT_REF) {
    fail("MARKETING_QA_SUPABASE_URL does not identify MARKETING_QA_SUPABASE_PROJECT_REF")
  }
  if (targetRef === env.MARKETING_QA_KNOWN_PRODUCTION_PROJECT_REF) fail("configured project ref is the known production project")
  if (targetSupabaseUrl.origin === productionSupabaseUrl.origin) fail("configured Supabase URL is the known production Supabase URL")
  if (qaAppUrl.origin === productionAppUrl.origin) fail("configured app URL is the known production app URL")
  if (!isSafeQaAppHost(qaAppUrl.hostname)) fail("MARKETING_QA_BASE_URL must be local or visibly named qa, e2e, test, staging, or disposable")

  let projectResponse
  try {
    projectResponse = await fetchImpl(`https://api.supabase.com/v1/projects/${targetRef}`, {
      headers: { Authorization: `Bearer ${env.MARKETING_QA_SUPABASE_MANAGEMENT_TOKEN}` },
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    fail("could not verify the target project with the Supabase Management API")
  }
  if (!projectResponse.ok) fail("Supabase Management API did not authorize target-project verification")

  const project = await readJson(projectResponse, "Supabase Management API returned an unreadable project record")
  if (project?.ref !== targetRef) fail("Supabase Management API project ref differs from the configured ref")
  if (project?.name !== env.MARKETING_QA_EXPECTED_PROJECT_NAME) fail("Supabase Management API project name differs from MARKETING_QA_EXPECTED_PROJECT_NAME")
  if (!/(qa|e2e|test|staging|disposable)/iu.test(project.name)) fail("verified project name is not explicitly marked qa, e2e, test, staging, or disposable")

  await verifyQaAdmin({ env, targetSupabaseUrl, fetchImpl })
  return { projectRef: targetRef, projectName: project.name }
}
