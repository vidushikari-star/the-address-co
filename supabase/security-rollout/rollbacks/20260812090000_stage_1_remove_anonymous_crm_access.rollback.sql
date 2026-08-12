-- INCIDENT ROLLBACK ONLY — this file is deliberately outside supabase/migrations.
--
-- Restores exactly the pre-Stage-1 anonymous grants/policies captured from the
-- linked production catalog on 2026-08-12. It intentionally does not alter
-- storage buckets or property-images.

begin;

drop policy if exists "CRM users create activities" on public.activities;
drop policy if exists "CRM users view activities" on public.activities;
drop policy if exists "CRM users update activities" on public.activities;
drop policy if exists "CRM users delete activities" on public.activities;
create policy "Allow public create activities"
  on public.activities for insert to anon, authenticated with check (true);
create policy "Allow public view activities"
  on public.activities for select to anon, authenticated using (true);
create policy "Authenticated users can delete activities"
  on public.activities for delete to authenticated using (true);
create policy "Authenticated users can update activities"
  on public.activities for update to authenticated using (true) with check (true);

drop policy if exists "CRM users create deals" on public.deals;
drop policy if exists "CRM users view deals" on public.deals;
drop policy if exists "CRM users update deals" on public.deals;
drop policy if exists "CRM users delete deals" on public.deals;
create policy "Allow public deal deletes" on public.deals for delete to anon using (true);
create policy "Allow public deal inserts" on public.deals for insert to anon with check (true);
create policy "Allow public deal reads" on public.deals for select to anon using (true);
create policy "Allow public deal updates" on public.deals for update to anon using (true) with check (true);
create policy "Authenticated users can create deals" on public.deals for insert to authenticated with check (true);
create policy "Authenticated users can delete deals" on public.deals for delete to authenticated using (true);
create policy "Authenticated users can update deals" on public.deals for update to authenticated using (true) with check (true);
create policy "Authenticated users can view deals" on public.deals for select to authenticated using (true);

drop policy if exists "CRM users create properties" on public.properties;
drop policy if exists "CRM users view properties" on public.properties;
drop policy if exists "CRM users update properties" on public.properties;
drop policy if exists "CRM users delete properties" on public.properties;
create policy "Allow public property deletes" on public.properties for delete to anon using (true);
create policy "Allow public property inserts" on public.properties for insert to anon with check (true);
create policy "Allow public property reads" on public.properties for select to anon using (true);
create policy "Allow public property updates" on public.properties for update to anon using (true) with check (true);
create policy "Authenticated users can create properties" on public.properties for insert to authenticated with check (true);
create policy "Authenticated users can delete properties" on public.properties for delete to authenticated using (true);
create policy "Authenticated users can update properties" on public.properties for update to authenticated using (true) with check (true);
create policy "Authenticated users can view properties" on public.properties for select to authenticated using (true);

drop policy if exists "CRM users manage site visits" on public.site_visits;
create policy "Allow authenticated users"
  on public.site_visits for all to public using (true) with check (true);

drop policy if exists "CRM users view profiles" on public.user_profiles;
create policy "Allow public read profiles"
  on public.user_profiles for select to anon using (true);
create policy "Users can read profiles"
  on public.user_profiles for select to authenticated using (true);

create policy "Allow anonymous commission insert"
  on public.commissions for insert to anon with check (true);

grant all privileges on table
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
to anon;

grant insert, update, delete, truncate, references, trigger
  on table public.property_images
  to anon;

revoke all on function public.is_crm_user() from authenticated, service_role;
drop function if exists public.is_crm_user();

commit;
