-- Stage 2, Batch 1: make shared CRM contacts and property-contact
-- relationships available only to authenticated users with a user_profiles
-- record. This deliberately does not introduce ownership/advisor scoping:
-- both tables are shared CRM data in the approved Batch 1 access model.
--
-- Scope guard: contacts and property_contacts only. Calendar is Batch 1B.

begin;

-- Replace the legacy broad authenticated grant set with ordinary CRUD and
-- preserve the existing service_role grant set unchanged.
revoke all on table public.contacts, public.property_contacts from anon;
revoke all on table public.contacts, public.property_contacts from authenticated;

grant select, insert, update, delete
on table public.contacts, public.property_contacts
to authenticated;

alter table public.contacts enable row level security;
alter table public.property_contacts enable row level security;

create policy "CRM users select contacts"
  on public.contacts for select to authenticated
  using (public.is_crm_user());

create policy "CRM users insert contacts"
  on public.contacts for insert to authenticated
  with check (public.is_crm_user());

create policy "CRM users update contacts"
  on public.contacts for update to authenticated
  using (public.is_crm_user())
  with check (public.is_crm_user());

create policy "CRM users delete contacts"
  on public.contacts for delete to authenticated
  using (public.is_crm_user());

create policy "CRM users select property contacts"
  on public.property_contacts for select to authenticated
  using (public.is_crm_user());

create policy "CRM users insert property contacts"
  on public.property_contacts for insert to authenticated
  with check (public.is_crm_user());

create policy "CRM users update property contacts"
  on public.property_contacts for update to authenticated
  using (public.is_crm_user())
  with check (public.is_crm_user());

create policy "CRM users delete property contacts"
  on public.property_contacts for delete to authenticated
  using (public.is_crm_user());

commit;
