# Stage 2, Batch 1B Calendar RLS smoke checklist

Run this checklist only after the reviewed Batch 1B migration has been applied
to the intended environment. It covers generic shared Calendar events only;
Site Visits remain on their existing canonical workflow.

## Admin

- [ ] Calendar loads with generic Meetings visible.
- [ ] Create a Meeting.
- [ ] Edit and reschedule a Meeting.
- [ ] Update its title and notes.
- [ ] Link it to a Contact.
- [ ] Link it to a Property.
- [ ] Link it to a Deal.
- [ ] Assign it to a sales user.
- [ ] Delete it.

## Sales

- [ ] Repeat the supported normal Meeting CRUD workflow as a sales user.

## Shared-team Calendar behavior

- [ ] An admin-created Meeting assigned to sales is visible to that sales user.
- [ ] A sales-created Meeting is visible to an admin.
- [ ] Cross-team assignment continues to work.
- [ ] The “assigned to me” filter still works.

## Site Visit regression

- [ ] Creating a Site Visit from Calendar creates a canonical `site_visits` record.
- [ ] Calendar displays the Site Visit projection.
- [ ] Dashboard → My Work → Upcoming Visits still works.
- [ ] Contact history still shows the Site Visit.
- [ ] Property Activity still shows the Site Visit.
- [ ] No duplicate Site Visit is created.
- [ ] No Site Visit is persisted as a generic `calendar_events` row.

## Negative actors

- [ ] An authenticated user without a `user_profiles` row is denied Calendar reads.
- [ ] The same unprofiled user is denied Calendar mutations.
- [ ] Anonymous direct `calendar_events` REST reads and writes are denied.
- [ ] Service-role Calendar access remains unchanged.

## Nested reads

- [ ] Calendar continues loading related Contacts.
- [ ] Calendar continues loading related Properties.
- [ ] Calendar continues loading related Deals.
- [ ] Calendar continues loading related `user_profiles`.
- [ ] Separate task-table permission issues are not reported as `calendar_events` failures.
