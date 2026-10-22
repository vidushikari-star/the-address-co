import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const root = process.cwd()
const migrationPath = join(root, "supabase", "migrations", "20261022034642_crm_access_revocation_barrier.sql")
const rollbackPath = join(root, "supabase", "security-rollout", "rollbacks", "20261022034642_crm_access_revocation_barrier.rollback.sql")

const privateCrmTables = [
  "commissions",
  "commission_distributions",
  "expenses",
  "profiles",
  "property_documents",
]

const existingRlsTables = ["tasks", "notes", "property_shares"]

describe("CRM access revocation migration", () => {
  it("adds a default-active canonical access state without targeting individual users", async () => {
    const migration = await readFile(migrationPath, "utf8")

    expect(migration).toContain("add column is_active boolean not null default true")
    expect(migration).not.toContain("9cd82d14-2ea2-4a57-a18b-5222a590b417")
    expect(migration).not.toContain("4d490fdf-c842-492f-9d68-3c11e0718af9")
    expect(migration).not.toContain("5a1cd0bc-e9db-430b-890e-bef393cf104b")
  })

  it("makes is_crm_user true only for active authenticated profiles and preserves its secure execution model", async () => {
    const migration = await readFile(migrationPath, "utf8")

    expect(migration).toContain("auth.uid() is not null")
    expect(migration).toContain("where id = auth.uid()")
    expect(migration).toContain("and is_active = true")
    expect(migration).toContain("security definer")
    expect(migration).toContain("set search_path = public, pg_temp")
    expect(migration).toContain("alter function public.is_crm_user() owner to postgres;")
    expect(migration).toContain("revoke all on function public.is_crm_user() from public, anon;")
    expect(migration).toContain("grant execute on function public.is_crm_user() to authenticated, service_role;")
  })

  it("uses the active CRM barrier for every replacement and newly enabled authenticated policy", async () => {
    const migration = await readFile(migrationPath, "utf8")

    for (const table of [...existingRlsTables, ...privateCrmTables, "property_images"]) {
      expect(migration).toContain(`public.${table}`)
    }

    expect(migration).toContain("revoke all on table public.tasks, public.notes, public.property_shares from anon;")
    expect(migration.match(/public\.is_crm_user\(\)/g)?.length).toBeGreaterThanOrEqual(35)
    expect(migration).toContain("alter table public.commissions enable row level security;")
    expect(migration).toContain("alter table public.commission_distributions enable row level security;")
    expect(migration).toContain("alter table public.expenses enable row level security;")
    expect(migration).toContain("alter table public.profiles enable row level security;")
    expect(migration).toContain("alter table public.property_documents enable row level security;")
  })

  it("preserves only the intentional anonymous property-image read exception", async () => {
    const migration = await readFile(migrationPath, "utf8")

    expect(migration).toContain("grant select on table public.property_images to anon;")
    expect(migration).toContain('create policy "Public users view property images"')
    expect(migration).toContain("on public.property_images for select to anon")
    expect(migration).not.toMatch(/on public\.(tasks|notes|property_shares|commissions|commission_distributions|expenses|profiles|property_documents) for [\s\S]{0,90} to anon/)
  })

  it("has a reviewed rollback outside the migration chain", async () => {
    const rollback = await readFile(rollbackPath, "utf8")

    expect(rollback).toContain("INCIDENT ROLLBACK ONLY")
    expect(rollback).toContain("deliberately outside supabase/migrations")
    expect(rollback).toContain("alter table public.user_profiles drop column if exists is_active;")
    expect(rollback).toContain("where id = auth.uid()")
    expect(rollback).not.toContain("and is_active = true")
  })
})
