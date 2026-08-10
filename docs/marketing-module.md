# Marketing module

The Marketing module is a private, admin-only Instagram studio embedded in the CRM. It reads structured inventory records and property media; it never scrapes CRM screens, rewrites source media, or lets AI approve, schedule, or publish.

## Architecture

```text
CRM properties + original property_images
  -> MarketingRepository snapshot
  -> CreativeAIService (validated JSON only)
  -> MediaAnalysisService + CompositionService
  -> Marketing jobs / protected worker
  -> RenderService (private rendered assets)
  -> explicit admin ApprovalService
  -> SchedulerService
  -> InstagramService container + publish workflow
```

`marketing_content.property_snapshot` is immutable source context for every generated item. The nullable property foreign key uses `ON DELETE SET NULL`, so history stays intact if a listing is removed. Marketing originals, working composition JSON, and final rendered media are separate: only originals stay in `property-images`; generated files go in the private `marketing-assets` bucket.

Services are deliberately separate:

- `CreativeAIService` accepts only the snapshot and brand settings, uses the OpenAI SDK's `responses.parse` and Zod-backed strict Structured Outputs, validates the parsed object, and applies excluded-word protection.
- `MediaAnalysisService` selects explicit asset IDs without changing original media.
- `CompositionService` produces a typed 9:16 Reel timeline.
- `RenderService` invokes FFmpeg without a shell, downloads only files from the configured Supabase origin, limits inputs to 75 MB, and uploads an H.264 MP4 or JPEG to private storage.
- `ApprovalService` has no AI/worker entry point.
- `SchedulerService` accepts only `approved` content, converts the ISO instant to UTC, and queues a job.
- `InstagramService` holds the Meta-specific OAuth/container logic behind an Instagram-only adapter.

## Data migration

Run `supabase/migrations/20260810120000_create_marketing_module.sql` after the project’s existing migrations. It creates:

- accounts, brand settings, content, source-property links, original/working/rendered asset rows;
- jobs, approvals, schedules, publications, analytics, audit logs and usage events;
- campaign plans/items/templates and a `properties.marketing_priority` field;
- the private `marketing-assets` bucket and admin-only RLS policies.

The database function `is_marketing_admin()` checks `user_profiles.role = 'admin'`; the server independently checks the authenticated profile on every Marketing page and API route. This app is currently single-tenant. If tenant support is introduced, add `organization_id` and organization-aware RLS policies to every marketing table before enabling it for multiple organizations.

## Content generation and rendering

`POST /api/marketing/content` creates an idempotent draft with a UUID key and snapshots the property. The Create screen immediately calls the authenticated `POST /api/marketing/content/:id/generate` route, so copy is present when the review screen opens; it does not depend on a cron worker. The route loads the current property facts and brand settings, calls the server-side OpenAI Responses API with the SDK's `responses.parse`, validates `output_parsed`, then persists headline, hook, caption, CTA and hashtags. Reviewers can use **Generate with AI**, **Regenerate with AI**, or a field-specific regenerate action at any time before approval.

`OPENAI_API_KEY` is mandatory for this on-demand generation route. If it is missing, the UI shows `OPENAI_API_KEY is not configured`; it never leaves an apparently successful blank draft. Campaign and assistant flows may still use the protected background worker for their separate multi-item orchestration.

Reels are the only on-demand content type that currently requires FFmpeg rendering. The render job creates a 1080×1920 H.264, yuv420p, 30 fps, fast-start MP4; structured scene copy is rendered as escaped text overlays and transitions use FFmpeg `xfade`. An approved single-image post uses its selected original CRM image directly and does not wait for FFmpeg. The existing image/carousel renderer remains available for a future explicitly branded-derivative workflow, but it is not a prerequisite for scheduling a normal approved post.

Install FFmpeg in the render-worker image/package and set `FFMPEG_PATH`. The current local environment does not include FFmpeg, so actual rendering waits for a worker host that provides it.

## Review and approval

The only accepted state transitions are enforced server-side:

```text
draft / ready_for_review / changes_requested -> approved   (authenticated admin only)
approved single-image -> scheduled                         (authenticated admin only)
approved Reel -> rendering -> approved (render ready)      (protected worker completes render)
approved with ready publish media -> scheduled              (authenticated admin only)
due scheduled -> publishing -> published                    (protected worker only)
failed + material edit -> draft -> explicit approval again
```

The review panel has **Save edits** and **Approve** controls. Approval validates complete copy, transitions the item server-side, and writes an individual `marketing_approvals` row containing the administrator ID and decision timestamp, plus an audit entry. The worker cannot call it. Approved copy is locked: an administrator must use **Return to edits**, which transitions it to `changes_requested`, before changing it. A failed item that is edited returns to `draft` and needs a new approval.

Only `draft` content exposes **Delete draft**. The protected delete route removes the content record and generated private `marketing-assets` files, while leaving the original property images/videos untouched. Approved, scheduled, publishing, and published content cannot be deleted through this route.

The Content library also supports selecting visible draft cards and **Delete Drafts**. The bulk endpoint preflights all requested IDs and rejects a mixed/non-draft selection instead of silently deleting only part of it. `changes_requested` and `failed` remain recoverable review states and are intentionally not bulk-deletable.

## Campaigns and content fatigue

The campaign planner produces a low-cost plan first. It rotates properties and content formats, filters paused properties, stores the plan, and waits in `plan_ready`. `Approve plan & generate drafts` starts queued generation for each child item; a failure records only that item and does not stop the others. Publishing history, structured creative and campaign links are stored for future repetition/fatigue scoring; the first release uses deterministic rotation rather than automated “best performer” claims.

## Instagram connection and publishing

The integration uses Instagram Login for a professional account. The app requests `instagram_business_basic` and `instagram_business_content_publish`. The authorization state has a random nonce, an HMAC signature, a 10-minute server-side record bound to the initiating admin, and a single-use database consume step. Tokens are encrypted with AES-256-GCM using `MARKETING_TOKEN_ENCRYPTION_KEY` before they reach `marketing_accounts`. Tokens never appear in browser responses or AI prompts.

The CRM permits one active Instagram connection. **Marketing → Settings → Instagram** (the direct route resolves to the Marketing settings connection panel) shows the account health, account type, expiry-aware status and last verification time. Its **Test connection** action performs a harmless `/me` request and records the result. Disconnect attempts remote revocation, always deactivates the local encrypted token, cancels queued publish jobs, and changes scheduled posts to `blocked_connection` so reconnecting cannot silently publish them.

The worker:

1. verifies the feature flag, approval state, due time, active connection, media, caption and publication idempotency record;
2. signs private rendered media when needed, or uses the approved original CRM-media URL for a normal single-image post;
3. creates an Instagram media container (including carousel children), polls container status, then calls `media_publish`;
4. stores container/publication IDs, permalink and safe diagnostics.

Publishing is disabled unless `INSTAGRAM_PUBLISHING_ENABLED=true`. While disabled, scheduled publish jobs remain queued and are deferred by the worker; they do not call Meta and do not mark the content failed. The review screen states this explicitly, while still allowing create, generate, approve, render and schedule testing. A pre-persisted `publish_attempted_at` protects against retrying an ambiguous network failure and accidentally creating a duplicate post; that situation requires a human to check Instagram before retrying.

Meta requires a professional account. The current Meta Instagram API supports content publishing for professional accounts, with Stories limited to business accounts in the documented flows. Meta fetches supplied media URLs during publishing, which is why the worker creates a short-lived signed URL. See Meta’s [Instagram API Postman collection](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api) and its [content publishing guide](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing) before enabling production publishing.

Programmatic access to the commercial Instagram music catalogue is not implemented and must not be assumed. The Reel review panel clearly shows that no uploaded audio tracks are available and allows a technically valid silent Reel (`No audio selected`); it does not claim to attach licensed or trending Instagram music. An uploaded, rights-cleared audio library would be required before royalty-free/original track selection can be offered.

## Worker and deployment

`POST /api/marketing/jobs/run` remains a protected Vercel endpoint for API-safe jobs. It deliberately excludes `render_reel`, `render_image`, and `render_carousel`, so FFmpeg never executes inside the Vercel function. The separate Railway worker claims those existing render jobs directly from `marketing_jobs`, uses the same locking/retry/status logic in `MarketingWorkerService`, and saves completed output to the existing Supabase storage/table records.

Deploy the Railway service from this repository using the root `Dockerfile` and the start command:

```bash
npm run marketing:worker
```

The Docker image uses Node 22 and installs FFmpeg at `/usr/bin/ffmpeg`; it verifies `ffmpeg -version` during the image build and worker startup. Do not assign this worker a public domain or healthcheck: Railway supports always-on background workers, and this process intentionally exposes no HTTP server.

Set these variables on the Railway worker service:

```text
MARKETING_JOB_RUNNER_URL=https://the-address-co-seven.vercel.app/api/marketing/jobs/run
MARKETING_CRON_SECRET=<same secret configured on Vercel>
WORKER_INTERVAL_MS=60000
NEXT_PUBLIC_SUPABASE_URL=<existing Supabase URL>
SUPABASE_SERVICE_ROLE_KEY=<server-only Supabase service role key>
FFMPEG_PATH=/usr/bin/ffmpeg
```

The worker uses one sequential loop: it claims at most one render job locally, then calls the protected Vercel endpoint for non-render jobs, waits 60 seconds, and repeats. A long render never overlaps another cycle. Temporary network/5xx failures retry next cycle; 401/403 responses log a configuration warning without exposing secrets. `SIGTERM`/`SIGINT` stop the worker after its current cycle. Railway native cron is not used because its minimum cadence is five minutes.

The protected endpoint requires this header from the worker:

```http
Authorization: Bearer $MARKETING_CRON_SECRET
```

On Vercel, keep `SUPABASE_SERVICE_ROLE_KEY` and `MARKETING_CRON_SECRET` server-side: the endpoint returns `401` without the secret. It processes non-render jobs, including scheduled `publish_instagram`, only when the existing publishing feature flag allows it. The Railway worker does not bypass `INSTAGRAM_PUBLISHING_ENABLED`; while the flag is false, render jobs still run but scheduled publication remains deferred.

Enable `MARKETING_ENABLED=true` only after the migration and secrets are in place. Leave `INSTAGRAM_PUBLISHING_ENABLED=false` during testing so drafts, rendering and review work without sending anything to Meta.

## Meta configuration

1. Create a Meta app with Instagram API / Instagram Login and add the exact `META_REDIRECT_URI`.
2. Add an administrator/tester while the app is in development, then complete Meta App Review for the requested production permissions.
3. Connect an eligible professional Instagram account from **Marketing → Settings**.
4. Configure a publicly reachable deployment: Meta must be able to fetch signed render URLs.
5. Register webhook endpoints only if you later enable webhook-driven container/publishing or analytics updates; the polling worker works without a webhook.

## OpenAI configuration

Set `OPENAI_API_KEY` server-side and optionally `OPENAI_MARKETING_MODEL`. The default model is `gpt-5.2`; any override must support the Responses API’s strict Structured Outputs. The module uses `openai@7.4` and requires Node.js 22 or later. It calls the SDK’s `responses.parse` with `zodTextFormat`, then reads the SDK-provided `response.output_parsed` rather than assuming a top-level REST field. `max_output_tokens` is 1,200, enough for the complete creative schema while still bounded. This follows the [official Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs). Safe server logs record only response metadata (ID, state, output item types, parsed/text/refusal flags and incomplete reason). The UI receives actionable errors for unavailable keys, incomplete/truncated output, malformed structured output, refusals, and empty output; it does not create a seemingly successful blank draft.

## Testing and troubleshooting

Run:

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

For a full render integration test, supply a Supabase-hosted `MARKETING_RENDER_TEST_URL`, `FFMPEG_PATH`, and worker storage credentials. The integration test intentionally skips outside of a real render-worker environment.

Common failures:

- **Forbidden/404 Marketing** — set `MARKETING_ENABLED=true`, sign in as `user_profiles.role = 'admin'`, and rerun the migration.
- **Instagram OAuth fails** — verify URI, app ID/secret, state secret and test-user access in Meta.
- **Render fails to start** — install FFmpeg in the worker and set `FFMPEG_PATH`.
- **Renderer rejects media** — move the source asset into the configured Supabase project; arbitrary external URLs are intentionally blocked.
- **Publish stays queued** — confirm the protected cron runs and `INSTAGRAM_PUBLISHING_ENABLED=true`.
- **Publish is ambiguous** — inspect the Instagram account first; the duplicate guard intentionally requires human confirmation instead of retrying blindly.
