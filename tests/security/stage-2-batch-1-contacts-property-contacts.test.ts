import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const root = process.cwd()
const migrationPath = join(
  root,
  "supabase",
  "migrations",
  "20260819120000_enable_stage_2_batch_1_contacts_property_contacts_rls.sql"
)
const rollbackPath = join(
  root,
  "supabase",
  "security-rollout",
  "rollbacks",
  "20260819120000_enable_stage_2_batch_1_contacts_property_contacts_rls.rollback.sql"
)

describe("Stage 2 Batch 1 contacts/property_contacts RLS migration", () => {
  it("keeps the approved scope, grants, and explicit CRM-user policies", async () => {
    const migration = await readFile(migrationPath, "utf8")

    expect(migration).toContain("alter table public.contacts enable row level security")
    expect(migration).toContain("alter table public.property_contacts enable row level security")
    expect(migration).toMatch(
      /revoke all on table public\.contacts, public\.property_contacts from anon;/
    )
    expect(migration).toMatch(
      /revoke all on table public\.contacts, public\.property_contacts from authenticated;/
    )
    expect(migration).toMatch(
      /grant select, insert, update, delete\s+on table public\.contacts, public\.property_contacts\s+to authenticated;/
    )

    for (const table of ["contacts", "property contacts"]) {
      for (const action of ["select", "insert", "update", "delete"]) {
        expect(migration).toContain(`CRM users ${action} ${table}`)
      }
    }

    expect(migration.match(/public\.is_crm_user\(\)/g)).toHaveLength(10)
    expect(migration).not.toMatch(/for all/i)
    expect(migration).not.toMatch(/using \(true\)/i)
    expect(migration).not.toMatch(/calendar_events|storage\.|commissions|communications_templates/i)
  })

  it("provides a containment rollback that never restores legacy exposure", async () => {
    const rollback = await readFile(rollbackPath, "utf8")

    expect(rollback).toContain('drop policy if exists "CRM users select contacts"')
    expect(rollback).toContain('drop policy if exists "CRM users select property contacts"')
    expect(rollback).toMatch(
      /revoke all on table public\.contacts, public\.property_contacts from authenticated;/
    )
    expect(rollback).not.toMatch(/disable row level security/i)
    expect(rollback).not.toMatch(/grant .*references|grant .*trigger|grant .*truncate/i)
  })
})
