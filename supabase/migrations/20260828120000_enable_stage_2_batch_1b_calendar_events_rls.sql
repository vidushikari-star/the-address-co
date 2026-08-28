-- Stage 2, Batch 1B: make generic shared Calendar events available only to
-- authenticated users with a user_profiles record. Calendar remains a shared
-- team workflow: created_by and assigned_to are not ownership boundaries.

begin;

-- Replace the legacy broad authenticated grant set with ordinary CRUD and
-- preserve the existing service_role grant set unchanged.
revoke all on table public.calendar_events from anon;
revoke all on table public.calendar_events from authenticated;

grant select, insert, update, delete
on table public.calendar_events
to authenticated;

alter table public.calendar_events enable row level security;

create policy "CRM users select calendar events"
  on public.calendar_events for select to authenticated
  using (public.is_crm_user());

create policy "CRM users insert calendar events"
  on public.calendar_events for insert to authenticated
  with check (public.is_crm_user());

create policy "CRM users update calendar events"
  on public.calendar_events for update to authenticated
  using (public.is_crm_user())
  with check (public.is_crm_user());

create policy "CRM users delete calendar events"
  on public.calendar_events for delete to authenticated
  using (public.is_crm_user());

commit;
