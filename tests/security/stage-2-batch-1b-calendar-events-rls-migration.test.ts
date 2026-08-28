import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const root = process.cwd()
const migrationPath = join(
  root,
  "supabase",
  "migrations",
  "20260828120000_enable_stage_2_batch_1b_calendar_events_rls.sql"
)
const rollbackPath = join(
  root,
  "supabase",
  "security-rollout",
  "rollbacks",
  "20260828120000_enable_stage_2_batch_1b_calendar_events_rls.rollback.sql"
)
const verificationPath = join(
  root,
  "supabase",
  "security-rollout",
  "verification",
  "20260828120000_enable_stage_2_batch_1b_calendar_events_rls.verify.sql"
)

describe("Stage 2 Batch 1B calendar_events RLS migration", () => {
  it("keeps shared Calendar scope, CRUD grants, and explicit CRM-user policies", async () => {
    const migration = await readFile(migrationPath, "utf8")

    expect(migration).toContain("begin;")
    expect(migration).toContain("commit;")
    expect(migration).toMatch(
      /revoke all on table public\.calendar_events from anon;/
    )
    expect(migration).toMatch(
      /revoke all on table public\.calendar_events from authenticated;/
    )
    expect(migration).toMatch(
      /grant select, insert, update, delete\s+on table public\.calendar_events\s+to authenticated;/
    )
    expect(migration).toContain(
      "alter table public.calendar_events enable row level security"
    )

    for (const action of ["select", "insert", "update", "delete"]) {
      expect(migration).toContain(`CRM users ${action} calendar events`)
    }

    expect(migration.match(/create policy/g)).toHaveLength(4)
    expect(migration.match(/public\.is_crm_user\(\)/g)).toHaveLength(5)
    expect(migration).not.toMatch(/for all/i)
    expect(migration).not.toMatch(/using\s*\(\s*true\s*\)/i)
    expect(migration).not.toMatch(/with check\s*\(\s*true\s*\)/i)
    expect(migration).not.toMatch(/force row level security/i)
    expect(migration).not.toMatch(
      /alter table public\.calendar_events\s+(?:add|alter|drop)\s+column/i
    )
  })

  it("provides a containment rollback without restoring legacy exposure", async () => {
    const rollback = await readFile(rollbackPath, "utf8")

    for (const action of ["select", "insert", "update", "delete"]) {
      expect(rollback).toContain(
        `drop policy if exists "CRM users ${action} calendar events"`
      )
    }

    expect(rollback).toMatch(
      /revoke all on table public\.calendar_events from authenticated;/
    )
    expect(rollback).not.toMatch(/disable row level security/i)
    expect(rollback).not.toMatch(/\bgrant\s+/i)
    expect(rollback).not.toMatch(/restore.*legacy.*grant/i)
  })

  it("keeps a read-only verification for the approved policy and access shape", async () => {
    const verification = await readFile(verificationPath, "utf8")

    expect(verification).toContain("begin read only;")
    expect(verification).toContain("c.relrowsecurity as rls_enabled")
    expect(verification).toContain("c.relforcerowsecurity as rls_forced")
    expect(verification).toContain("CRM users select calendar events")
    expect(verification).toContain("array['authenticated']::name[]")
    expect(verification).toContain("has_table_privilege(")
    expect(verification).toContain("legacy_site_visit_row_count")
    expect(verification).toContain("commit;")
  })
})
