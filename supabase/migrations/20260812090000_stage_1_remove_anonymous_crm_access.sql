-- Stage 1: remove confirmed anonymous CRM access without changing storage
-- bucket visibility or enabling RLS on the legacy tables reserved for Stage 2.
--
-- Preconditions verified before this migration was authored:
--   * /share/[slug] uses a server-only, token-gated projection.
--   * its enquiry path is a server route and no longer writes CRM rows from
--     the browser.
--   * the linked production catalog has no public-role grants on these tables;
--     it grants the listed privileges directly to anon.
--
-- property-images retains anonymous SELECT and public storage reads. Its
-- anonymous mutation privileges are removed, without changing that public-read
-- behavior. property-documents table access is revoked here, but its public
-- bucket is not changed until Stage 3.

begin;

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

revoke all on function public.is_crm_user() from public, anon;
grant execute on function public.is_crm_user() to authenticated, service_role;

-- RLS is already enabled on these tables. Replace anonymous/broad authenticated
-- policies with the same CRM-user capability required by current workflows.
drop policy if exists "Allow public create activities" on public.activities;
drop policy if exists "Allow public view activities" on public.activities;
drop policy if exists "Authenticated users can delete activities" on public.activities;
drop policy if exists "Authenticated users can update activities" on public.activities;
create policy "CRM users create activities"
  on public.activities for insert to authenticated
  with check (public.is_crm_user());
create policy "CRM users view activities"
  on public.activities for select to authenticated
  using (public.is_crm_user());
create policy "CRM users update activities"
  on public.activities for update to authenticated
  using (public.is_crm_user())
  with check (public.is_crm_user());
create policy "CRM users delete activities"
  on public.activities for delete to authenticated
  using (public.is_crm_user());

drop policy if exists "Allow public deal deletes" on public.deals;
drop policy if exists "Allow public deal inserts" on public.deals;
drop policy if exists "Allow public deal reads" on public.deals;
drop policy if exists "Allow public deal updates" on public.deals;
drop policy if exists "Authenticated users can create deals" on public.deals;
drop policy if exists "Authenticated users can delete deals" on public.deals;
drop policy if exists "Authenticated users can update deals" on public.deals;
drop policy if exists "Authenticated users can view deals" on public.deals;
create policy "CRM users create deals"
  on public.deals for insert to authenticated
  with check (public.is_crm_user());
create policy "CRM users view deals"
  on public.deals for select to authenticated
  using (public.is_crm_user());
create policy "CRM users update deals"
  on public.deals for update to authenticated
  using (public.is_crm_user())
  with check (public.is_crm_user());
create policy "CRM users delete deals"
  on public.deals for delete to authenticated
  using (public.is_crm_user());

drop policy if exists "Allow public property deletes" on public.properties;
drop policy if exists "Allow public property inserts" on public.properties;
drop policy if exists "Allow public property reads" on public.properties;
drop policy if exists "Allow public property updates" on public.properties;
drop policy if exists "Authenticated users can create properties" on public.properties;
drop policy if exists "Authenticated users can delete properties" on public.properties;
drop policy if exists "Authenticated users can update properties" on public.properties;
drop policy if exists "Authenticated users can view properties" on public.properties;
create policy "CRM users create properties"
  on public.properties for insert to authenticated
  with check (public.is_crm_user());
create policy "CRM users view properties"
  on public.properties for select to authenticated
  using (public.is_crm_user());
create policy "CRM users update properties"
  on public.properties for update to authenticated
  using (public.is_crm_user())
  with check (public.is_crm_user());
create policy "CRM users delete properties"
  on public.properties for delete to authenticated
  using (public.is_crm_user());

drop policy if exists "Allow authenticated users" on public.site_visits;
create policy "CRM users manage site visits"
  on public.site_visits for all to authenticated
  using (public.is_crm_user())
  with check (public.is_crm_user());

drop policy if exists "Allow public read profiles" on public.user_profiles;
drop policy if exists "Users can read profiles" on public.user_profiles;
create policy "CRM users view profiles"
  on public.user_profiles for select to authenticated
  using (public.is_crm_user());

-- This policy is inert while commissions has RLS disabled, but dropping it
-- removes a latent anonymous write path before the Stage 2 policy model.
drop policy if exists "Allow anonymous commission insert" on public.commissions;

-- These revocations eliminate all direct anonymous table access confirmed in
-- the production catalog. Authenticated and service_role grants are untouched.
revoke all on table
  public.activities,
  public.calendar_events,
  public.commission_distributions,
  public.commissions,
  public.communications_templates,
  public.company_settings,
  public.contacts,
  public.deals,
  public.expenses,
  public.profiles,
  public.properties,
  public.property_commissions,
  public.property_contacts,
  public.property_documents,
  public.site_visits,
  public.user_profiles
from anon;

-- property_images has RLS disabled today. Keep its intentional anonymous read
-- behavior intact, but remove all direct anonymous mutation capabilities.
revoke insert, update, delete, truncate, references, trigger
  on table public.property_images
  from anon;

commit;
