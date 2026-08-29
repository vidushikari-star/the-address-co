import assert from "node:assert/strict"
import test from "node:test"

import { assertMarketingQaTarget } from "./safety.mjs"

function safeEnvironment(overrides = {}) {
  return {
    MARKETING_QA_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
    MARKETING_QA_SUPABASE_PROJECT_REF: "abcdefghijklmnopqrst",
    MARKETING_QA_EXPECTED_PROJECT_NAME: "address-co-marketing-qa",
    MARKETING_QA_SUPABASE_MANAGEMENT_TOKEN: "management-token",
    MARKETING_QA_SUPABASE_ANON_KEY: "anon-key",
    MARKETING_QA_SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    MARKETING_QA_BASE_URL: "http://127.0.0.1:3101",
    MARKETING_QA_KNOWN_PRODUCTION_PROJECT_REF: "zyxwvutsrqponmlkjihg",
    MARKETING_QA_KNOWN_PRODUCTION_SUPABASE_URL: "https://zyxwvutsrqponmlkjihg.supabase.co",
    MARKETING_QA_KNOWN_PRODUCTION_APP_URL: "https://app.addressco.example",
    MARKETING_QA_ADMIN_EMAIL: "qa-admin@example.test",
    MARKETING_QA_ADMIN_PASSWORD: "not-a-real-password",
    MARKETING_QA_ENABLED: "true",
    MARKETING_QA_PUBLISHING_ENABLED: "false",
    MARKETING_QA_SCHEDULING_ENABLED: "false",
    ...overrides,
  }
}

function safeFetch(url) {
  const target = String(url)
  if (target.startsWith("https://api.supabase.com/v1/projects/")) {
    return Promise.resolve({ ok: true, json: async () => ({ ref: "abcdefghijklmnopqrst", name: "address-co-marketing-qa" }) })
  }
  if (target.includes("/auth/v1/token")) {
    return Promise.resolve({ ok: true, json: async () => ({ user: { id: "user-1" } }) })
  }
  if (target.includes("/rest/v1/user_profiles")) {
    return Promise.resolve({ ok: true, json: async () => ([{ role: "admin" }]) })
  }
  throw new Error(`Unexpected verification request: ${target}`)
}

async function rejectsWith(env, message) {
  await assert.rejects(() => assertMarketingQaTarget(env, { fetchImpl: safeFetch }), new RegExp(message))
}

test("safe non-production QA configuration verifies admin access", async () => {
  const result = await assertMarketingQaTarget(safeEnvironment(), { fetchImpl: safeFetch })
  assert.equal(result.projectRef, "abcdefghijklmnopqrst")
})

test("missing project ref fails before any browser can start", async () => {
  await rejectsWith(safeEnvironment({ MARKETING_QA_SUPABASE_PROJECT_REF: "" }), "MARKETING_QA_SUPABASE_PROJECT_REF is required")
})

test("known production project ref is rejected", async () => {
  await rejectsWith(safeEnvironment({ MARKETING_QA_KNOWN_PRODUCTION_PROJECT_REF: "abcdefghijklmnopqrst" }), "known production project")
})

test("known production Supabase URL is rejected", async () => {
  await rejectsWith(safeEnvironment({ MARKETING_QA_KNOWN_PRODUCTION_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co" }), "known production Supabase URL")
})

test("Marketing must be enabled explicitly", async () => {
  await rejectsWith(safeEnvironment({ MARKETING_QA_ENABLED: "false" }), "MARKETING_QA_ENABLED must be exactly true")
})

test("QA admin credentials are required", async () => {
  await rejectsWith(safeEnvironment({ MARKETING_QA_ADMIN_PASSWORD: "" }), "MARKETING_QA_ADMIN_PASSWORD is required")
})

test("publishing and scheduling must remain disabled", async () => {
  await rejectsWith(safeEnvironment({ MARKETING_QA_PUBLISHING_ENABLED: "true" }), "MARKETING_QA_PUBLISHING_ENABLED must be exactly false")
  await rejectsWith(safeEnvironment({ MARKETING_QA_SCHEDULING_ENABLED: "true" }), "MARKETING_QA_SCHEDULING_ENABLED must be exactly false")
})
