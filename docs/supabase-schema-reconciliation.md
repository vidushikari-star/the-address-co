# Supabase schema reconciliation

Audit date: 2026-08-11
Target: linked production project (read-only catalog inspection)
Scope: `public` schema, `storage.buckets`, `storage.objects` policies, migration ledger, and grants relevant to `anon`, `authenticated`, and `service_role`.

## Result

Production has all 14 repository migrations recorded as applied. The historical ledger is aligned, but it is not a complete baseline: 16 of 43 live `public` tables predate the recorded migration history. Two recorded tables also have unrecorded legacy additions.

The reconciliation adds a fresh-environment-only, two-phase baseline outside the production migration chain:

1. `supabase/baseline/pre-migrations-legacy-crm.sql` creates the objects that historical migrations already assume: `user_profiles`, `properties`, and `property_images`.
2. `supabase/baseline/post-migrations-legacy-crm.sql` completes the remaining legacy CRM objects after the normal migration chain.

Neither script was run against production. They do not export or replay production rows. `scripts/bootstrap-supabase-fresh.sh` rejects a target with recorded migrations or pre-existing core CRM tables before it can run either script.

## Migration-chain safety decision

**Recommendation: B — keep the fresh baseline outside `supabase/migrations`.**

The baseline initially used versions `00000000000000` and `20260811150000` in the normal migration directory. Against the linked production ledger, `supabase migration list --linked` showed both as local-only, with `00000000000000` sorting before remote version `001`.

`npx supabase db push --linked --dry-run` then exited with: “Found local migration files to be inserted before the last migration on remote database,” and required `--include-all` for `00000000000000_legacy_crm_prerequisites.sql`. `npx supabase db push --linked --dry-run --include-all` would stage **both** baseline files for production.

That makes normal production migration behavior non-monotonic and invites an unsafe `--include-all`. The scripts now live in `supabase/baseline/`, so the normal migration chain contains only production-targeted migrations. A fresh database is reproducible through the explicit bootstrap script, not a hidden marker or a special production-push flag.

## How the live schema was inspected

The Supabase CLI schema dump could not run because this CLI invokes Docker and Docker Desktop is unavailable in this environment. As a non-mutating fallback, authenticated Supabase Management API queries read only PostgreSQL catalog and information-schema metadata. No application-table rows or storage objects were queried.

Checked metadata:

- table names, columns, types, nullability, defaults, primary/foreign/unique/check constraints
- indexes, functions, triggers, enum values, views/materialized views/sequences
- RLS enabled state, RLS policies, and grants
- storage bucket configuration and `storage.objects` policies
- remote migration ledger

## Live object coverage

| Category | Live object | Migration coverage | Missing / partial | Recommended action |
| --- | --- | --- | --- | --- |
| Core CRM | `profiles` | `001_initial_schema.sql` | Partial: `whatsapp`, `whatsapp_connected` are live-only; RLS is live-disabled | Add fresh-baseline columns and authenticated policy; review production separately. |
| Core CRM | `user_profiles` | None | Missing table and `user_role` enum | Prerequisite baseline creates it before marketing functions reference it. |
| Core CRM | `activities`, `calendar_events`, `tasks`, `notes`, `company_settings`, `expenses` | None | Missing tables, keys, and indexes | Final baseline defines the live shape and indexes. |
| Contacts | `contacts` | `001_initial_schema.sql` | Partial: 10 legacy columns, three FKs, `idx_contacts_housing_lead_id`; `lead_stage` also has live-only `active`/`inactive` values | Final baseline adds these only in fresh environments. Do not rewrite the historical migration. |
| Properties | `properties` | Assumed by `002`/`003`; altered by later migrations | Missing base table, unique slug, indexes, and legacy columns | Prerequisite baseline defines the pre-existing table; recorded migrations retain ownership of later columns/constraints. |
| Properties | `property_images` | None | Missing table and FK; required by marketing assets | Prerequisite baseline creates it before marketing. |
| Properties | `property_documents`, `property_contacts`, `property_commissions` | `002`/`003` | Table/index coverage complete; legacy access controls were never captured | Fresh baseline records the observed legacy access state; no production table rewrite. |
| Properties | `property_shares` | None | Missing table and FKs | Final baseline defines it. |
| Deals | `deals`, `site_visits`, `commissions`, `commission_distributions` | None | Missing tables, `deals_stage_check`, commission uniqueness, and indexes | Final baseline defines them before the existing transition RPC is used. |
| Marketing | 19 `marketing_*` tables | `20260810120000` through `20260810160000` | Complete for live tables, constraints, indexes, functions, triggers, RLS, and three bucket policies | No baseline duplication. |
| Integrations | `housing_inventory_submissions`, `integration_request_logs` | `20260811100000`/`20260811110000` | Complete | Keep RLS enabled with no browser policy; service role only. |
| Integrations | `whatsapp_conversations`, `whatsapp_messages` | None | Missing tables, FKs, indexes, and ownership policies | Final baseline defines owner-scoped policies. |
| Storage | `marketing-assets`, `marketing-audio`, `marketing-brand-assets` | Marketing migrations | Complete | No change. |
| Storage | `property-documents`, `property-images` | None | Missing buckets and six `storage.objects` policies | Fresh baseline creates them; documents are private and images are public-read. |
| Legacy/deprecated | `profiles` and `user_profiles` coexist | Only `profiles` is in `001` | Two profile models remain in use | Preserve both for compatibility; plan an explicit consolidation rather than a baseline rewrite. |

## Detailed inventory

### Tables

- Live `public` tables: **43**.
- Tables with no creation migration: **16** — `activities`, `calendar_events`, `commission_distributions`, `commissions`, `company_settings`, `deals`, `expenses`, `notes`, `properties`, `property_images`, `property_shares`, `site_visits`, `tasks`, `user_profiles`, `whatsapp_conversations`, and `whatsapp_messages`.
- Partially represented tables: **2** — `profiles` and `contacts`.
- Views, materialized views, and standalone sequences in `public`: **none**.

The baseline preserves live primary keys, FKs, unique constraints, checks, column types, and defaults for the missing tables. It does not recreate any production table and contains no row copy, `UPDATE`, `DELETE`, or table replacement.

### Types and constraints

- The live `user_role` enum (`admin`, `sales`) had no migration and is now created before `user_profiles`.
- `lead_stage` in production has two legacy values not present in `001`: `active` and `inactive`. The final fresh-only phase adds them after `001` creates the enum.
- The remaining live enum types and all marketing constraints are covered by recorded migrations.
- Legacy checks/FKs that were missing solely because their tables were missing are now in the fresh baseline, including `deals_stage_check` and `commissions_unique_deal_contact_role`.

### Indexes

The live schema has **41** non-constraint indexes. **18** were not represented in migrations:

- `activities_contact_id_idx`, `activities_deal_id_idx`
- `calendar_events_assigned_to_idx`, `calendar_events_contact_idx`, `calendar_events_start_time_idx`
- `idx_contacts_housing_lead_id`
- `deals_contact_id_idx`, `deals_property_id_idx`, `deals_stage_idx`
- `notes_contact_id_idx`, `notes_deal_id_idx`
- `properties_slug_idx`, `properties_status_idx`
- `tasks_contact_id_idx`, `tasks_deal_id_idx`
- `idx_whatsapp_conversations_owner`
- `idx_whatsapp_messages_conversation`, `idx_whatsapp_messages_created`

All are present in the baseline. The remaining 23 indexes are covered by existing property, integration, and marketing migrations.

### Functions and triggers

There are **12** public functions and **16** public triggers in production. All are covered by migration history; no function or trigger baseline was generated.

Functions include the `update_updated_at_column` trigger function, the marketing RPCs, the property-creation RPC, the deal-transition RPC, and the housing upsert RPC. Security-definer functions in the recorded migrations set an explicit `search_path`, and their existing `revoke`/`grant` statements remain authoritative.

### RLS and grants

This is the material production risk discovered by the reconciliation.

- **12** live CRM tables have RLS disabled: `calendar_events`, `commission_distributions`, `commissions`, `communications_templates`, `company_settings`, `contacts`, `expenses`, `profiles`, `property_commissions`, `property_contacts`, `property_documents`, and `property_images`.
- Several of those tables retain default broad `anon` and `authenticated` table grants, so disabled RLS means browser roles are not constrained by policy.
- Of the **42** legacy public-table policies absent from migration history, `activities`, `deals`, and `properties` contain permissive anonymous `USING (true)`/`WITH CHECK (true)` access. `site_visits` also uses `TO public` with unrestricted access.
- `commissions` has policies but RLS is disabled, so those policies currently do not protect it.
- The 19 marketing RLS policies and three marketing storage policies are migration-covered and use `is_marketing_admin()`.

The fresh baseline mirrors the observed legacy RLS and storage configuration, including its permissive policies, so it can reproduce the current schema without bundling an unreviewed security redesign. It does **not** grant or revoke anything in production because it is outside the normal migration chain.

RLS and storage hardening are separate future work. Before production removes anonymous CRM access, public-property pages must move to an allowlisted server endpoint or public projection, and the direct browser access patterns must be tested against the reviewed replacement policies.

### Storage

| Bucket | Live configuration | Migration coverage | Baseline action |
| --- | --- | --- | --- |
| `marketing-assets` | private | Covered | None |
| `marketing-audio` | private, 25 MB, MP3/M4A/WAV | Covered | None |
| `marketing-brand-assets` | private, 5 MB, PNG/WebP | Covered | None |
| `property-documents` | public | Missing bucket and three policies | Fresh baseline mirrors it as public; hardening is deferred. |
| `property-images` | public | Missing bucket and three policies | Fresh baseline creates it public-read with authenticated writes. |

The production `property-documents` bucket’s `public = true` setting makes its object-read policy ineffective for confidentiality. That should be changed only as a separately tested production security rollout, after checking generated URLs and public share behavior.

## Fresh-environment provisioning strategy

Use a new Supabase project or local project database only. From the repository root, run:

```sh
scripts/bootstrap-supabase-fresh.sh '<fresh-postgres-connection-url>'
```

The bootstrap script uses `supabase db query --file` to run the pre-baseline, performs an ordinary `supabase db push --db-url` for the normal migration history, then runs the post-baseline. It first rejects any target with recorded migrations or existing `properties`, `contacts`, or `user_profiles`; it has no marker/environment bypass and never uses `--include-all`.

Seed users only after the schema is complete. Routine production deployment remains the ordinary `npx supabase db push` and must never use the fresh bootstrap script.

## Production decision and risks

Production does **not** require a structural migration merely to add the missing legacy tables: they already exist. It also receives no migration from this baseline move. It **will require** a separately reviewed RLS/storage-hardening migration if the goal is to remove anonymous CRM access and make document storage private; that migration is intentionally not included here.

Remaining risks to resolve before a production hardening rollout:

- Public property sharing currently depends on direct anonymous access paths and must move to an allowlisted server endpoint/view before CRM-table anonymous access is removed.
- `profiles` and `user_profiles` are both active. Consolidating them requires an explicit data migration and application cutover, not a baseline migration.
- The baseline was catalog-validated and static-checked, but an end-to-end `supabase db reset` could not run in this workspace because Docker Desktop is unavailable. Run it in CI or a machine with Docker before creating the next environment.
