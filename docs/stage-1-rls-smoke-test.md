# Stage 1 RLS hardening smoke test

## Scope and prerequisites

This procedure is for
`20260812090000_stage_1_remove_anonymous_crm_access.sql`. It is an operational
checklist, not an instruction to apply the migration automatically.

Before a release operator applies it:

1. Deploy the public-share application release containing the server-only token
   projection (`2bb2fdc` or later).
2. Confirm `SUPABASE_SERVICE_ROLE_KEY` exists only in the server runtime and
   that the deployed `/share/<known-token>` page renders successfully.
3. Confirm each active CRM user has a `public.user_profiles` row. An
   authenticated user without that row is intentionally denied by Stage 1.
4. Capture fresh output from `supabase/security-rollout/catalog-audit.sql` and
   retain it with the release record.
5. Rehearse the migration, rollback, and checks below on a disposable Supabase
   project populated with non-production fixtures. Never test with real
   customer data.

## Apply process

An approved operator may run the normal, monotonic migration command only after
the above checks and change approval. Do not use `--include-all`; the linked
ledger must show all previous migrations aligned first.

```sh
npx supabase migration list --linked
npx supabase db push --linked
```

The migration makes no data changes and does not change either property storage
bucket. If any unexpected migration appears, stop rather than pushing it.

## Immediate database verification

Run the following read-only query in the Supabase SQL editor or through the CLI.
It must return no rows. `property_images` is intentionally not in this list
because Stage 1 preserves anonymous read access there.

```sql
select table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'anon'
  and table_name in (
    'activities', 'calendar_events', 'commission_distributions', 'commissions',
    'communications_templates', 'company_settings', 'contacts', 'deals',
    'expenses', 'profiles', 'properties', 'property_commissions',
    'property_contacts', 'property_documents', 'site_visits', 'user_profiles'
  );
```

Verify these policy conditions in `pg_policies`:

- `activities`, `deals`, and `properties` have the four `CRM users …` policies
  for authenticated users only.
- `site_visits` has only `CRM users manage site visits`, scoped to
  authenticated CRM users.
- `user_profiles` has only `CRM users view profiles`, scoped to authenticated
  CRM users.
- `commissions` no longer has `Allow anonymous commission insert`.
- `property-documents` remains a **public** bucket and `property-images` remains
  a **public** bucket; Stage 1 does not alter storage objects.
- `property_images` keeps its anonymous `SELECT` grant, but its anonymous
  `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, and `TRIGGER` grants
  are revoked.

Using the public anon key, direct REST requests to every table in the query
above must fail (a non-2xx response or no permission), not return rows. Do not
log response bodies. `property_images` metadata and public object URLs are the
deliberate Stage 1 exception.

## Product smoke tests

Run the following with an admin account, a sales account, an authenticated user
without a profile, and an anonymous browser session. Use disposable fixtures.

| Area | Test | Expected result |
| --- | --- | --- |
| Login | Admin and sales sign in; unprofiled authenticated user opens an app page | CRM users enter the app; unprofiled user is redirected/denied |
| Properties | List, filter, open detail, create, edit, upload/select media, save share settings | Admin and sales workflows continue; no browser request is unauthenticated |
| Public share | Open a known token in a clean browser; change price/media, then revoke it | Allowlisted page renders; refresh reflects changes; revoked link is unavailable |
| Deals and activities | List/detail, create/edit/delete a disposable deal, change stage, add/remove activity | CRM users complete the flow; anon REST is denied |
| Site visits | Create, edit/status-update, and remove a disposable visit | CRM users complete the flow; anon REST is denied |
| Contacts/relationships | List/detail/search and add/remove a disposable property relationship | Signed-in flow remains available; anon direct REST is denied by revoked grants |
| Marketing | Open property selector, create draft, select Carousel gallery media, select Reel source | Marketing admin workflow continues; server and authenticated queries still work |
| Housing | `GET /api/integrations/housing/health` with its bearer key; submit a disposable signed inventory payload | Health and intake retain their existing protected behavior |
| Marketing scheduling | Create and schedule a draft, then inspect the scheduled state | No permission regression; do not publish to Instagram |

In browser DevTools on the public share page, verify that the page and enquiry
form do not send Supabase REST requests for CRM tables. The only visitor write
is `POST /api/public/property-shares/<token>/enquiries`; it validates the token
on the server before using service-role access.

## Failure strategy

1. Record the denied query, role, route, and timestamp without logging customer
   records or secrets.
2. Check whether the actor is missing `user_profiles`, then determine the
   narrow authenticated policy that the workflow needs.
3. If immediate recovery is necessary, have an approved database operator run
   [`20260812090000_stage_1_remove_anonymous_crm_access.rollback.sql`](../supabase/security-rollout/rollbacks/20260812090000_stage_1_remove_anonymous_crm_access.rollback.sql).
4. Do not add `anon USING (true)` as a workaround. Fix the required
   authenticated/server path, re-test it in a disposable project, then issue a
   reviewable follow-up migration.

## Expected remaining anonymous exposure after Stage 1

- `property-images`: public bucket objects and anonymous table `SELECT` access
  remain by explicit Stage 1 exclusion; anonymous table writes are removed.
- `property-documents`: the public bucket remains reachable by known legacy
  object URLs until Stage 3; anonymous table grants are removed in Stage 1.
- Other legacy tables with RLS disabled retain authenticated access but lose the
  direct `anon` grant. Their authenticated ownership/role model is Stage 2.
