-- Close direct access paths that could otherwise bypass the canonical
-- user_profiles.is_active CRM-access barrier. This is intentionally narrower
-- than the deferred broader RLS and private-document-storage rollouts.

begin;

-- SECURITY DEFINER RPCs bypass table RLS, so their caller checks must use the
-- same active-profile authority as ordinary CRM data access.
create or replace function public.create_property_for_user(
  property_payload jsonb,
  p_request_id uuid
)
returns table(property_id uuid, property_slug text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text;
  v_base_slug text;
  v_slug text;
  v_transaction_type text;
  v_listing_type text;
  v_development_stage text;
  v_property_type text;
  v_status text;
  v_housing_enabled boolean;
  v_attempt integer := 0;
begin
  if not public.is_crm_user() then
    raise exception using errcode = '42501', message = 'Property creation is not authorized';
  end if;

  if p_request_id is null then
    raise exception using errcode = '22023', message = 'A creation request ID is required';
  end if;

  select id, slug into property_id, property_slug
  from public.properties
  where creation_request_id = p_request_id;

  if found then
    return next;
    return;
  end if;

  v_name := nullif(btrim(property_payload ->> 'name'), '');
  if v_name is null then
    raise exception using errcode = '22023', message = 'Property name is required';
  end if;

  v_transaction_type := property_payload ->> 'transaction_type';
  v_listing_type := property_payload ->> 'listing_type';
  v_development_stage := property_payload ->> 'development_stage';
  v_property_type := property_payload ->> 'property_type';
  v_status := coalesce(property_payload ->> 'status', 'available');

  if v_transaction_type not in ('Sale', 'Rental')
    or v_listing_type not in ('Primary', 'Resale')
    or v_development_stage not in ('ready_to_move', 'under_construction', 'resale')
    or v_property_type not in ('Apartment', 'Villa', 'Plot', 'Penthouse', 'Commercial')
    or v_status not in ('available', 'viewed', 'shortlisted', 'offer', 'purchased', 'rejected', 'archived') then
    raise exception using errcode = '22023', message = 'Property contains an unsupported structured value';
  end if;

  if property_payload ? 'furnishing'
    and property_payload ->> 'furnishing' not in ('furnished', 'semi_furnished', 'unfurnished') then
    raise exception using errcode = '22023', message = 'Property furnishing is invalid';
  end if;

  v_base_slug := trim(both '-' from regexp_replace(
    lower(coalesce(nullif(btrim(property_payload ->> 'slug'), ''), v_name)),
    '[^a-z0-9]+', '-', 'g'
  ));
  v_base_slug := coalesce(nullif(v_base_slug, ''), 'property');
  v_housing_enabled := lower(coalesce(property_payload ->> 'housing_enabled', 'false')) in ('true', '1');

  loop
    v_slug := case when v_attempt = 0 then v_base_slug else v_base_slug || '-' || (v_attempt + 1)::text end;
    property_id := null;
    property_slug := null;

    begin
      insert into public.properties (
        name, slug, developer, transaction_type, listing_type, development_stage,
        property_type, status, location, locality, google_map_link, price,
        specifications, description, amenities, furnishing, tags, cover_image,
        advisor, note, housing_enabled, creation_request_id
      ) values (
        v_name,
        v_slug,
        nullif(btrim(property_payload ->> 'developer'), ''),
        v_transaction_type,
        v_listing_type,
        v_development_stage,
        v_property_type,
        v_status,
        nullif(btrim(property_payload ->> 'location'), ''),
        nullif(btrim(property_payload ->> 'locality'), ''),
        nullif(btrim(property_payload ->> 'google_map_link'), ''),
        case when jsonb_typeof(property_payload -> 'price') = 'object' then property_payload -> 'price' else '{}'::jsonb end,
        case when jsonb_typeof(property_payload -> 'specifications') = 'object' then property_payload -> 'specifications' else '{}'::jsonb end,
        nullif(btrim(property_payload ->> 'description'), ''),
        case
          when jsonb_typeof(property_payload -> 'amenities') = 'array'
            then array(select jsonb_array_elements_text(property_payload -> 'amenities'))
          else '{}'::text[]
        end,
        nullif(btrim(property_payload ->> 'furnishing'), ''),
        case
          when jsonb_typeof(property_payload -> 'tags') = 'array'
            then array(select jsonb_array_elements_text(property_payload -> 'tags'))
          else '{}'::text[]
        end,
        nullif(btrim(property_payload ->> 'cover_image'), ''),
        nullif(btrim(property_payload ->> 'advisor'), ''),
        nullif(btrim(property_payload ->> 'note'), ''),
        v_housing_enabled,
        p_request_id
      ) on conflict (creation_request_id) do nothing
      returning id, slug into property_id, property_slug;
    exception when unique_violation then
      property_id := null;
      property_slug := null;
    end;

    if property_id is not null then
      return next;
      return;
    end if;

    select id, slug into property_id, property_slug
    from public.properties
    where creation_request_id = p_request_id;

    if found then
      return next;
      return;
    end if;

    v_attempt := v_attempt + 1;
    if v_attempt > 50 then
      raise exception using errcode = '23505', message = 'Could not allocate a unique property slug';
    end if;
  end loop;
end
$$;

alter function public.create_property_for_user(jsonb, uuid) owner to postgres;
revoke all on function public.create_property_for_user(jsonb, uuid) from public, anon;
grant execute on function public.create_property_for_user(jsonb, uuid) to authenticated, service_role;

create or replace function public.transition_deal_stage(
  p_deal_id uuid,
  p_stage text
)
returns table (changed boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target public.deals%rowtype;
  previous_stage text;
begin
  if not public.is_crm_user() then
    raise exception using errcode = '42501', message = 'Deal stage changes are not authorized';
  end if;

  if p_stage not in (
    'lead', 'qualification', 'property_shared', 'site_visit',
    'negotiation', 'documentation', 'closed_won', 'closed_lost'
  ) then
    raise exception using errcode = '22023', message = 'Unsupported deal stage';
  end if;

  select * into target
  from public.deals as deal
  where deal.id = p_deal_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Deal not found';
  end if;

  previous_stage := target.stage;
  if previous_stage = p_stage then
    return query select false;
    return;
  end if;

  update public.deals as deal
  set stage = p_stage,
      last_activity = now(),
      updated_at = now()
  where deal.id = p_deal_id;

  insert into public.activities (
    type, title, description, body, deal_id, contact_id, property_id,
    activity_date, created_by, user_id
  ) values (
    'deal_stage_changed',
    'Deal Stage Changed',
    target.name,
    'Deal moved from ' || replace(previous_stage, '_', ' ') || ' to ' || replace(p_stage, '_', ' '),
    target.id,
    target.contact_id,
    target.property_id,
    now(),
    auth.uid(),
    auth.uid()
  );

  return query select true;
end;
$$;

alter function public.transition_deal_stage(uuid, text) owner to postgres;
revoke all on function public.transition_deal_stage(uuid, text) from public, anon;
grant execute on function public.transition_deal_stage(uuid, text) to authenticated, service_role;

-- Marketing policies and privileged RPCs share this helper. Its active-CRM
-- predicate makes an inactive administrator fail every helper-based path.
create or replace function public.is_marketing_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_crm_user()
    and exists (
      select 1
      from public.user_profiles
      where id = auth.uid()
        and role = 'admin'
    );
$$;

alter function public.is_marketing_admin() owner to postgres;
revoke all on function public.is_marketing_admin() from public, anon;
grant execute on function public.is_marketing_admin() to authenticated, service_role;

-- Housing inventory ingestion is a server-side integration. Its actual
-- service-role workflow remains unchanged; browser JWTs must not invoke it.
revoke all on function public.upsert_housing_inventory_submission(text, jsonb, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.upsert_housing_inventory_submission(text, jsonb, text, text, jsonb)
  to service_role;

-- These application tables were still directly reachable by any authenticated
-- JWT because RLS was disabled. Preserve shared active-CRM CRUD, not the old
-- inactive-user bypass.
revoke all on table
  public.communications_templates,
  public.company_settings,
  public.property_commissions
from public, anon, authenticated;

grant select, insert, update, delete on table
  public.communications_templates,
  public.company_settings,
  public.property_commissions
to authenticated;

alter table public.communications_templates enable row level security;
alter table public.company_settings enable row level security;
alter table public.property_commissions enable row level security;

drop policy if exists "CRM users create communications templates" on public.communications_templates;
drop policy if exists "CRM users view communications templates" on public.communications_templates;
drop policy if exists "CRM users update communications templates" on public.communications_templates;
drop policy if exists "CRM users delete communications templates" on public.communications_templates;
create policy "CRM users create communications templates"
  on public.communications_templates for insert to authenticated
  with check (public.is_crm_user());
create policy "CRM users view communications templates"
  on public.communications_templates for select to authenticated
  using (public.is_crm_user());
create policy "CRM users update communications templates"
  on public.communications_templates for update to authenticated
  using (public.is_crm_user())
  with check (public.is_crm_user());
create policy "CRM users delete communications templates"
  on public.communications_templates for delete to authenticated
  using (public.is_crm_user());

drop policy if exists "CRM users create company settings" on public.company_settings;
drop policy if exists "CRM users view company settings" on public.company_settings;
drop policy if exists "CRM users update company settings" on public.company_settings;
drop policy if exists "CRM users delete company settings" on public.company_settings;
create policy "CRM users create company settings"
  on public.company_settings for insert to authenticated
  with check (public.is_crm_user());
create policy "CRM users view company settings"
  on public.company_settings for select to authenticated
  using (public.is_crm_user());
create policy "CRM users update company settings"
  on public.company_settings for update to authenticated
  using (public.is_crm_user())
  with check (public.is_crm_user());
create policy "CRM users delete company settings"
  on public.company_settings for delete to authenticated
  using (public.is_crm_user());

drop policy if exists "CRM users create property commissions" on public.property_commissions;
drop policy if exists "CRM users view property commissions" on public.property_commissions;
drop policy if exists "CRM users update property commissions" on public.property_commissions;
drop policy if exists "CRM users delete property commissions" on public.property_commissions;
create policy "CRM users create property commissions"
  on public.property_commissions for insert to authenticated
  with check (public.is_crm_user());
create policy "CRM users view property commissions"
  on public.property_commissions for select to authenticated
  using (public.is_crm_user());
create policy "CRM users update property commissions"
  on public.property_commissions for update to authenticated
  using (public.is_crm_user())
  with check (public.is_crm_user());
create policy "CRM users delete property commissions"
  on public.property_commissions for delete to authenticated
  using (public.is_crm_user());

-- Buckets remain public where they are public today. These policies only gate
-- authenticated mutation and Storage API reads; they do not change direct
-- public-object URL behavior.
drop policy if exists "Allow authenticated users to upload property images" on storage.objects;
drop policy if exists "Allow authenticated users to delete property images" on storage.objects;
create policy "CRM users upload property images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'property-images' and public.is_crm_user());
create policy "CRM users delete property images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'property-images' and public.is_crm_user());

drop policy if exists "Allow authenticated document reads" on storage.objects;
drop policy if exists "Allow authenticated document uploads" on storage.objects;
drop policy if exists "Allow authenticated document deletes" on storage.objects;
create policy "CRM users read property documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'property-documents' and public.is_crm_user());
create policy "CRM users upload property documents"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'property-documents' and public.is_crm_user());
create policy "CRM users delete property documents"
  on storage.objects for delete to authenticated
  using (bucket_id = 'property-documents' and public.is_crm_user());

commit;
