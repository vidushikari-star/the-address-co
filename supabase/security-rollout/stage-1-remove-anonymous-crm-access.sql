-- PENDING SECURITY ROLLOUT — DO NOT RUN FROM supabase/migrations.
--
-- Expected access change:
--   * anon loses direct access to activities, deals, properties and site_visits
--   * a signed-in user with an existing public.user_profiles row retains CRM access
--   * service_role continues to bypass RLS only from server-side code
--
-- Preconditions:
--   1. Replace anon queries in app/(public)/share/[slug] with an allowlisted
--      server-side public-property projection. It currently reads properties,
--      property_images, property_documents and user_profiles through anon.
--   2. Run the Stage 1 smoke tests from docs/supabase-rls-security-audit.md
--      in a disposable project using admin, sales, unprofiled-auth, and anon JWTs.
--   3. Confirm every active CRM user has a user_profiles row.
--
-- Rollback: run the policy statements in the final comment block only if the
-- deployment fails. Do not disable RLS as a rollback shortcut.

begin;

create or replace function public.is_crm_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and exists (select 1 from public.user_profiles where id = auth.uid());
$$;

revoke all on function public.is_crm_user() from public, anon;
grant execute on function public.is_crm_user() to authenticated, service_role;

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

commit;

-- ROLLBACK (review before use; restore only the policies this stage removed):
-- create policy "Allow public create activities" on public.activities for insert to anon, authenticated with check (true);
-- create policy "Allow public view activities" on public.activities for select to anon, authenticated using (true);
-- create policy "Authenticated users can delete activities" on public.activities for delete to authenticated using (true);
-- create policy "Authenticated users can update activities" on public.activities for update to authenticated using (true) with check (true);
-- create policy "Allow public deal deletes" on public.deals for delete to anon using (true);
-- create policy "Allow public deal inserts" on public.deals for insert to anon with check (true);
-- create policy "Allow public deal reads" on public.deals for select to anon using (true);
-- create policy "Allow public deal updates" on public.deals for update to anon using (true) with check (true);
-- create policy "Authenticated users can create deals" on public.deals for insert to authenticated with check (true);
-- create policy "Authenticated users can delete deals" on public.deals for delete to authenticated using (true);
-- create policy "Authenticated users can update deals" on public.deals for update to authenticated using (true) with check (true);
-- create policy "Authenticated users can view deals" on public.deals for select to authenticated using (true);
-- create policy "Allow public property deletes" on public.properties for delete to anon using (true);
-- create policy "Allow public property inserts" on public.properties for insert to anon with check (true);
-- create policy "Allow public property reads" on public.properties for select to anon using (true);
-- create policy "Allow public property updates" on public.properties for update to anon using (true) with check (true);
-- create policy "Authenticated users can create properties" on public.properties for insert to authenticated with check (true);
-- create policy "Authenticated users can delete properties" on public.properties for delete to authenticated using (true);
-- create policy "Authenticated users can update properties" on public.properties for update to authenticated using (true) with check (true);
-- create policy "Authenticated users can view properties" on public.properties for select to authenticated using (true);
-- drop policy if exists "CRM users manage site visits" on public.site_visits;
-- create policy "Allow authenticated users" on public.site_visits for all to public using (true) with check (true);
