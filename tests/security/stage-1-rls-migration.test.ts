import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const root = process.cwd()
const migrationPath = join(root, "supabase", "migrations", "20260812090000_stage_1_remove_anonymous_crm_access.sql")
const rollbackPath = join(root, "supabase", "security-rollout", "rollbacks", "20260812090000_stage_1_remove_anonymous_crm_access.rollback.sql")

const revokedTables = [
  "activities",
  "calendar_events",
  "commission_distributions",
  "commissions",
  "communications_templates",
  "company_settings",
  "contacts",
  "deals",
  "expenses",
  "profiles",
  "properties",
  "property_commissions",
  "property_contacts",
  "property_documents",
  "site_visits",
  "user_profiles",
]

describe("Stage 1 anonymous CRM hardening", () => {
  it("keeps the executable change monotonic and its incident rollback outside the migration chain", async () => {
    const [migration, rollback] = await Promise.all([
      readFile(migrationPath, "utf8"),
      readFile(rollbackPath, "utf8"),
    ])

    expect(migration).toContain("begin;")
    expect(migration).toContain("commit;")
    expect(rollback).toContain("INCIDENT ROLLBACK ONLY")
    expect(rollback).toContain("deliberately outside supabase/migrations")
  })

  it("removes anon policies/grants while preserving authenticated CRM policies", async () => {
    const migration = await readFile(migrationPath, "utf8")

    expect(migration).toContain("create or replace function public.is_crm_user()")
    expect(migration).toContain("revoke all on function public.is_crm_user() from public, anon;")
    expect(migration).toContain("grant execute on function public.is_crm_user() to authenticated, service_role;")
    expect(migration).toContain("drop policy if exists \"Allow anonymous commission insert\" on public.commissions;")

    for (const table of ["activities", "deals", "properties", "site_visits", "user_profiles"]) {
      expect(migration).toContain(`public.${table}`)
      expect(migration).toContain("public.is_crm_user()")
    }

    expect(migration).toContain("from anon;")
    expect(migration).not.toMatch(/create policy\s+[\s\S]+?\bto\s+anon\b/i)
    expect(migration).not.toMatch(/\bfor\s+all\s+to\s+public\b/i)
  })

  it("revokes every confirmed Stage 1 anon table grant and preserves only property-images reads", async () => {
    const migration = await readFile(migrationPath, "utf8")
    const revokeBlock = migration.match(/revoke all on table[\s\S]+?from anon;/i)?.[0] ?? ""

    for (const table of revokedTables) {
      expect(revokeBlock).toContain(`public.${table}`)
    }

    expect(revokeBlock).not.toContain("public.property_images")
    expect(migration).toContain("revoke insert, update, delete, truncate, references, trigger")
    expect(migration).toContain("on table public.property_images")
    expect(migration).not.toMatch(/storage\.buckets|storage\.objects/i)
    expect(migration).not.toMatch(/alter table public\.(contacts|commissions|property_documents|property_contacts|property_commissions|property_images) enable row level security/i)
  })

  it("has a rollback that restores each grant and the exact previous broad policies", async () => {
    const rollback = await readFile(rollbackPath, "utf8")
    const grantBlock = rollback.match(/grant all privileges on table[\s\S]+?to anon;/i)?.[0] ?? ""

    for (const table of revokedTables) {
      expect(grantBlock).toContain(`public.${table}`)
    }

    expect(rollback).toContain('create policy "Allow public property reads"')
    expect(rollback).toContain('create policy "Allow public deal reads"')
    expect(rollback).toContain('create policy "Allow public view activities"')
    expect(rollback).toContain('create policy "Allow authenticated users"')
    expect(rollback).toContain('create policy "Allow public read profiles"')
    expect(rollback).toContain("drop function if exists public.is_crm_user();")
    expect(rollback).toContain("grant insert, update, delete, truncate, references, trigger")
    expect(rollback).toContain("on table public.property_images")
  })
})
