-- CRM access revocation barrier.
--
-- This deliberately limits the change to the access-state boundary and the
-- tables that an inactive, still-authenticated JWT could otherwise query or
-- mutate directly. It is not the deferred, broader RLS rollout.

begin;

-- Existing CRM profiles remain active by default. No identity-specific data is
-- written here: a later, separately approved operation performs deactivation.
alter table public.user_profiles
  add column is_active boolean not null default true;

-- Keep this helper SECURITY DEFINER so RLS policies can safely consult the
-- canonical profile row, but only authorize active CRM profiles.
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
        and is_active = true
    );
$$;

alter function public.is_crm_user() owner to postgres;
revoke all on function public.is_crm_user() from public, anon;
grant execute on function public.is_crm_user() to authenticated, service_role;

-- These tables already have RLS. Replace their broad authenticated predicates
-- with the existing CRM capability, without adding owner/advisor scoping.
revoke all on table public.tasks, public.notes, public.property_shares from anon;

drop policy if exists "Authenticated users can create tasks" on public.tasks;
drop policy if exists "Authenticated users can view tasks" on public.tasks;
drop policy if exists "Authenticated users can update tasks" on public.tasks;
drop policy if exists "Authenticated users can delete tasks" on public.tasks;
create policy "CRM users create tasks"
  on public.tasks for insert to authenticated
  with check (public.is_crm_user());
create policy "CRM users view tasks"
  on public.tasks for select to authenticated
  using (public.is_crm_user());
create policy "CRM users update tasks"
  on public.tasks for update to authenticated
  using (public.is_crm_user())
  with check (public.is_crm_user());
create policy "CRM users delete tasks"
  on public.tasks for delete to authenticated
  using (public.is_crm_user());

drop policy if exists "Authenticated users can create notes" on public.notes;
drop policy if exists "Authenticated users can view notes" on public.notes;
drop policy if exists "Authenticated users can update notes" on public.notes;
drop policy if exists "Authenticated users can delete notes" on public.notes;
create policy "CRM users create notes"
  on public.notes for insert to authenticated
  with check (public.is_crm_user());
create policy "CRM users view notes"
  on public.notes for select to authenticated
  using (public.is_crm_user());
create policy "CRM users update notes"
  on public.notes for update to authenticated
  using (public.is_crm_user())
  with check (public.is_crm_user());
create policy "CRM users delete notes"
  on public.notes for delete to authenticated
  using (public.is_crm_user());

drop policy if exists "Allow authenticated property share management" on public.property_shares;
create policy "CRM users create property shares"
  on public.property_shares for insert to authenticated
  with check (public.is_crm_user());
create policy "CRM users view property shares"
  on public.property_shares for select to authenticated
  using (public.is_crm_user());
create policy "CRM users update property shares"
  on public.property_shares for update to authenticated
  using (public.is_crm_user())
  with check (public.is_crm_user());
create policy "CRM users delete property shares"
  on public.property_shares for delete to authenticated
  using (public.is_crm_user());

-- The following tables had RLS disabled and authenticated CRUD grants. They
-- must be closed now so a formerly active user cannot continue using an old
-- JWT through the Data API. Active CRM users retain the current shared CRUD
-- behavior; service_role remains unchanged and continues to bypass RLS.
revoke all on table
  public.commissions,
  public.commission_distributions,
  public.expenses,
  public.profiles,
  public.property_documents
from public, anon, authenticated;

grant select, insert, update, delete on table
  public.commissions,
  public.commission_distributions,
  public.expenses,
  public.profiles,
  public.property_documents
to authenticated;

alter table public.commissions enable row level security;
alter table public.commission_distributions enable row level security;
alter table public.expenses enable row level security;
alter table public.profiles enable row level security;
alter table public.property_documents enable row level security;

drop policy if exists "Allow authenticated users to view commissions" on public.commissions;
drop policy if exists "Allow authenticated users to insert commissions" on public.commissions;
drop policy if exists "Allow authenticated users to update commissions" on public.commissions;
create policy "CRM users create commissions"
  on public.commissions for insert to authenticated
  with check (public.is_crm_user());
create policy "CRM users view commissions"
  on public.commissions for select to authenticated
  using (public.is_crm_user());
create policy "CRM users update commissions"
  on public.commissions for update to authenticated
  using (public.is_crm_user())
  with check (public.is_crm_user());
create policy "CRM users delete commissions"
  on public.commissions for delete to authenticated
  using (public.is_crm_user());

create policy "CRM users create commission distributions"
  on public.commission_distributions for insert to authenticated
  with check (public.is_crm_user());
create policy "CRM users view commission distributions"
  on public.commission_distributions for select to authenticated
  using (public.is_crm_user());
create policy "CRM users update commission distributions"
  on public.commission_distributions for update to authenticated
  using (public.is_crm_user())
  with check (public.is_crm_user());
create policy "CRM users delete commission distributions"
  on public.commission_distributions for delete to authenticated
  using (public.is_crm_user());

create policy "CRM users create expenses"
  on public.expenses for insert to authenticated
  with check (public.is_crm_user());
create policy "CRM users view expenses"
  on public.expenses for select to authenticated
  using (public.is_crm_user());
create policy "CRM users update expenses"
  on public.expenses for update to authenticated
  using (public.is_crm_user())
  with check (public.is_crm_user());
create policy "CRM users delete expenses"
  on public.expenses for delete to authenticated
  using (public.is_crm_user());

-- Legacy profiles remain the historical identity source for contacts and
-- activities. Active CRM users may still resolve and manage those records;
-- an inactive JWT cannot read or mutate them directly.
create policy "CRM users create legacy profiles"
  on public.profiles for insert to authenticated
  with check (public.is_crm_user());
create policy "CRM users view legacy profiles"
  on public.profiles for select to authenticated
  using (public.is_crm_user());
create policy "CRM users update legacy profiles"
  on public.profiles for update to authenticated
  using (public.is_crm_user())
  with check (public.is_crm_user());
create policy "CRM users delete legacy profiles"
  on public.profiles for delete to authenticated
  using (public.is_crm_user());

-- Keep the current property-document metadata workflow for active CRM users.
-- This intentionally does not alter the public storage bucket; that is the
-- separately planned Stage 3 signed-document redesign.
create policy "CRM users create property documents"
  on public.property_documents for insert to authenticated
  with check (public.is_crm_user());
create policy "CRM users view property documents"
  on public.property_documents for select to authenticated
  using (public.is_crm_user());
create policy "CRM users update property documents"
  on public.property_documents for update to authenticated
  using (public.is_crm_user())
  with check (public.is_crm_user());
create policy "CRM users delete property documents"
  on public.property_documents for delete to authenticated
  using (public.is_crm_user());

-- property_images is the intentional public-read exception. An inactive JWT
-- receives the authenticated role and therefore cannot use this public policy;
-- it can only obtain the same unauthenticated public image projection as any
-- visitor. Mutation and authenticated CRM reads require an active CRM profile.
revoke all on table public.property_images from public, anon, authenticated;
grant select on table public.property_images to anon;
grant select, insert, update, delete on table public.property_images to authenticated;
alter table public.property_images enable row level security;

create policy "Public users view property images"
  on public.property_images for select to anon
  using (true);
create policy "CRM users view property images"
  on public.property_images for select to authenticated
  using (public.is_crm_user());
create policy "CRM users create property images"
  on public.property_images for insert to authenticated
  with check (public.is_crm_user());
create policy "CRM users update property images"
  on public.property_images for update to authenticated
  using (public.is_crm_user())
  with check (public.is_crm_user());
create policy "CRM users delete property images"
  on public.property_images for delete to authenticated
  using (public.is_crm_user());

commit;
