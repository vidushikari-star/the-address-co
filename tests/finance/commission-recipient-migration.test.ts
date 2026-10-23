import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const migrationPath = join(process.cwd(), "supabase", "migrations", "20261023040532_add_commission_recipients_and_financial_integrity.sql")
const rollbackPath = join(process.cwd(), "supabase", "security-rollout", "rollbacks", "20261023040532_add_commission_recipients_and_financial_integrity.rollback.sql")

describe("commission recipient migration", () => {
  it("is additive, preserves CRM user distributions and enforces one recipient identity", async () => {
    const migration = await readFile(migrationPath, "utf8")
    expect(migration).toContain("create table if not exists public.commission_recipients")
    expect(migration).toContain("recipient_kind text not null default 'crm_user'")
    expect(migration).toContain("external_recipient_id uuid")
    expect(migration).toContain("commission_distributions_exactly_one_recipient_check")
    expect(migration).toContain("recipient_kind = 'crm_user' and user_id is not null")
    expect(migration).toContain("recipient_kind = 'external' and user_id is null")
    expect(migration).not.toContain("auth.users")
    expect(migration).not.toMatch(/update\s+public\.commission_distributions/i)
  })

  it("provides database validation for active recipients, amounts, percentages, duplicates and aggregate allocation", async () => {
    const migration = await readFile(migrationPath, "utf8")
    expect(migration).toContain("commission_distributions_nonnegative_amount_check")
    expect(migration).toContain("commission_distributions_percentage_range_check")
    expect(migration).toContain("commission_distributions_unique_crm_recipient")
    expect(migration).toContain("commission_distributions_unique_external_recipient")
    expect(migration).toContain("enforce_commission_distribution_recipient")
    expect(migration).toContain("and is_active = true")
    expect(migration).toContain("enforce_commission_distribution_total")
    expect(migration).toContain("cannot exceed the parent commission amount")
    expect(migration).not.toContain("security definer")
  })

  it("requires active CRM authorization for external recipients, denies anon and retains service-role access", async () => {
    const migration = await readFile(migrationPath, "utf8")
    expect(migration).toContain("alter table public.commission_recipients enable row level security")
    expect(migration.match(/to authenticated/g)?.length).toBeGreaterThanOrEqual(4)
    expect(migration).toContain("public.is_crm_user()")
    expect(migration).toContain("revoke all on table public.commission_recipients from public, anon, authenticated")
    expect(migration).toContain("grant all on table public.commission_recipients to service_role")
  })

  it("has a local rollback and does not touch historical financial records", async () => {
    const [migration, rollback] = await Promise.all([readFile(migrationPath, "utf8"), readFile(rollbackPath, "utf8")])
    expect(migration).not.toMatch(/\bdelete\s+from\s+public\.(commissions|expenses|commission_distributions)/i)
    expect(migration).toMatch(/^--[\s\S]*?\bbegin;/i)
    expect(migration.trim()).toMatch(/commit;$/i)
    expect(rollback).toContain("commission_recipients")
    expect(rollback).toContain("enforce_commission_distribution_total")
  })
})
