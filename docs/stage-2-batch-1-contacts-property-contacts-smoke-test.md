# Stage 2 Batch 1 — Contacts and property-contact relationships

This checklist is for the reviewed migration
`20260819120000_enable_stage_2_batch_1_contacts_property_contacts_rls.sql`.
It covers only `contacts` and `property_contacts`. Calendar remains Batch 1B;
do not include Calendar, finance, Storage, templates, or other Stage 2 tables
in this release.

## Preconditions

1. The migration ledger is aligned and lists only this migration as pending.
2. Capture the pre-deployment catalog state with the verification SQL and
   retain the result with the release record.
3. Confirm `public.is_crm_user()` still checks for the signed-in caller's
   `user_profiles` row and has the Stage 1 grants.
4. Use disposable, uniquely labelled property/contact fixtures. Do not use
   customer records for the mutation checks.

## Positive shared-CRM checks

Perform each check as both an admin and a sales user. The approved Batch 1
model deliberately grants the same shared CRM CRUD capability to both roles.

| Area | Actions | Expected result |
| --- | --- | --- |
| Contacts | Open list, search, open detail, create, edit, and delete a disposable contact | All operations succeed; no owner/advisor restriction is applied |
| Dashboard + New | Open **New Relationship**, save/resume its draft, then create the disposable contact | Draft and final creation work; no duplicate final contact is created |
| Property source | Add, edit, and remove an owner/developer/MOU-holder/broker source on a disposable property | `property_contacts` insert/update/delete succeeds and the source list refreshes |
| Contact detail | Attach/detach a disposable property relationship and reopen Contact detail | Property inventory/linkage reflects the relationship |
| Deal | Open **New Deal** and select the disposable contact and property | Contact/source lists load and the selected links persist |
| Nested reads | Open the property source/contact relationship surface | `property_contacts → contacts` nested data loads without a permission error |

## Negative and service-role checks

| Actor | Checks | Expected result |
| --- | --- | --- |
| Authenticated, no `user_profiles` row | Contact list/detail, create/update/delete, draft, and property-contact nested read/write attempts | Denied or redirected; no CRM row is exposed or changed |
| Anonymous | Direct REST SELECT/INSERT/UPDATE/DELETE against both tables | Every request is denied; do not log row bodies |
| Service role | Existing server-only contact/property-contact operations used by integrations and protected routes | Unchanged; service role bypass remains available only server-side |

## Post-deployment catalog verification

Run [`20260819120000_enable_stage_2_batch_1_contacts_property_contacts_rls.verify.sql`](../supabase/security-rollout/verification/20260819120000_enable_stage_2_batch_1_contacts_property_contacts_rls.verify.sql).

Confirm:

- both tables have RLS enabled and are not forced;
- each table has only its four named authenticated CRM-user policies;
- each policy uses `public.is_crm_user()` for the required `USING` and/or
  `WITH CHECK` expression;
- anonymous has no direct privileges;
- authenticated has only `SELECT`, `INSERT`, `UPDATE`, and `DELETE`;
- `is_crm_user()` has not changed; and
- no Calendar, Storage, finance, template, or other table catalog state changed.

## Failure handling

If a CRM workflow is denied, preserve the failure's route, role, and timestamp
without logging fixture/customer data. Do not work around it with anonymous
grants or permissive policies. The supplied rollback is a security-containment
script: it removes the new CRM-user policies but intentionally leaves RLS
enabled and does not restore legacy broad grants. Any functional recovery must
be a separately reviewed corrective migration.
