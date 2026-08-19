import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { createClient } from "@supabase/supabase-js"

import { assertDisposableE2eTarget, loadE2eEnvironment } from "./safety.mjs"

const manifestRoot = resolve("test-results/e2e-fixtures")
const deletionOrder = [
  "marketing_content_assets",
  "marketing_content_properties",
  "marketing_content",
  "activities",
  "calendar_events",
  "site_visits",
  "deals",
  "property_contacts",
  "property_documents",
  "property_images",
  "property_shares",
  "crm_drafts",
  "contacts",
  "properties",
]

function required(key) {
  const value = process.env[key]?.trim()
  if (!value) throw new Error(`E2E cleanup is missing ${key}`)
  return value
}

function runIdFromArguments() {
  const runIndex = process.argv.indexOf("--run-id")
  const runId = runIndex >= 0 ? process.argv[runIndex + 1] : undefined
  if (!runId || !/^[a-z0-9-]{6,80}$/iu.test(runId)) {
    throw new Error("Usage: npm run test:e2e:cleanup -- --run-id <safe-run-id>")
  }
  return runId
}

function validatedManifest(manifest, runId) {
  if (manifest?.version !== 1 || manifest.runId !== runId || !Array.isArray(manifest.records) || !Array.isArray(manifest.storage)) {
    throw new Error("E2E cleanup manifest is invalid")
  }

  for (const record of manifest.records) {
    if (!deletionOrder.includes(record?.table) || !/^[a-f0-9-]{36}$/iu.test(record?.id ?? "")) {
      throw new Error("E2E cleanup manifest contains an unsafe database record")
    }
  }
  for (const object of manifest.storage) {
    if (
      !/^[a-z0-9-]+$/iu.test(object?.bucket ?? "") ||
      !object?.path ||
      object.path.startsWith("/") ||
      object.path.includes("..")
    ) {
      throw new Error("E2E cleanup manifest contains an unsafe storage object")
    }
  }

  return manifest
}

loadE2eEnvironment()
await assertDisposableE2eTarget()

const runId = runIdFromArguments()
const manifestPath = resolve(manifestRoot, `${runId}.json`)
if (!manifestPath.startsWith(`${manifestRoot}/`)) {
  throw new Error("E2E cleanup manifest path is outside the fixture directory")
}

const manifest = validatedManifest(JSON.parse(await readFile(manifestPath, "utf8")), runId)
const supabase = createClient(required("E2E_SUPABASE_URL"), required("E2E_SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
})

for (const table of deletionOrder) {
  const ids = manifest.records.filter((record) => record.table === table).map((record) => record.id)
  if (!ids.length) continue
  const { error } = await supabase.from(table).delete().in("id", ids)
  if (error) throw new Error(`Unable to clean up exact E2E fixtures in ${table}`)
}

for (const object of manifest.storage) {
  const { error } = await supabase.storage.from(object.bucket).remove([object.path])
  if (error) throw new Error(`Unable to clean up an exact E2E storage fixture in ${object.bucket}`)
}

// Do not delete the manifest automatically: retaining it gives a reviewer an
// exact audit record of the narrowly scoped cleanup that just ran.
