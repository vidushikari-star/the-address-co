# Stage 1 authenticated browser/mutation smoke harness

This harness is for the outstanding Stage 1 RLS smoke test. It is deliberately
separate from normal application tests and refuses to start against production.
It does not apply migrations, change RLS, repair ledgers, or run Stage 2 work.

## One-time disposable-environment setup

1. Create a new Supabase project expressly named with `e2e`, `test`, `staging`,
   or `disposable`. Do not repurpose the inactive, unlabelled project.
2. Apply the same baseline and recorded migration history as the linked app to
   that new project. Confirm its migration ledger is aligned before this smoke
   work. This harness never deploys migrations for you.
3. Create `.env.e2e.local` by copying `.env.e2e.example`. Fill in credentials
   only for that disposable project and use a Supabase personal access token
   that can read the project via the Management API.
4. Set the three `E2E_KNOWN_PRODUCTION_*` values to the actual production
   project/app identifiers locally. They are comparison inputs only and must
   never be committed.
5. Use three unique dedicated emails in the disposable project. They must not
   be employee, customer, or production accounts. Set
   `E2E_ALLOW_DESTRUCTIVE_TESTS=true` only when ready to create those accounts
   and fixture records in that disposable project.
6. Install the browser once on the test runner: `npx playwright install chromium`.

For a brand-new, approved project only, the repository already has the guarded
fresh-target bootstrap sequence. Supply its direct Postgres connection URL only
from the new disposable project; it rejects a linked production database and a
target that already has migration history:

```sh
./scripts/bootstrap-supabase-fresh.sh '<disposable-postgres-connection-url>'
npx supabase migration list --db-url '<disposable-postgres-connection-url>'
```

In that project's Auth settings, also allow the chosen `E2E_BASE_URL` as a site
or redirect URL so password sessions can return to the local E2E app. Never
point that setting at production during this rehearsal.

The guard accepts a local app at `http://127.0.0.1:<port>` or a hostname visibly
marked `e2e`, `test`, `staging`, or `disposable`. It also requires all of the
following before any browser, user-provisioning, or cleanup mutation begins:

- `E2E_ALLOW_DESTRUCTIVE_TESTS` is exactly `true`.
- the target URL encodes `E2E_SUPABASE_PROJECT_REF`.
- the target ref and Supabase/app origins differ from the supplied production
  identifiers.
- an authenticated Supabase Management API response returns that exact ref and
  `E2E_EXPECTED_PROJECT_NAME`.
- the verified project name itself is explicitly test/disposable-marked.

Any missing value, name mismatch, Management API failure, or ambiguous target
is a hard failure. The guard never prints keys, access tokens, or project
response bodies.

## Commands

Run the safe browser suite, which starts a local Next app pointed only at the
disposable Supabase project:

```sh
npm run test:e2e:stage1
```

The default suite covers authenticated admin/sales access, authenticated but
unprofiled denial, anonymous CRM-table denial, the intentional anonymous
`property_images` read, and Dashboard `+ New` drawer/draft navigation. It
creates only the three dedicated E2E auth identities and their required profile
rows; it creates no CRM workflow records.

If an interrupted future workflow test left a manifest behind, inspect it and
then clean only the recorded identifiers:

```sh
npm run test:e2e:cleanup -- --run-id <run-id>
```

Cleanup never scans a table, uses a label-prefix delete, or clears a bucket. It
deletes only UUIDs and storage paths written in that run's manifest, in
dependency order. The manifest remains afterward as an audit record.

## Browser contexts and provisioning

`global-setup.ts` provisions the accounts after the guard passes:

| Context | Auth state | Required setup | Expected Stage 1 result |
| --- | --- | --- | --- |
| Admin | signed in | `profiles` and `user_profiles` role `admin` | CRM workflows remain usable |
| Sales | signed in | `profiles` and `user_profiles` role `sales` | CRM workflows remain usable |
| Unprofiled | signed in | auth user deliberately has neither profile row | dashboard and direct CRM access are denied |
| Anonymous | no session | no user | direct Stage 1 CRM-table reads/writes are denied |

Both profile tables are intentional: `user_profiles` is the Stage 1
`is_crm_user()` source of truth, while legacy contact/activity paths can still
reference `profiles`. Provisioning is repeatable and constrained to the three
configured disposable emails.

## Fixture and cleanup contract

Use `FixtureRegistry` from `tests/e2e/support/fixtures.ts` in every mutating
workflow test. Give every browser-entered fixture an `E2E:<run-id>:<kind>`
name/title, register each returned database UUID and every uploaded object path
immediately, then call `persist()` before the next mutation. Call `cleanup()`
in test teardown. If teardown cannot run, use the manifest command above.

Never discover fixtures with a broad query or delete by an `E2E:` prefix. The
registry supports exact records in `activities`, `calendar_events`,
`site_visits`, `deals`, property/contact junctions and documents/images,
`crm_drafts`, `contacts`, `properties`, and marketing-content records, plus
exact Storage object paths.

## Stage 1 mutation scenario matrix

Complete these scenarios one at a time in the disposable environment, with a
fresh `FixtureRegistry` per scenario. They are intentionally not enabled by the
default command: they are the approved next execution checklist after the
fixture-to-selector mapping is reviewed against the disposable deployment.

| Scenario | Browser action and expected result | Stage 1 boundary to observe |
| --- | --- | --- |
| Dashboard + New | Admin and sales open Relationship, Property, Deal and Resume Drafts; submit only unique registered fixtures | `is_crm_user()` allows signed-in CRM users |
| Property | Create a property, save a draft, close/reopen and resume/update it, then complete it | `properties`, `crm_drafts`, property media/document rows |
| Relationship | Create and edit a relationship with a unique phone/email | `contacts` and legacy `profiles` advisor reference |
| Deal | Create a deal linked to registered property/contact; draft, resume/update, and complete it | `deals`, `crm_drafts`, linked `activities` |
| Calendar meeting | Create then edit a meeting linked to registered contact/property/deal | `calendar_events` authenticated CRM access |
| Site Visit | Schedule and edit a Site Visit from the deal/calendar path; verify one linked activity and the expected property/contact/deal links | `site_visits`, `calendar_events`, `activities` |
| Public share | Create/open a public property share only through its token-gated server route; submit an enquiry only if routed server-side | no anonymous direct CRM table grant |
| Media/documents | Upload a tiny fixture image/video and document, confirm browser display/download then register exact object paths | intentional public image read; no anonymous mutation or document-table access |
| Source/carousel | Set property source and publish a carousel/media fixture without external publishing; register all generated assets | CRM and media rows stay available to CRM users |
| Marketing | Create/edit only a non-publishing marketing draft based on a registered property | marketing controls remain disabled in local E2E app |
| Negative roles | Repeat protected read/write attempts as anonymous and unprofiled; assert denial and no created fixture | Stage 1 grants/revokes and `is_crm_user()` boundary |

Before enabling mutation scenarios, add stable accessible locators or
`data-testid` values in the app components where an existing semantic label is
not available. Do not use brittle generated CSS selectors, and do not add a
test-only bypass to RLS.

## Manual review required before the first run

- Confirm the disposable project's exact name and reference in the Management
  API response, and that its baseline/schema is safe to mutate.
- Fill the local-only environment file and check all production comparison
  values point to the real production deployment.
- Review the generated browser/report directories and fixture manifest after
  the run; they are ignored by Git.
- Verify the first full mutation run manually in the disposable Supabase
  dashboard, then compare the Stage 1 policies/grants to the known verified
  state. This harness is not authorization to proceed to Stage 2.
