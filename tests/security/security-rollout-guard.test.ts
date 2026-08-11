import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const root = process.cwd()
const stageDirectory = join(root, "supabase", "security-rollout")

describe("pending Supabase security rollout", () => {
  it("keeps unreviewed security SQL outside the production migration chain", async () => {
    const [staged, migrations] = await Promise.all([
      readdir(stageDirectory),
      readdir(join(root, "supabase", "migrations")),
    ])

    expect(staged).toEqual(expect.arrayContaining([
      "stage-1-remove-anonymous-crm-access.sql",
      "stage-2-sensitive-crm-rls.sql",
      "stage-3-private-property-documents.sql",
      "stage-4-remaining-legacy-access.sql",
    ]))
    expect(migrations.some(file => file.includes("security-rollout") || file.includes("anonymous-crm-access"))).toBe(false)
  })

  it("does not retain anonymous grants in the Stage 1 forward change", async () => {
    const sql = await readFile(join(stageDirectory, "stage-1-remove-anonymous-crm-access.sql"), "utf8")
    const forward = sql.split("-- ROLLBACK", 1)[0]

    expect(forward).not.toMatch(/\bto\s+anon\b/i)
    expect(forward).not.toMatch(/\busing\s*\(\s*true\s*\)/i)
    expect(forward).not.toMatch(/\bwith\s+check\s*\(\s*true\s*\)/i)
  })

  it("does not place server-only secrets in the browser Supabase client", async () => {
    const browserClient = await readFile(join(root, "lib", "supabase", "client.ts"), "utf8")

    expect(browserClient).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY|META_APP_SECRET|MARKETING_CRON_SECRET|HOUSING_INVENTORY_API_KEY/)
  })
})
