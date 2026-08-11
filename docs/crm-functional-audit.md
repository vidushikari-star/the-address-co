# CRM functional audit

Audit date: 2026-08-11

Scope: repository implementation, migrations, unit/integration coverage, and the local production build. This audit did not call live Supabase, Railway, Instagram, or Housing.com, and it did not enable publishing. Findings about deployed schema/state therefore distinguish repository evidence from items that require a production operator to verify.

## Executive result

The audit traced 120 mutation entry-point references and scanned 141 rendered button/control elements across the requested CRM modules. Marketing has a strong protected-route foundation, private derivative media, and atomic scheduling. This audit fixed six High issues: atomic Marketing approval, atomic revised-Reel queueing, stale job recovery, silent unsupported jobs, deal-stage/activity consistency, and create-retry idempotency. It also removed a raw Housing sync failure from the browser response.

Two deployment risks remain material: the committed migration history does not define the legacy core CRM tables used by Properties, Deals, Contacts, Calendar, and Tasks; and several older browser-side CRUD repositories still rely on deployed RLS rather than an explicit server mutation boundary. Neither can be safely “fixed” blind without the live schema/RLS export.

## Audit metrics

| Measure | Result |
| --- | --- |
| Visible buttons/controls scanned | 141 |
| Mutation entry-point references traced | 120 |
| Stale-refresh bugs found/fixed | 2 / 2 |
| State-transition defects found/fixed | 5 / 5 |
| Atomicity defects found/fixed | 7 / 4; 3 Medium legacy flows remain |
| Idempotency defects found/fixed | 1 / 1 |
| Server-permission gaps found/fixed | 1 / 1; legacy RLS still requires live verification |
| Integration defects found/fixed | 1 / 1 |
| Storage/media defects found/fixed | 0 Critical; 1 Medium remains |
| Background-job defects found/fixed | 3 / 3 |
| Critical issues fixed | 0; the incomplete core migration baseline remains open |
| High issues fixed | 6 |
| Medium/Low issues remaining | 5 grouped findings |
| New migrations required | 2 added in this audit: one Marketing and one Deals migration |
| Environment changes required | None |
| Vercel redeploy required | Yes |
| Railway redeploy required | Yes |
| Commit status | Audit changes are uncommitted; branch HEAD is `cea9db0` |

## A. Button and action audit

| Screen / module | Action group | Expected mutation | Refresh / visible result | Result |
| --- | --- | --- | --- | --- |
| Properties / New Property | Save Property | `create_property_for_user` RPC with stable request ID | Server revalidates list/detail; client navigates to new property and refreshes | Pass; already atomic and idempotent |
| Properties / Edit | Save, archive, delete | Property row and related media/source mutations | Client calls `router.refresh()` after success | Medium: browser repositories depend on deployed RLS; live policy audit required |
| Properties / media | Upload/remove image/document; source add/edit | Storage plus metadata/relationship mutation | Success refreshes gallery/detail | Pass for refresh; storage cleanup failures are surfaced/logged |
| Properties / filters | Sale/rent, stage, furnishing, location, search | URL/client query filtering only | URL/read state preserved by page-level query handling | Manual responsive/browser verification remains |
| Deals / pipeline | Drag stage card | Deal stage plus timeline activity | Optimistic card move, then `router.refresh()` after atomic server action | **Fixed High** |
| Deals / detail | Stage selector | Deal stage plus timeline activity | Loading disables select; actionable inline error; refresh on success | **Fixed High** |
| Deals / notes, site visits, close | Notes, visit status, close/lost workflow | Deal/site-visit/commission/activity writes | Most call `router.refresh()` in `finally` | Medium: several multi-write legacy workflows remain non-transactional |
| Contacts | Create/edit, stage, activity, property sharing | Contact, relationship, activity writes | Components generally refresh after successful mutation | Medium: legacy browser repositories need live RLS verification |
| Calendar | Create/edit/delete event | `calendar_events` mutation | Form refreshes then routes to calendar | Pass for visible refresh; India time zone is explicit in form conversion |
| Marketing / create | Create and generate copy | Content snapshot + original-reference relations, then generation | Stable per-studio idempotency key; selected-content navigation and refresh | **Fixed High** retry duplication risk |
| Marketing / review | Edit copy, approve, request changes, reject | Content/version/approval/audit rows | Client clears prior error and refreshes on success | **Fixed High** approval writes are now one RPC |
| Marketing / Reel | Render, revised-version render, AI improve, audio/logo changes | Queue/version/content/asset writes | Pending controls disabled; refresh after success | **Fixed High** revised-version queue is now atomic |
| Marketing / Carousel | Preview, approve, schedule | Ordered selected references, approval, atomic schedule/job | Carousel preview is local; schedule revalidates content/calendar and client refreshes | Pass |
| Marketing / scheduled content | Unschedule, delete, bulk delete | Locked schedule/job/content mutation | Optimistic outcome application then refresh | Pass; safe skips are visible |
| Marketing / audio & brand assets | Request/finalize upload, edit/delete audio, upload/remove logo | Private storage and metadata writes | Pending states and refreshes present | Medium: active-logo replacement is still two DB statements |
| Marketing / Instagram | Connect, callback, test, disconnect, publish/retry | OAuth state/account/publication/job writes | Document navigation for OAuth; client refresh for postbacks | Pass; real publication still guarded by feature flag |
| Marketing / campaigns | Create plan, approve/generate | Campaign/content/job writes | Client refresh after request | Medium: creation/generation path has multiple independent writes |
| Housing / inventory | Health and inventory intake | Authenticated payload validation, idempotent inbox RPC, audit row | API is `no-store`; inbox page is server-rendered | Pass |
| Housing / sync | Pull leads | Protected server-side sync | Sync button disables and refreshes | **Fixed Medium** raw provider error no longer reaches browser |
| Settings / integrations | View Housing/Instagram configuration | Read-only status and connection controls | Admin-only server pages; refresh after mutations | Pass |
| Background worker | Railway render / Vercel safe jobs | Claim, lock, run, retry or fail job and parent state | Next page refresh displays new status | **Fixed High** stale lease and unsupported-job handling |

## B. Workflow state map

### Marketing

```text
Single image / Carousel
draft → ready_for_review → approved → scheduled → publishing → published
                    ↘ changes_requested → draft/ready_for_review
approved → changes_requested | draft (rejected)
scheduled → approved (unschedule) | deleted (safe delete)
terminal delivery error → failed → approved (only safe publication retry)

Reel
draft → ready_for_review → approved → rendering → ready_for_review
                                            ↘ failed
approved rendered Reel → scheduled → publishing → published
approved revised version → rendering → rendered → make current → schedule
material audio / AI revision → new draft version → approval required
```

Important guards:

- Carousels persist ordered `selectedAssetIds`; 2–10 existing source assets are required for approval/scheduling/publishing.
- A Carousel never enters an FFmpeg render requirement.
- A Reel requires a validated rendered MP4; a newer approved version blocks scheduling until it is rendered/current.
- `INSTAGRAM_PUBLISHING_ENABLED=false` blocks direct and worker publishing but not safe review/scheduling.
- Unschedule/delete locks content and publish jobs; an already-running publication is skipped rather than deleted.

### Property, Deals, and Housing

```text
Property: create (idempotent RPC) → available/viewed/shortlisted/offer/purchased/rejected/archived
Deal: lead → qualification → property_shared → site_visit → negotiation → documentation → closed_won | closed_lost
Housing: received/invalid | ready_for_mapping → processed | rejected (Phase 1 does not auto-create properties)
```

The Deals stage transition is now idempotent when the target stage already matches: it returns `changed=false` and does not create a duplicate activity.

## C. Background-job ownership

| Job type | Executor | Retry / lease policy | Terminal effect |
| --- | --- | --- | --- |
| `render_reel`, `render_image`, `render_carousel` | Railway worker only | Atomic row claim; up to job max attempts; one-hour stale lease recovery; render SIGKILL/timeouts terminal | Job fails; Reel content/version records carry safe `last_error` and terminal Reel becomes `failed` |
| `generate_creative` | Protected Vercel runner | Generic exponential backoff up to max attempts | Generated copy/composition or failed parent content |
| `publish_instagram` | Protected Vercel runner | Up to 10 attempts; container polling requeues; stale lease becomes terminal, never automatic republish | Publication/content become published or failed; ambiguous `media_publish` requires manual Instagram verification |
| `analyze_media`, `sync_publish_status`, `sync_analytics` | Vercel runner allow-list, not currently enqueued | Unsupported execution is now a visible retry/failure, never a completed “skipped” job | Parent becomes failed after retry budget; diagnose before enabling producer |

The worker now invokes `recover_stale_marketing_jobs()` before claims. Non-publish work is requeued only after a one-hour lease expiry; a stale publish job fails deliberately to avoid duplicate Instagram posts.

## D. Permissions matrix

| Area | Server-side enforcement observed | Result |
| --- | --- | --- |
| Marketing pages and APIs | `requireMarketingAdminPage` / `requireMarketingApiAccess`; database functions re-check `is_marketing_admin()` | Pass |
| Instagram OAuth/publish/disconnect | Marketing admin API gate; OAuth state bound to user and consumed once; feature flag blocks real publish | Pass |
| Audio and brand assets | Marketing admin API gate plus private buckets and signed URLs | Pass |
| Housing inventory/health | Constant-time bearer key comparison, rate limit, server-only service role | Pass |
| Housing inbox settings | Server page requires admin profile | Pass |
| Property creation | Authenticated profile required in server action and database RPC | Pass |
| Deal stage transition | Server action authenticates; RPC rechecks authenticated profile | **Fixed High** |
| Property edit/delete, Contacts, Calendar, legacy Deals/Tasks | Mostly browser Supabase repositories | High deployment verification required: export and test live RLS/policies; hidden controls alone are insufficient |

## E. Integration status

| Integration | Status | Notes |
| --- | --- | --- |
| Instagram | Feature-gated, admin-only, OAuth state validated, token encrypted | No real publish was triggered. Connection test returns sanitized advice. |
| Housing inventory | Authenticated, size-limited, rate-limited and idempotent | Stores inbox records only; no Phase-1 CRM property write. |
| Housing lead pull | Authenticated server route | Provider failure now returns a sanitized action message. |
| Supabase Storage | Private Marketing/audio/logo buckets with signed preview URLs | Original property media remains referenced, not owned/deleted by Marketing. |
| Railway | Owns FFmpeg/render job claiming | Requires the new stale-job migration and Railway redeploy. |
| Vercel | Owns API-safe job runner | Requires the same migration and Vercel redeploy. |

## F. Data and storage safety findings

- Marketing draft/scheduled deletion selects only Marketing-owned derivative kinds before storage cleanup. Original property image/video URLs are references and are not removed.
- Carousel membership/order is captured at content creation and no longer queries all current property media for review/publish.
- Audio finalization validates a user-scoped storage path, actual object type/size, and re-reads a duplicate record before cleanup.
- Render output is FFprobe-validated and stored in the separate private Marketing bucket.
- Remaining Medium issue: active-logo replacement deactivates the old record before inserting the new metadata record. The uploaded object is cleaned if metadata creation fails, but a database interruption can leave no active logo. Move this pair into an RPC when modifying Brand Assets next.

## G. Error-handling findings

- Fixed: Housing pull no longer serializes an arbitrary provider exception to the API response.
- Existing strengths: Housing intake uses request IDs and sanitized persistence diagnostics; worker persists safe `last_error`; render diagnostics redact URLs and avoid media/text secrets.
- Remaining Medium issue: 20+ Marketing route catch blocks still conditionally return `Error.message`. Many source errors are intentional actionable guards, but provider/PostgREST messages should be centralized through an allow-listed sanitizer before a non-admin Marketing role is ever introduced.
- Legacy CRM components still use browser `alert()` for some failures. They are visible but not contextual or durable; retain as Low/Medium UX debt rather than redesigning this audit.

## H. Issues by severity

| Severity | Finding | Disposition |
| --- | --- | --- |
| Critical | Core CRM tables referenced by the app are absent from the committed migration baseline; live schema cannot be proven from this repository | Open: export `supabase db pull` (or equivalent reviewed baseline) before new environment provisioning |
| High | Approval status, decision history, audit log, and newest Reel-version approval were independent writes | Fixed by `apply_marketing_approval` RPC |
| High | Revised-Reel render could queue parent content before version state changed | Fixed by `queue_marketing_reel_version_render` RPC |
| High | Worker crash/redeploy left `running` Marketing jobs permanently locked | Fixed by `recover_stale_marketing_jobs` RPC |
| High | Unsupported queued job types were recorded completed with `skipped` output | Fixed: explicit retry/terminal failure |
| High | Deal stage could persist while timeline activity failed and UI reported failure | Fixed by `transition_deal_stage` RPC/server action |
| High | Marketing create used a new idempotency key for each retry click | Fixed: stable key for the studio instance |
| Medium | Brand-logo activation is non-atomic | Open, low-risk follow-up RPC |
| Medium | Campaign creation/generation and several legacy deal/site-visit/close flows have multiple writes | Open pending core-schema/RLS baseline and targeted transactional migrations |
| Medium | Raw error-message exposure remains in some Marketing catch paths | Open, central sanitizer follow-up |
| Low | Housing inbox table rows are mouse-clickable rather than keyboard buttons | Open accessibility improvement |
| Low | Calendar form explicitly serializes `+05:30`; it is appropriate for an India-only CRM but should be made user/configuration-timezone aware if that changes | Open product decision |

## I. Fixes applied

1. Added atomic Marketing approval RPC covering content transition, approval record, latest draft Reel-version approval, and audit log.
2. Added atomic revised-Reel render RPC covering parent lock/state, version state, and render job creation.
3. Added stale Marketing job recovery with a deliberately conservative one-hour lease and duplicate-publication protection.
4. Changed unsupported job execution from silent completion to visible failure.
5. Added one per-open-studio idempotency key to Marketing content creation.
6. Added an authenticated, atomic Deal stage/timeline action and moved detail/pipeline UI to it with loading/error/refresh behavior.
7. Sanitized Housing lead-sync client errors.
8. Added `npm run test:smoke` and focused coverage for Deal transitions, worker recovery/unsupported jobs, approval atomic routing, and revised Reel rendering.

## J. Remaining recommendations

1. Pull and review the live Supabase schema/RLS as a baseline. Do not provision a fresh environment from the current incomplete migrations.
2. Add transactional RPCs for close-deal/commission distribution, site-visit completion plus deal advancement, Marketing campaign creation/generation, and active-logo replacement after schema baseline review.
3. Centralize Marketing API error serialization using allow-listed action messages and preserve detailed diagnostics only in server logs.
4. Add browser E2E coverage with a disposable Supabase project for actual RLS, storage cleanup, URL-filter persistence, responsive controls, and timezone cases. The current smoke suite is repeatable service/route coverage, not a deployed-browser test.
5. Reconcile any existing `running` jobs after migration deployment and inspect jobs that fail as unsupported before enabling a producer for their type.

## Validation

Validated locally after the fixes:

- `npx tsc --noEmit`
- `npm run lint`
- `npm run test:smoke` — 9 files, 58 tests passed
- `npm test` — 27 files passed, 1 skipped; 151 passed, 1 skipped
- `npm run test:integration` — 1 file passed, 1 skipped; 4 passed, 1 skipped
- `npm run build` — passed. Turbopack emitted the pre-existing NFT tracing warning through `next.config.ts → render-service → marketing-worker-service → jobs route`.

Apply both new Marketing migrations and the Deal-stage migration before deploying the Vercel app and Railway worker.
