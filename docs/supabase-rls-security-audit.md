# Supabase RLS and storage security audit

Audit date: 2026-08-11  
Scope: linked production catalog snapshot, repository migrations/baseline, and application data-access call sites.  
Production action: **none**. No data, policy, bucket, grant, or migration was applied.

## Evidence and limits

The production catalog was read during the preceding schema reconciliation through
read-only management/catalog metadata queries. It recorded 43 `public` tables,
their RLS state, policies, grants, and five storage buckets. This audit confirms
the linked migration ledger remains aligned through `20260811140000`; the local
`20260811150000_update_marketing_carousel_media_atomically.sql` is pending and
has not been applied.

This audit also made body-discarding anonymous REST `SELECT id LIMIT 1` probes
using the project’s public key. No response body or row count was retained. The
live API returned a non-empty ranged response for `properties`, `deals`,
`activities`, `site_visits`, `contacts`, `commissions`, `expenses`,
`property_documents`, `property_images`, `property_contacts`,
`property_commissions`, `user_profiles`, `commission_distributions`,
`communications_templates`, `company_settings`, and `profiles`. Those are
confirmed anonymous read exposures, not merely inferred policy risk. A `200`
empty/filtered result for `calendar_events`, `notes`, `tasks`, `property_shares`,
WhatsApp, Housing, and Marketing tables cannot distinguish an empty table from
RLS filtering, so it is not evidence of permission.

An attempted fresh `supabase db dump --linked --schema public --schema storage`
was read-only but cannot run in this workspace because the installed CLI requires
Docker Desktop for schema dumps. Refresh the catalog using
[`catalog-audit.sql`](../supabase/security-rollout/catalog-audit.sql) in the
Supabase SQL editor before any rollout. No application-table rows need to be
read for that check.

## Roles and target model

The only application roles are `admin` and `sales` in `public.user_profiles`.
“Marketing admin” is an admin-only product permission, not another database
role. An authenticated user without a `user_profiles` row is not a CRM user.
`service_role` is server-only: it is used by the Railway marketing worker and
protected Housing integration routes, never by browser code.

| Principal | Intended access |
| --- | --- |
| anon | No CRM rows or mutations. Only an explicit public-property projection and intentionally public media. |
| authenticated CRM user (`sales` or `admin`) | CRM read/write permitted only where existing product workflow needs it; no finance/integration/marketing-admin control. |
| admin | CRM administration, finance, integrations, reports, and Marketing administration. |
| service_role | Server route, worker, and integration operations only; bypasses RLS and must never be exposed. |

There is no organization/tenant field in the legacy CRM tables. This audit does
not invent one. Policies must therefore use the existing role and ownership
columns (`advisor_id`, `assigned_to`, `created_by`) only after each is verified
for the relevant workflow.

## Current RLS state and access inventory

`Browser` means the shared `lib/supabase/client.ts` anon/session client is used
directly in a client component or browser repository. `Server session` means a
route, Server Component, action, or repository uses the cookie-bound client.
`Service` includes the service-role client; `Worker` means Railway. “Broad” is
an observed `USING (true)`/`WITH CHECK (true)` policy or RLS-disabled table with
broad legacy grants—not a recommendation.

| Table | RLS | Current access/policies | Actual app callers | Recommended access | Risk / action |
| --- | --- | --- | --- | --- | --- |
| `activities` | enabled | anon insert/select broad; authenticated update/delete broad | Browser repo, server session, Housing server route | CRM users only; no anon | **Critical**; Stage 1 after public-share refactor. |
| `calendar_events` | disabled | legacy broad grants; no effective policy | Browser/server calendar repositories | assigned/creator CRM scope | **High**; ownership rule needs verification. |
| `commission_distributions` | disabled | legacy broad grants; anon read confirmed | Browser finance UI, server repository | admin only | **Critical**; Stage 2 policy review. |
| `commissions` | disabled | anon insert and authenticated policies exist but are ineffective while RLS is off; anon read confirmed | Browser/server finance and reports | admin all; sales own `advisor_id` rows | **Critical**; verify sales view first. |
| `communications_templates` | disabled | legacy broad grants; anon read confirmed | Browser/server templates | CRM read; admin mutation, pending workflow check | **High**. |
| `company_settings` | disabled | legacy broad grants; anon read confirmed | Server settings/dashboard | admin only | **High**. |
| `contacts` | disabled | legacy broad grants; anon read confirmed | Browser contacts/relationships/search; server exports/Housing | CRM users, then owner/advisor scope if validated | **Critical** PII exposure. |
| `deals` | enabled | anon CRUD broad; authenticated CRUD broad | Browser deals/search, server reports/actions | CRM users; no anon | **Critical**; Stage 1. |
| `expenses` | disabled | legacy broad grants; anon read confirmed | Browser/server finance | admin only | **Critical**. |
| `profiles` | disabled | legacy broad grants; anon read confirmed | Server current-user, legacy joins | authenticated self only | **High**; public advisor projection required. |
| `properties` | enabled | anon CRUD broad; anon read confirmed | Browser property repos/cards, server routes, Marketing, Housing | CRM users; separate public projection | **Critical**; Stage 1 dependency. |
| `property_images` | disabled | legacy broad grants; anon metadata read confirmed; public URLs | Browser image repo/upload, public share, Marketing | CRM metadata authenticated; public object media only while intentional | **High**. |
| `property_documents` | disabled | legacy broad grants; anon metadata read confirmed; backing bucket public | Browser/server document repos, public share | authenticated CRM; public documents via allowlist only | **Critical** disclosure risk. |
| `property_contacts` | disabled | legacy broad grants; anon read confirmed | Browser/server property/contact relations | CRM read, admin mutation pending validation | **High** owner/contact PII. |
| `property_commissions` | disabled | legacy broad grants; anon read confirmed | Browser/server finance and property relations | admin only | **Critical**. |
| `property_shares` | enabled | authenticated all broad | Browser/server sharing workflow | CRM users; eventual creator/advisor scope | **Medium**. |
| `site_visits` | enabled | `TO public` all broad | Browser visits, server reports | CRM users; advisor scope later | **Critical**; Stage 1. |
| `tasks` | enabled | authenticated CRUD broad | Browser/server task repositories | CRM users; assigned/creator scope later | **Medium**. |
| `notes` | enabled | authenticated CRUD broad | Browser/server contact/deal notes | CRM users; author/related-access scope later | **High**. |
| `user_profiles` | enabled | anon select broad; anon read confirmed; authenticated select broad | Browser user pickers; server auth; public share advisor card | authenticated CRM directory; server public advisor projection | **High** personal phone/WhatsApp exposure. |
| `whatsapp_conversations` | enabled | owner-scoped public (anon evaluates to no user) | Browser/server WhatsApp repos | retain owner scope; audit service ingestion separately | **Low**. |
| `whatsapp_messages` | enabled | conversation-owner scoped public | Browser/server WhatsApp repos | retain owner scope | **Low**. |
| `housing_inventory_submissions` | enabled | no browser policy; service RPC only | Housing integration route, admin inbox server page | service-role write; admin server read | **Low**; correct model. |
| `integration_request_logs` | enabled | no browser policy | Housing service/admin server page | service-role write; admin server read | **Low**; correct model. |
| `marketing_accounts` | enabled | authenticated `is_marketing_admin()` all | Marketing admin route/server, Worker service | admin only; service worker | **Low**. |
| `marketing_oauth_states` | enabled | authenticated marketing-admin all | OAuth routes/server | admin only; service backend | **Low**. |
| `marketing_brand_settings` | enabled | authenticated marketing-admin all | Marketing admin/server | admin only | **Low**. |
| `marketing_brand_assets` | enabled | authenticated marketing-admin all | Brand asset route/server, Worker signed reads | admin only; service worker | **Low**. |
| `marketing_audio_tracks` | enabled | authenticated marketing-admin all | Audio Library browser signed uploads/server, Worker | admin only; service worker | **Low**. |
| `marketing_campaigns` | enabled | authenticated marketing-admin all | Marketing admin/server | admin only | **Low**. |
| `marketing_campaign_items` | enabled | authenticated marketing-admin all | Marketing admin/server | admin only | **Low**. |
| `marketing_templates` | enabled | authenticated marketing-admin all | Marketing admin/server | admin only | **Low**. |
| `marketing_content` | enabled | authenticated marketing-admin all | Marketing admin/server, Worker | admin only; service worker | **Low**. |
| `marketing_content_properties` | enabled | authenticated marketing-admin all | Marketing admin/server, Worker | admin only; service worker | **Low**. |
| `marketing_content_assets` | enabled | authenticated marketing-admin all | Marketing admin/server, Worker | admin only; service worker | **Low**. |
| `marketing_jobs` | enabled | authenticated marketing-admin all | Protected runner, Railway Worker | service-role writes; admin diagnostic read only | **Medium**; retain server authorization. |
| `marketing_approvals` | enabled | authenticated marketing-admin all | Approval route/server | admin only | **Low**. |
| `marketing_reel_versions` | enabled | authenticated marketing-admin all | Version route/server, Worker | admin only; service worker | **Low**. |
| `marketing_schedules` | enabled | authenticated marketing-admin all | Scheduler route/server, Worker | admin only; service worker | **Low**. |
| `marketing_publications` | enabled | authenticated marketing-admin all | Publisher server/Worker | admin only; service worker | **Low**. |
| `marketing_analytics` | enabled | authenticated marketing-admin all | Analytics server/Worker | admin only; service worker | **Low**. |
| `marketing_audit_logs` | enabled | authenticated marketing-admin all | Marketing server/Worker | admin read; service write | **Low**. |
| `marketing_usage_events` | enabled | authenticated marketing-admin all | Marketing server/Worker | admin read; service write | **Low**. |

The 12 disabled tables are: `calendar_events`, `commission_distributions`,
`commissions`, `communications_templates`, `company_settings`, `contacts`,
`expenses`, `profiles`, `property_commissions`, `property_contacts`,
`property_documents`, and `property_images`.

## Dangerous anonymous and public policies

| Severity | Live policy/state | Exposure | Dependency / remediation |
| --- | --- | --- | --- |
| Critical | `Allow public property reads/inserts/updates/deletes` | anon can enumerate and mutate CRM properties | Public share currently relies on anon reads. Replace it with a server-side allowlisted projection before Stage 1. |
| Critical | `Allow public deal reads/inserts/updates/deletes` | anon CRM/deal and linked contact activity exposure/mutation | No intentional public-deal feature found. Remove in Stage 1 after smoke test. |
| Critical | `Allow public create/view activities` | anon can read and create CRM timeline activity | No public activity feature found. Remove in Stage 1. |
| Critical | `site_visits` `TO public FOR ALL USING (true)` | anon visit schedules, notes, feedback and mutations | No public site-visit feature found. Replace with CRM-user policy in Stage 1. |
| Critical | RLS disabled on `contacts`, finance, property relationships/documents | table grants can bypass all policy intent | Browser repositories currently use these tables; design per-action authenticated policies first. |
| Critical | `property-documents` bucket is public | direct object URLs expose agreements/deeds/internal attachments | Stage 3 after signed URLs and a public-document allowlist exist. |
| High | `Allow public read profiles` / anon `user_profiles` select | staff identity/contact information can be enumerated | Public share advisor card needs a narrow server projection. |
| High | `property-images` bucket public and metadata RLS disabled | every object is retrievable; off-market files cannot be protected | Keep only as intentional public media for now; separate restricted media before private migration. |
| High | `commissions` anon insert policy and disabled RLS | financial records may be writable if legacy grants remain | Enable RLS with reviewed role policy in Stage 2. |
| Medium | authenticated broad policies on notes, tasks, shares | any signed-in CRM account can see/mutate more than its work | Add ownership predicates only after workflow inventory. |
| Low | Marketing tables/buckets | covered by `is_marketing_admin()` policies; worker uses service role | Preserve, test protected routes; no broad RLS change. |

## Client/server access map

| Category | Call sites and implication |
| --- | --- |
| A. Browser anon/auth session | `lib/supabase/client.ts` is imported by property, contact, deal, activity, task, calendar, property-image/document, finance, template and WhatsApp repositories, plus direct client UI queries. These tables cannot be tightened without testing real signed-in roles. |
| B. Server session | Server Components/actions/routes use `createServerSupabaseClient()` for reports, exports, property creation, CRM repositories, document flows, and Marketing admin pages. They still obey RLS because the client holds the user session. Explicit route/page authorization remains necessary. |
| C. Service role | `lib/supabase/admin.ts` is imported only by Marketing rendering/worker flows and protected Housing integration endpoints. It must remain server-only. |
| D. Railway worker | `workers/marketing-worker.ts` validates `SUPABASE_SERVICE_ROLE_KEY`; it processes marketing jobs and private storage assets. No browser policy should be required for this access. |
| E. Integration endpoint | Housing inventory validates its dedicated bearer key, then uses service role and service-only RPCs. Instagram/OAuth/token flows are admin server routes; encrypted token ciphertext is not sent to clients. |

The former public-share blocker has been removed by the server-only projection
documented in [`public-property-share-security.md`](./public-property-share-security.md).
`/share/[slug]` now treats the segment as a revocable share token and no longer
imports anonymous CRM repositories or queries `user_profiles`. Stage 1 remains
pending: deploy and smoke-test this change before applying its reviewed SQL.

## Target permissions matrix

| Domain | anon | sales CRM user | admin | service role |
| --- | --- | --- | --- | --- |
| Properties | allowlisted published projection only | CRUD needed by CRM | CRUD | Housing/Marketing server use only |
| Property contacts/images | no metadata; intentional public image objects only | CRM workflow access | CRUD | integrations/rendering |
| Property documents | none | authorized/signed download | CRUD/signed download | server-only |
| Contacts, deals, activities, notes, tasks, visits | none | CRM workflow access; apply owner/advisor scope once verified | CRUD | server integrations only |
| Finance/commissions/expenses | none | own commission read only after tested predicate | CRUD | reporting/server only |
| Calendar | none | assigned/creator scope after verified | CRUD | server notifications only |
| Marketing | none | no direct access | marketing admin (admin) | Worker/protected runner |
| Housing/integration logs | none | no direct access | admin server inbox | dedicated integration/service only |
| Audio/brand/rendered assets | none | no direct access | authenticated signed flows | Worker/service signed flows |

## Storage policy matrix and decision

| Bucket | Current state | Callers | Target / action |
| --- | --- | --- | --- |
| `property-images` | public; authenticated upload/delete policies; public object reads | browser uploads/property cards, public share, Housing source URLs, Marketing/Instagram source media | **Remain public-read for now (Option A)**. Current code stores durable `getPublicUrl()` URLs. A private change would break sharing, syndication, and marketing unless a public-media projection/signed renewal path is built first. Restrict the bucket to intentionally public media; do not put off-market/confidential media there. |
| `property-documents` | public; authenticated object policies but bucket-public bypasses confidentiality | browser/server document repo, public share | Make private in Stage 3 after signed URL path and explicit public-brochure projection. |
| `marketing-assets` | private; marketing-admin storage policy | admin preview, Worker upload, signed Instagram fetch | retain private. |
| `marketing-audio` | private; marketing-admin storage policy | signed browser upload and Worker download | retain private. |
| `marketing-brand-assets` | private; marketing-admin storage policy | admin upload and Worker signed read | retain private. |

## Staged rollout

All artifacts are in [`supabase/security-rollout`](../supabase/security-rollout),
not `supabase/migrations`; routine `supabase db push` cannot apply them.

1. **Stage 1 — anonymous CRM access.**
   [`stage-1-remove-anonymous-crm-access.sql`](../supabase/security-rollout/stage-1-remove-anonymous-crm-access.sql)
   removes anon activity/deal/property policies and replaces the public
   site-visit policy with a CRM-user policy. First deploy the public-property
   projection and verify all active users have `user_profiles`.
2. **Stage 2 — disabled sensitive tables.**
   [`stage-2-sensitive-crm-rls.sql`](../supabase/security-rollout/stage-2-sensitive-crm-rls.sql)
   is intentionally a design template. It must not become executable until
   owner/advisor/admin predicates are agreed and exercised.
3. **Stage 3 — property documents.**
   [`stage-3-private-property-documents.sql`](../supabase/security-rollout/stage-3-private-property-documents.sql)
   makes the documents bucket private and replaces broad authenticated storage
   policies with CRM-user policies. Requires signed URLs and public brochure
   segregation first.
4. **Stage 4 — remaining legacy access.**
   [`stage-4-remaining-legacy-access.sql`](../supabase/security-rollout/stage-4-remaining-legacy-access.sql)
   records the remaining policy design work: calendar, profiles, templates,
   images and finance relationship tables.

For every approved stage, copy its reviewed SQL into one *new timestamped*
migration, deploy application changes first where noted, and retain the exact
catalog output for rollback. Never use `--include-all`.

## Required smoke and security tests before production

Run these against a disposable Supabase project with anon, unprofiled-auth,
sales, admin and service-role credentials. Tests must inspect only fixture rows.

- anon cannot select/insert/update/delete contacts, deals, activities, finance,
  property contacts, property commissions, site visits, or Housing inbox rows;
- anon cannot download a known `property-documents` object after Stage 3;
- public share can read only the reviewed property projection and intentionally
  public image/brochure media, never generic documents or advisor directory rows;
- sales and admin can complete property list/detail/create/edit, contacts,
  deals, activities, tasks and calendar workflows expected for their role;
- sales can see only the approved own-commission scope; admin finance/report
  workflows still work; unprofiled authenticated users are denied;
- Marketing admin approval/audio/brand/reel workflows work; non-admin users
  cannot read jobs, publications, token ciphertext, accounts, or audit logs;
- Housing bearer-key endpoint and Railway service-role render/download flows
  continue to work; anon cannot read Housing submissions or request logs;
- signed audio/brand/document URL upload/download flows work and reject anon;
- storage tests prove `property-images` follows the intentional public-media
  decision and `property-documents` is private after Stage 3.

The repository adds static guard tests for rollout placement, no anon policy in
the Stage 1 proposal, and service-role key absence from the browser client.
Full RLS integration tests require a disposable Supabase/Postgres environment;
they cannot be truthfully simulated with a unit-test mock.

## Rollback principles

- Take catalog/policy/bucket output immediately before every stage.
- Roll back only the policies/grants/bucket flag changed by that stage, using
  the exact commented rollback or captured catalog SQL.
- Do not disable RLS globally or reintroduce anonymous writes as a quick fix.
- If signed document access fails, temporarily restore the bucket flag only
  under incident control, then repair the authorized caller.
- RLS and bucket policy work does not change application rows; no data rollback
  should be necessary.

## Secret-exposure audit

`NEXT_PUBLIC_SUPABASE_URL` and the anon key are the only Supabase browser
configuration. `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `META_APP_SECRET`,
`MARKETING_CRON_SECRET`, `HOUSING_INVENTORY_API_KEY`, encrypted Instagram token
ciphertext, and encryption keys are referenced only in server routes/services,
the Railway worker, or documentation placeholders. No committed value was
found. The public client module contains no service-role or external API secret.

Continue to avoid logging bearer headers, signed URLs, access tokens, or
decrypted Instagram credentials. Vercel/Railway environment configuration needs
no change for the audit. A future private-image migration would require Vercel
and Railway consumer updates; the recommended current property-image decision
does not.

## Production risk summary

The immediate risk is anonymous CRM access and a public generic document bucket,
not the Marketing module. The safe path is staged: first replace anonymous
public-share dependencies, then remove anon CRM policies, then add reviewed
role/ownership policies for RLS-disabled sensitive tables, and finally make
documents private. Do not apply the proposals until their preconditions and
smoke tests have passed.
