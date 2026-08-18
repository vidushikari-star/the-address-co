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

Run `supabase/migrations/20260810120000_create_marketing_module.sql`, then `supabase/migrations/20260810130000_queue_marketing_reel_render.sql`, then `supabase/migrations/20260810140000_create_marketing_audio_library.sql` after the project’s existing migrations. The render migration atomically creates a queued `render_reel` job while moving content to `rendering`, and safely returns any legacy Reel left without a runnable job to `failed` with a retry message. The Audio Library migration adds its own private bucket and administrator-only track metadata. The migrations create:

- accounts, brand settings, content, source-property links, original/working/rendered asset rows;
- jobs, approvals, schedules, publications, analytics, audit logs and usage events;
- campaign plans/items/templates and a `properties.marketing_priority` field;
- the private `marketing-assets` bucket and admin-only RLS policies.

The database function `is_marketing_admin()` checks `user_profiles.role = 'admin'`; the server independently checks the authenticated profile on every Marketing page and API route. This app is currently single-tenant. If tenant support is introduced, add `organization_id` and organization-aware RLS policies to every marketing table before enabling it for multiple organizations.

## Content generation and rendering

`POST /api/marketing/content` creates an idempotent draft with a UUID key and snapshots the property. The Create screen immediately calls the authenticated `POST /api/marketing/content/:id/generate` route, so copy is present when the review screen opens; it does not depend on a cron worker. The route loads the current property facts and brand settings, calls the server-side OpenAI Responses API with the SDK's `responses.parse`, validates `output_parsed`, then persists headline, hook, caption, CTA and hashtags. Reviewers can use **Generate with AI**, **Regenerate with AI**, or a field-specific regenerate action at any time before approval.

`OPENAI_API_KEY` is mandatory for this on-demand generation route. If it is missing, the UI shows `OPENAI_API_KEY is not configured`; it never leaves an apparently successful blank draft. Campaign and assistant flows may still use the protected background worker for their separate multi-item orchestration.

### Instagram format contract

| Content type | Source media | Final media | Target size / aspect | Copy location | Render required | Publisher path | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Single Post | One image | Derived JPEG | 1080×1350 / 4:5 | Separate caption, hashtags and CTA; optional short overlay | Yes | image | Matching rendered 4:5 image and complete caption |
| Carousel | 2–10 ordered images | Ordered derived JPEG children | 1080×1350 / 4:5 each | One separate shared caption; concise slide overlays only | Yes | carousel child containers, then parent | Image-only, ordered source-to-derivative parity, 2–10 rendered children |
| Reel | Images and/or video | H.264/yuv420p MP4, AAC when selected | 1080×1920 / 9:16 | Safe-zone visual overlays plus separate caption | Yes | REELS | Current rendered MP4 with 1080×1920 metadata |
| Story | One image | Derived Story JPEG | 1080×1920 / 9:16 | Headline, support, highlights, price, CTA and optional logo are rendered on media | Yes | STORIES | Current rendered 9:16 Story creative; metadata-only Stories cannot schedule |

The shared format contract is enforced before approval, scheduling, and the protected publisher. Static Feed Posts and Carousels use `scale=…:force_original_aspect_ratio=increase,crop=…`, so a property image fills the exact output canvas without stretching. Their full caption never becomes image overlay text.

Reels use the existing Railway FFmpeg worker. Every downloaded Reel source is FFprobed before work begins; safe logs include media codec, dimensions, frame rate, pixel format, duration, file size, Node RSS, cgroup/host memory and temporary-disk headroom, but never a source URL or overlay text. Oversized stills and expensive video inputs (4K, >30 fps, HEVC, 10-bit/HDR) first become temporary, silent 720×1280 SDR proxies. Individual scenes use one thread and the `ultrafast` preset at 720×1280/30 fps; one final 1080×1920 H.264, yuv420p, fast-start encode preserves the delivery format. A low-memory guard defers the queued job rather than starting FFmpeg when the worker has insufficient headroom. Temporary originals, proxies, scenes, text files, audio, logo and final output are deleted with the workspace on success or failure.

Stories use the lightest existing static FFmpeg path. `StoryComposition` stores concise Story-specific copy—not feed caption text—and one source image. The renderer crops without stretching to 1080×1920, draws each named role in a shared safe region (top 210px, bottom 300px, side margins 84px), and optionally overlays the selected private brand logo. The resulting Marketing-owned JPEG stores its source asset ID and render token. Editing Story copy, source image, layout, or logo queues a new derivative and returns the content to review; original CRM media is never modified.

## Audio Library

**Marketing → Settings → Audio Library** accepts only administrator-uploaded MP3, M4A, and WAV files that the business owns or has permission to use. Files are limited to 25 MB, stored in the private `marketing-audio` bucket, and tracked with title, optional artist/source, filename, MIME type, size, duration, creator, and timestamps. Admins can preview, rename, and delete tracks. Signed preview URLs are short-lived and are issued only to authenticated Marketing administrators.

An editable Reel can explicitly remain **Silent** or select one Audio Library track. The selection is validated server-side and persisted in its composition; no external URL or Instagram/Meta music identifier is accepted. During Railway rendering, a selected private track is signed server-side, mixed as AAC audio, trimmed to the Reel duration when it is longer, and faded out briefly near its usable end. A shorter track is never looped; the video continues after the audio ends. If no track is selected—or it was later deleted—the Reel renders successfully without embedded audio. Deleting a library track never changes an already-rendered Reel.

Install FFmpeg in the render-worker image/package and set `FFMPEG_PATH`. The current local environment does not include FFmpeg, so actual rendering waits for a worker host that provides it.

## Review and approval

The only accepted state transitions are enforced server-side:

```text
draft / ready_for_review / changes_requested -> approved   (authenticated admin only)
approved static format -> rendering -> approved (retry only; protected worker completes render)
approved Reel -> rendering -> approved (render ready)      (protected worker completes render)
approved with ready publish media -> scheduled              (authenticated admin only)
due scheduled -> publishing -> published                    (protected worker only)
failed + material edit -> draft -> explicit approval again
```

The review panel has **Save edits** and **Approve** controls. Approval validates complete copy, transitions the item server-side, and writes an individual `marketing_approvals` row containing the administrator ID and decision timestamp, plus an audit entry. The worker cannot call it. A Carousel additionally validates its 2–10 ordered content-asset references, rejects unresolved or duplicate membership, and shows a thumbnail review of every selected CRM item. The selected IDs are persisted in the content composition in the same order used for the Instagram child containers; legacy records use only their already-snapshotted content assets, never a fresh query of all property media. Approved copy is locked: an administrator must use **Return to edits**, which transitions it to `changes_requested`, before changing it. A failed item that is edited returns to `draft` and needs a new approval.

Scheduling locks the approved content row and atomically writes `scheduled`, `proposed_publish_at`, the publish job, schedule row, and audit record. The schedule route revalidates the Content Library and Calendar and the client refreshes its route payload, so the Scheduled status and date appear immediately. A malformed Carousel remains approved and receives a sanitized, actionable error rather than silently doing nothing.

Only `draft` content exposes **Delete draft**. The protected delete route removes the content record and generated private `marketing-assets` files, while leaving the original property images/videos untouched. Approved, scheduled, publishing, and published content cannot be deleted through this route.

The Content library also supports selecting visible draft cards and **Delete Drafts**. The bulk endpoint preflights all requested IDs and rejects a mixed/non-draft selection instead of silently deleting only part of it. `changes_requested` and `failed` remain recoverable review states and are intentionally not bulk-deletable.

## Campaigns and content fatigue

The campaign planner produces a low-cost plan first. It rotates properties and content formats, filters paused properties, stores the plan, and waits in `plan_ready`. `Approve plan & generate drafts` starts queued generation for each child item; a failure records only that item and does not stop the others. Publishing history, structured creative and campaign links are stored for future repetition/fatigue scoring; the first release uses deterministic rotation rather than automated “best performer” claims.

## Instagram connection and publishing

The integration uses Instagram Login for a professional account. The app requests `instagram_business_basic` and `instagram_business_content_publish`. The authorization state has a random nonce, an HMAC signature, a 10-minute server-side record bound to the initiating admin, and a single-use database consume step. Tokens are encrypted with AES-256-GCM using `MARKETING_TOKEN_ENCRYPTION_KEY` before they reach `marketing_accounts`. Tokens never appear in browser responses or AI prompts.

The CRM permits one active Instagram connection. **Marketing → Settings → Instagram** (the direct route resolves to the Marketing settings connection panel) shows the account health, account type, expiry-aware status and last verification time. Its **Test connection** action performs a harmless `/me` request and records the result. Disconnect attempts remote revocation, always deactivates the local encrypted token, cancels queued publish jobs, and changes scheduled posts to `blocked_connection` so reconnecting cannot silently publish them.

The worker:

1. verifies the feature flag, approval state, due time, active connection, media, caption and publication idempotency record;
2. signs only private, format-validated rendered media per object for six hours; it never falls back to original CRM media;
3. creates an Instagram media container (including carousel children), persists the container ID, polls its `status_code` through queued jobs, then calls `media_publish` only after `FINISHED`;
4. stores the Instagram media ID, trustworthy permalink, published time and safe diagnostics.

Publishing is disabled unless `INSTAGRAM_PUBLISHING_ENABLED=true`. While disabled, scheduled publish jobs remain queued and are deferred by the worker; they do not call Meta and do not mark the content failed. The review screen states this explicitly, while still allowing create, generate, approve, render and schedule testing. A pre-persisted `publish_attempted_at` protects against retrying an ambiguous network failure and accidentally creating a duplicate post; that situation requires a human to check Instagram before retrying.

Meta requires a professional account. The current Meta Instagram API supports content publishing for professional accounts, with Stories limited to business accounts in the documented flows. Meta fetches supplied media URLs during publishing, which is why the worker creates an unlogged, expiring signed URL for only the rendered object; it never makes the private `marketing-assets` bucket public. See Meta’s [Instagram API Postman collection](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api) and its [content publishing guide](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing) before enabling production publishing.

Container processing never blocks a Vercel request. `IN_PROGRESS` is returned to `marketing_jobs` with a one-minute next check and a bounded maximum of ten checks. `ERROR` and `EXPIRED` are terminal: the publication, job and content are moved to `failed` with a sanitized reason. A `media_publish` attempt is recorded before the call, so a network timeout cannot cause a second post; an ambiguous result requires a human to verify Instagram before retrying. Safe logs use the form `[instagram-publisher] stage=eligibility|container|processing|publish|persistence status=…` and never contain a token, signed URL, caption, property text, or user data.

Programmatic access to the commercial Instagram music catalogue is not implemented and must not be assumed. The Reel review panel exposes only the private, user-uploaded Audio Library and an explicit Silent Reel option; it never claims to attach licensed or trending Instagram music from Meta.

## Worker and deployment

`POST /api/marketing/jobs/run` remains a protected Vercel endpoint for API-safe jobs. It deliberately excludes `render_reel`, `render_image`, and `render_carousel`, so FFmpeg never executes inside the Vercel function. The separate Railway worker claims those existing render jobs directly from `marketing_jobs`, uses the same locking/retry/status logic in `MarketingWorkerService`, and saves completed output to the existing Supabase storage/table records.

Deploy the Railway service from this repository using the root `Dockerfile` and the start command:

```bash
npm run marketing:worker
```

The Docker image uses Node 22 and installs FFmpeg/FFprobe at `/usr/bin/ffmpeg` and `/usr/bin/ffprobe`; it verifies both at worker startup. FFprobe validates that the completed asset is an H.264, yuv420p MP4 before it is uploaded. Do not assign this worker a public domain or healthcheck: Railway supports always-on background workers, and this process intentionally exposes no HTTP server.

Set these variables on the Railway worker service:

```text
MARKETING_JOB_RUNNER_URL=https://the-address-co-seven.vercel.app/api/marketing/jobs/run
MARKETING_CRON_SECRET=<same secret configured on Vercel>
WORKER_INTERVAL_MS=60000
NEXT_PUBLIC_SUPABASE_URL=<existing Supabase URL>
SUPABASE_SERVICE_ROLE_KEY=<server-only Supabase service role key>
FFMPEG_PATH=/usr/bin/ffmpeg
```

`FFPROBE_PATH` is optional; it defaults to the sibling of `FFMPEG_PATH` (therefore `/usr/bin/ffprobe` in the supplied image). Set it only when a custom Railway image puts FFprobe elsewhere.

The worker uses one sequential loop: it calls the protected Vercel endpoint for non-render jobs, verifies that Vercel and Railway identify the same non-secret Supabase project, then claims at most one local render job, waits 60 seconds, and repeats. Run this worker as one Railway replica; a long render never overlaps another cycle. Each Railway cycle logs the safe count/type/status summary of eligible render jobs; each scene additionally logs its cgroup memory limit/headroom, Node RSS and disk headroom. No property data, URLs, keys, or tokens are logged. Temporary network/5xx failures retry next cycle; 401/403 responses log a configuration warning without exposing secrets. A project mismatch prevents Railway from claiming render jobs rather than rendering against the wrong queue. `SIGTERM`/`SIGINT` stop the worker after its current cycle. Railway native cron is not used because its minimum cadence is five minutes.

The source diagnostics, not a SIGKILL alone, determine whether there is evidence of memory pressure. A SIGKILL is reported as an external termination with its elapsed time and safe source metadata; it is never labeled OOM without a platform report. Start with at least 1 GB RAM for the Railway worker. If the new `container_memory_limit_mb` / `worker_available_memory_mb` logs show a 4K/60 HEVC normalization being deferred or externally killed at that allocation, move the worker to 2 GB rather than increasing FFmpeg concurrency.

The protected endpoint requires this header from the worker:

```http
Authorization: Bearer $MARKETING_CRON_SECRET
```

On Vercel, keep `SUPABASE_SERVICE_ROLE_KEY` and `MARKETING_CRON_SECRET` server-side: the endpoint returns `401` without the secret. It processes non-render jobs, including scheduled `publish_instagram`, only when the existing publishing feature flag allows it. The Railway worker does not bypass `INSTAGRAM_PUBLISHING_ENABLED`; while the flag is false, render jobs still run but scheduled publication remains deferred.

Enable `MARKETING_ENABLED=true` only after the migration and secrets are in place. Leave `INSTAGRAM_PUBLISHING_ENABLED=false` during testing so drafts, rendering and review work without sending anything to Meta.

## Meta configuration

This implementation uses **Instagram API with Instagram Login** on `graph.instagram.com`, not Basic Display and not the Facebook Login publishing flow. Meta’s current collection identifies this as the direct login flow for Instagram professional accounts and specifies the `instagram_business_*` scopes; the older `business_*` values are deprecated. See the [official Meta Instagram API collection](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api) and [official container workflow](https://www.postman.com/meta/instagram/request/munmruq/get-ig-container-status).

1. In Meta for Developers, create the app and add the **Instagram API / Instagram Login** product. Meta’s collection recommends a Business app for this use case.
2. In that product’s Instagram Login settings, register the exact production callback: `https://<your-vercel-domain>/api/marketing/instagram/callback`. Register the exact local callback too if local OAuth is needed; it must match `META_REDIRECT_URI` character-for-character.
3. Request only `instagram_business_basic` and `instagram_business_content_publish`. While the app is in development, use a Meta app administrator/tester and an eligible Instagram professional account. Before serving accounts outside your organization, obtain the appropriate Meta App Review/Advanced Access for the requested permissions.
4. The account must be an Instagram **Business or Creator professional account**. This Instagram Login flow does not require a linked Facebook Page for publishing.
5. Set these **Vercel server-side** variables for Production and Preview as appropriate:

   ```text
   META_APP_ID=<Meta app ID>
   META_APP_SECRET=<Meta app secret>
   META_REDIRECT_URI=https://<your-vercel-domain>/api/marketing/instagram/callback
   META_GRAPH_BASE_URL=https://graph.instagram.com
   META_GRAPH_API_VERSION=v25.0
   MARKETING_TOKEN_ENCRYPTION_KEY=<base64-encoded 32-byte key>
   MARKETING_OAUTH_STATE_SECRET=<unique 32+-character secret>
   MARKETING_CRON_SECRET=<existing protected-runner secret>
   INSTAGRAM_PUBLISHING_ENABLED=false
   ```

   `v25.0` is the version currently configured by this codebase; review Meta’s version lifecycle and update this value deliberately when Meta deprecates it. Do not set the Meta app secret, access token ciphertext, service-role key, or signing URL as a browser variable. Railway does **not** need Meta app credentials: it calls Vercel’s protected non-render job runner, which executes publishing.

6. OAuth exchanges the authorization code, stores the returned long-lived token encrypted at rest, and records its expiry. The CRM labels expiring/expired tokens and requires a reconnect before an expired token can publish; it does not claim to refresh a token automatically.
7. No Meta webhook is required for this publishing implementation. It uses persisted container IDs plus bounded worker polling. Do not register a webhook for this feature unless a separately implemented webhook handler and verification flow is deployed.

### First controlled publishing test

1. Deploy the current Vercel code and confirm the protected `/api/marketing/jobs/run` invocation is operating.
2. Leave `INSTAGRAM_PUBLISHING_ENABLED=false`, connect the professional account in **Marketing → Settings**, and use **Test connection**. Confirm the masked account ID, token status and handle look correct.
3. Create one small, approved single-image item (or approve a Reel only after Railway has produced its validated MP4). Do not use a draft, rendering or failed item.
4. Set `INSTAGRAM_PUBLISHING_ENABLED=true` in Vercel Production, redeploy/restart the job runner as required by the platform, then select **Publish test** on that one approved item. This is an explicit admin action and queues a job; it never sends from the browser.
5. Watch safe Vercel logs for `instagram-publisher` stages and confirm the item becomes **Published** with an Instagram media ID. The CRM shows **View on Instagram** only when Meta returns a trusted permalink.
6. Set the kill switch back to `false` if you do not yet want normal scheduled posts to publish. With the switch false, no `media_publish` call is made and jobs are deferred.

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
- **Reel rendering fails** — Railway emits safe `marketing-render` stage logs for `workspace`, `download`, `ffmpeg`, `output`, `upload`, `asset_persistence`, and `content_transition`. The render job and failed content record retain the same URL-sanitized reason. `ffmpeg` failures include an exit code and a short sanitized stderr tail.
- **Reel stays rendering with no worker job** — deploy and run the atomic Reel-queue migration above; it changes legacy orphaned Reels to `failed` so they can be re-approved and retried.
- **Railway reports no eligible render jobs** — compare the safe `Supabase project mismatch`/`identities match` worker log with Railway and Vercel environment configuration. Both services must use the same `NEXT_PUBLIC_SUPABASE_URL`; Railway alone needs the matching project’s `SUPABASE_SERVICE_ROLE_KEY`.
- **Renderer rejects media** — move the source asset into the configured Supabase project; arbitrary external URLs are intentionally blocked.
- **Publish stays queued** — confirm the protected cron runs and `INSTAGRAM_PUBLISHING_ENABLED=true`.
- **Publish is ambiguous** — inspect the Instagram account first; the duplicate guard intentionally requires human confirmation instead of retrying blindly.
