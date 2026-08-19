import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"

import { createClient } from "@supabase/supabase-js"

import { getE2eEnvironment } from "./env"

const MANIFEST_ROOT = resolve("test-results/e2e-fixtures")

export type FixtureRecord = {
  table: string
  id: string
}

export type StorageFixture = {
  bucket: string
  path: string
}

export type FixtureManifest = {
  version: 1
  runId: string
  records: FixtureRecord[]
  storage: StorageFixture[]
}

function manifestPath(runId: string) {
  if (!/^[a-z0-9-]{6,80}$/iu.test(runId)) {
    throw new Error("E2E fixture run ID has an unsafe format")
  }
  return resolve(MANIFEST_ROOT, `${runId}.json`)
}

function uniqueRecord(records: FixtureRecord[]) {
  return [...new Map(records.map((record) => [`${record.table}:${record.id}`, record])).values()]
}

function uniqueStorage(storage: StorageFixture[]) {
  return [...new Map(storage.map((item) => [`${item.bucket}:${item.path}`, item])).values()]
}

export class FixtureRegistry {
  readonly manifest: FixtureManifest

  constructor(runId = getE2eEnvironment().runId) {
    this.manifest = { version: 1, runId, records: [], storage: [] }
  }

  label(kind: string) {
    if (!/^[a-z0-9-]+$/iu.test(kind)) throw new Error("E2E fixture label kind has an unsafe format")
    return `E2E:${this.manifest.runId}:${kind}`
  }

  addRecord(table: string, id: string) {
    if (!/^[a-z_]+$/u.test(table) || !/^[a-f0-9-]{36}$/iu.test(id)) {
      throw new Error("E2E fixture record identifier has an unsafe format")
    }
    this.manifest.records = uniqueRecord([...this.manifest.records, { table, id }])
  }

  addStorage(bucket: string, path: string) {
    if (!/^[a-z0-9-]+$/iu.test(bucket) || !path || path.startsWith("/") || path.includes("..")) {
      throw new Error("E2E fixture storage path has an unsafe format")
    }
    this.manifest.storage = uniqueStorage([...this.manifest.storage, { bucket, path }])
  }

  async persist() {
    const path = manifestPath(this.manifest.runId)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, `${JSON.stringify(this.manifest, null, 2)}\n`, "utf8")
    return path
  }

  async cleanup() {
    await cleanupFixtureManifest(this.manifest)
    await rm(manifestPath(this.manifest.runId), { force: true })
  }
}

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

function client() {
  const environment = getE2eEnvironment()
  return createClient(environment.supabaseUrl, environment.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Deletes only IDs and object paths recorded for this exact test run. */
export async function cleanupFixtureManifest(manifest: FixtureManifest) {
  const supabase = client()
  const recordedByTable = new Map<string, string[]>()
  for (const record of manifest.records) {
    const ids = recordedByTable.get(record.table) ?? []
    recordedByTable.set(record.table, [...ids, record.id])
  }

  for (const table of deletionOrder) {
    const ids = recordedByTable.get(table)
    if (!ids?.length) continue
    const { error } = await supabase.from(table).delete().in("id", ids)
    if (error) throw new Error(`Unable to clean up exact E2E fixtures in ${table}`)
  }

  for (const object of manifest.storage) {
    const { error } = await supabase.storage.from(object.bucket).remove([object.path])
    if (error) throw new Error(`Unable to clean up an exact E2E storage fixture in ${object.bucket}`)
  }
}

export async function readFixtureManifest(runId: string): Promise<FixtureManifest> {
  const contents = await readFile(manifestPath(runId), "utf8")
  const manifest = JSON.parse(contents) as FixtureManifest
  if (manifest.version !== 1 || manifest.runId !== runId || !Array.isArray(manifest.records) || !Array.isArray(manifest.storage)) {
    throw new Error("E2E fixture manifest is invalid")
  }
  return manifest
}
