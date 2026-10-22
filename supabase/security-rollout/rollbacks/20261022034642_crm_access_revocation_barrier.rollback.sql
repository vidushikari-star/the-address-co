-- INCIDENT ROLLBACK ONLY — deliberately outside supabase/migrations.
--
-- This restores the pre-access-revocation policy and RLS state. Do not run
-- after any profile is marked inactive: it removes the old-JWT barrier. It
-- does not restore anonymous mutation privileges or alter storage buckets.

begin;

drop policy if exists "CRM users create tasks" on public.tasks;
drop policy if exists "CRM users view tasks" on public.tasks;
drop policy if exists "CRM users update tasks" on public.tasks;
drop policy if exists "CRM users delete tasks" on public.tasks;
create policy "Authenticated users can create tasks"
  on public.tasks for insert to authenticated with check (true);
create policy "Authenticated users can view tasks"
  on public.tasks for select to authenticated using (true);
create policy "Authenticated users can update tasks"
  on public.tasks for update to authenticated using (true);
create policy "Authenticated users can delete tasks"
  on public.tasks for delete to authenticated using (true);

drop policy if exists "CRM users create notes" on public.notes;
drop policy if exists "CRM users view notes" on public.notes;
drop policy if exists "CRM users update notes" on public.notes;
drop policy if exists "CRM users delete notes" on public.notes;
create policy "Authenticated users can create notes"
  on public.notes for insert to authenticated with check (true);
create policy "Authenticated users can view notes"
  on public.notes for select to authenticated using (true);
create policy "Authenticated users can update notes"
  on public.notes for update to authenticated using (true);
create policy "Authenticated users can delete notes"
  on public.notes for delete to authenticated using (true);

drop policy if exists "CRM users create property shares" on public.property_shares;
drop policy if exists "CRM users view property shares" on public.property_shares;
drop policy if exists "CRM users update property shares" on public.property_shares;
drop policy if exists "CRM users delete property shares" on public.property_shares;
create policy "Allow authenticated property share management"
  on public.property_shares for all to authenticated
  using (true)
  with check (true);

drop policy if exists "CRM users create commissions" on public.commissions;
drop policy if exists "CRM users view commissions" on public.commissions;
drop policy if exists "CRM users update commissions" on public.commissions;
drop policy if exists "CRM users delete commissions" on public.commissions;
create policy "Allow authenticated users to view commissions"
  on public.commissions for select to authenticated using (true);
create policy "Allow authenticated users to insert commissions"
  on public.commissions for insert to authenticated with check (true);
create policy "Allow authenticated users to update commissions"
  on public.commissions for update to authenticated using (true) with check (true);

drop policy if exists "CRM users create commission distributions" on public.commission_distributions;
drop policy if exists "CRM users view commission distributions" on public.commission_distributions;
drop policy if exists "CRM users update commission distributions" on public.commission_distributions;
drop policy if exists "CRM users delete commission distributions" on public.commission_distributions;
drop policy if exists "CRM users create expenses" on public.expenses;
drop policy if exists "CRM users view expenses" on public.expenses;
drop policy if exists "CRM users update expenses" on public.expenses;
drop policy if exists "CRM users delete expenses" on public.expenses;
drop policy if exists "CRM users create legacy profiles" on public.profiles;
drop policy if exists "CRM users view legacy profiles" on public.profiles;
drop policy if exists "CRM users update legacy profiles" on public.profiles;
drop policy if exists "CRM users delete legacy profiles" on public.profiles;
drop policy if exists "CRM users create property documents" on public.property_documents;
drop policy if exists "CRM users view property documents" on public.property_documents;
drop policy if exists "CRM users update property documents" on public.property_documents;
drop policy if exists "CRM users delete property documents" on public.property_documents;
drop policy if exists "Public users view property images" on public.property_images;
drop policy if exists "CRM users view property images" on public.property_images;
drop policy if exists "CRM users create property images" on public.property_images;
drop policy if exists "CRM users update property images" on public.property_images;
drop policy if exists "CRM users delete property images" on public.property_images;

alter table public.commissions disable row level security;
alter table public.commission_distributions disable row level security;
alter table public.expenses disable row level security;
alter table public.profiles disable row level security;
alter table public.property_documents disable row level security;
alter table public.property_images disable row level security;

revoke all on table
  public.commissions,
  public.commission_distributions,
  public.expenses,
  public.profiles,
  public.property_documents,
  public.property_images
from public, anon, authenticated;

grant select, insert, update, delete on table
  public.commissions,
  public.commission_distributions,
  public.expenses,
  public.profiles,
  public.property_documents
to authenticated;
grant select on table public.property_images to anon;
grant select, insert, update, delete on table public.property_images to authenticated;

create or replace function public.is_crm_user()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.user_profiles
      where id = auth.uid()
    );
$$;

alter function public.is_crm_user() owner to postgres;
revoke all on function public.is_crm_user() from public, anon;
grant execute on function public.is_crm_user() to authenticated, service_role;

alter table public.user_profiles drop column if exists is_active;

commit;
