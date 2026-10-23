import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const root = process.cwd()
const migrationPath = join(
  root,
  "supabase",
  "migrations",
  "20261022051800_crm_access_revocation_bypass_closure.sql"
)
const rollbackPath = join(
  root,
  "supabase",
  "security-rollout",
  "rollbacks",
  "20261022051800_crm_access_revocation_bypass_closure.rollback.sql"
)

function functionBlock(migration: string, functionName: string) {
  const match = migration.match(
    new RegExp(
      `create or replace function public\\.${functionName}\\([\\s\\S]*?\\n\\$\\$;`,
      "i"
    )
  )

  expect(match, `Missing ${functionName} definition`).not.toBeNull()
  return match?.[0] ?? ""
}

describe("CRM access-revocation bypass closure migration", () => {
  it("requires the central active-CRM helper for privileged CRM RPCs", async () => {
    const migration = await readFile(migrationPath, "utf8")
    const createProperty = functionBlock(migration, "create_property_for_user")
    const transitionDeal = functionBlock(migration, "transition_deal_stage")

    for (const block of [createProperty, transitionDeal]) {
      expect(block).toContain("if not public.is_crm_user() then")
      expect(block).not.toContain("not exists (select 1 from public.user_profiles where id = auth.uid())")
      expect(block).toContain("security definer")
      expect(block).toContain("set search_path = public, pg_temp")
    }

    expect(migration).toContain("revoke all on function public.create_property_for_user(jsonb, uuid) from public, anon;")
    expect(migration).toContain("grant execute on function public.create_property_for_user(jsonb, uuid) to authenticated, service_role;")
    expect(migration).toContain("revoke all on function public.transition_deal_stage(uuid, text) from public, anon;")
    expect(migration).toContain("grant execute on function public.transition_deal_stage(uuid, text) to authenticated, service_role;")
  })

  it("makes Marketing administration active-admin-only and closes the service integration RPC to browser roles", async () => {
    const migration = await readFile(migrationPath, "utf8")
    const marketingAdmin = functionBlock(migration, "is_marketing_admin")

    expect(marketingAdmin).toContain("select public.is_crm_user()")
    expect(marketingAdmin).toContain("and role = 'admin'")
    expect(marketingAdmin).toContain("security definer")
    expect(marketingAdmin).toContain("set search_path = public, pg_temp")
    expect(migration).toContain("revoke all on function public.is_marketing_admin() from public, anon;")
    expect(migration).toContain("grant execute on function public.is_marketing_admin() to authenticated, service_role;")
    expect(migration).toContain(
      "revoke all on function public.upsert_housing_inventory_submission(text, jsonb, text, text, jsonb)"
    )
    expect(migration).toContain("from public, anon, authenticated;")
    expect(migration).toContain(
      "grant execute on function public.upsert_housing_inventory_submission(text, jsonb, text, text, jsonb)"
    )
    expect(migration).toContain("to service_role;")
  })

  it("keeps every application-callable Marketing mutator behind the now active-aware helper", async () => {
    const sourceFiles = [
      "20260810130000_queue_marketing_reel_render.sql",
      "20260810150000_add_reel_versions_brand_assets_and_scheduled_controls.sql",
      "20260810160000_fix_scheduled_content_rpc_ambiguity.sql",
      "20260811120000_make_marketing_scheduling_atomic.sql",
      "20260811130000_harden_marketing_approval_and_job_recovery.sql",
      "20260811150000_update_marketing_carousel_media_atomically.sql",
      "20260818120000_harden_image_only_carousels_and_publication_recovery.sql",
    ]

    const sources = await Promise.all(
      sourceFiles.map((file) => readFile(join(root, "supabase", "migrations", file), "utf8"))
    )
    const definitions = sources.join("\n")

    for (const rpc of [
      "queue_marketing_reel_render",
      "manage_scheduled_marketing_content",
      "schedule_marketing_content",
      "apply_marketing_approval",
      "queue_marketing_reel_version_render",
      "recover_marketing_publication",
      "create_marketing_reel_version",
      "update_marketing_carousel_media",
    ]) {
      const block = definitions.match(
        new RegExp(`create or replace function public\\.${rpc}\\([\\s\\S]*?\\n\\$\\$;`, "i")
      )?.[0] ?? ""

      expect(block, `Missing ${rpc} definition`).toContain("public.is_marketing_admin()")
    }
  })

  it("adds active-CRM RLS to the remaining direct authenticated CRM tables", async () => {
    const migration = await readFile(migrationPath, "utf8")

    for (const table of [
      "communications_templates",
      "company_settings",
      "property_commissions",
    ]) {
      expect(migration).toContain(`alter table public.${table} enable row level security;`)

      for (const action of ["create", "view", "update", "delete"]) {
        expect(migration).toContain(`CRM users ${action} ${table.replace("_", " ")}`)
      }
    }

    expect(migration).toContain("from public, anon, authenticated;")
    expect(migration).toMatch(/public\.is_crm_user\(\)/)
  })

  it("keeps public object behavior while requiring active CRM access for Storage API paths", async () => {
    const migration = await readFile(migrationPath, "utf8")

    for (const policy of [
      "CRM users upload property images",
      "CRM users delete property images",
      "CRM users read property documents",
      "CRM users upload property documents",
      "CRM users delete property documents",
    ]) {
      expect(migration).toContain(`create policy "${policy}"`)
    }

    expect(migration).toContain("bucket_id = 'property-images' and public.is_crm_user()")
    expect(migration).toContain("bucket_id = 'property-documents' and public.is_crm_user()")
    expect(migration).not.toContain("storage.buckets")
    expect(migration).not.toContain("Allow public viewing of property images")
  })

  it("provides an explicit incident-only rollback for the original function, table, and Storage states", async () => {
    const rollback = await readFile(rollbackPath, "utf8")

    expect(rollback).toContain("INCIDENT ROLLBACK ONLY")
    expect(rollback).toContain("deliberately outside supabase/migrations")
    expect(rollback).toContain("where id = auth.uid() and role = 'admin'")
    expect(rollback).toContain("grant execute on function public.upsert_housing_inventory_submission(text, jsonb, text, text, jsonb)")
    expect(rollback).toContain("to anon, authenticated, service_role;")
    expect(rollback).toContain("alter table public.communications_templates disable row level security;")
    expect(rollback).toContain("alter table public.company_settings disable row level security;")
    expect(rollback).toContain("alter table public.property_commissions disable row level security;")
    expect(rollback).toContain("Allow authenticated document reads")
    expect(rollback).toContain("Allow authenticated users to upload property images")
  })
})
