# Marketing QA environment

`npm run marketing:qa` starts a local, authenticated Marketing UI only after a
fail-closed preflight proves its Supabase project is the configured
non-production target. It does not run the Marketing worker, create users,
publish, or schedule content.

## One-time setup

1. Provision or identify a dedicated Supabase project whose name visibly
   includes `qa`, `test`, `staging`, `e2e`, or `disposable`.
2. Create a dedicated non-production admin account and its `user_profiles`
   row with role `admin`. Do not reuse a human or production account.
3. Copy `.env.marketing-qa.example` to `.env.marketing-qa.local` and populate
   only values for that project. Supply the known production project ref, URL,
   and app URL solely for the verifier's fail-closed comparisons.
4. Keep the required switches unchanged: Marketing enabled; publishing and
   scheduling disabled. The QA launcher starts no Marketing worker.

The existing E2E provisioning utility can create dedicated disposable-project
accounts only after its own `assertDisposableE2eTarget()` verification passes.
Use it only with a fully populated disposable E2E configuration; this QA
launcher deliberately never creates or modifies users.

## Run

```bash
npm run marketing:qa:verify
npm run marketing:qa
```

Then sign in at the configured local URL with the dedicated QA admin. The
launcher sets `MARKETING_ENABLED=true`, `MARKETING_SCHEDULING_ENABLED=false`,
and `INSTAGRAM_PUBLISHING_ENABLED=false`, and clears Meta/OAuth and OpenAI
credentials inherited from local development files.

Do not start a Marketing worker from this environment. A Reel render smoke
test requires a separately reviewed non-publishing renderer configuration.
