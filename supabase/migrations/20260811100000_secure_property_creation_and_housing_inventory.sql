-- Property creation is performed through a narrowly-scoped RPC so authenticated
-- CRM users do not rely on a broad browser INSERT policy for the properties table.

alter table public.properties
  add column if not exists housing_enabled boolean not null default false,
  add column if not exists creation_request_id uuid;

create unique index if not exists properties_creation_request_id_key
  on public.properties (creation_request_id);

-- Normalize values that were previously entered as free text. The NOT VALID
-- constraints protect all new writes without rejecting historic inventory.
update public.properties
set transaction_type = case lower(trim(transaction_type))
  when 'sale' then 'Sale'
  when 'rent' then 'Rental'
  when 'rental' then 'Rental'
  else transaction_type
end
where transaction_type is not null;

update public.properties
set development_stage = case lower(replace(trim(development_stage), ' ', '_'))
  when 'ready_to_move' then 'ready_to_move'
  when 'under_construction' then 'under_construction'
  when 'resale' then 'resale'
  else development_stage
end
where development_stage is not null;

update public.properties
set furnishing = case lower(replace(trim(furnishing), '-', '_'))
  when 'furnished' then 'furnished'
  when 'semi_furnished' then 'semi_furnished'
  when 'semi furnished' then 'semi_furnished'
  when 'unfurnished' then 'unfurnished'
  else furnishing
end
where furnishing is not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'properties_transaction_type_valid') then
    alter table public.properties add constraint properties_transaction_type_valid
      check (transaction_type is null or transaction_type in ('Sale', 'Rental')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'properties_development_stage_valid') then
    alter table public.properties add constraint properties_development_stage_valid
      check (development_stage is null or development_stage in ('ready_to_move', 'under_construction', 'resale')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'properties_furnishing_valid') then
    alter table public.properties add constraint properties_furnishing_valid
      check (furnishing is null or furnishing in ('furnished', 'semi_furnished', 'unfurnished')) not valid;
  end if;
end
$$;

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
  if auth.uid() is null
    or not exists (select 1 from public.user_profiles where id = auth.uid()) then
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
        case when jsonb_typeof(property_payload -> 'amenities') = 'array' then property_payload -> 'amenities' else '[]'::jsonb end,
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
      -- A concurrent or pre-existing slug collision is retried below. A request
      -- ID collision is resolved by reading the original property instead.
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

revoke all on function public.create_property_for_user(jsonb, uuid) from public;
grant execute on function public.create_property_for_user(jsonb, uuid) to authenticated;

-- Housing posts into an inbox. Phase 1 never inserts into or updates properties.
create table if not exists public.housing_inventory_submissions (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'housing' check (provider = 'housing'),
  external_id text not null unique,
  payload jsonb not null,
  payload_hash text not null,
  version integer not null default 1 check (version > 0),
  status text not null check (status in ('received', 'validated', 'invalid', 'ready_for_mapping', 'processed', 'rejected')),
  validation_errors jsonb not null default '[]'::jsonb,
  received_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz,
  crm_property_id uuid references public.properties(id) on delete set null
);

create index if not exists housing_inventory_submissions_received_at_idx
  on public.housing_inventory_submissions (received_at desc);

create index if not exists housing_inventory_submissions_status_received_at_idx
  on public.housing_inventory_submissions (status, received_at desc);

alter table public.housing_inventory_submissions enable row level security;

create or replace function public.upsert_housing_inventory_submission(
  p_external_id text,
  p_payload jsonb,
  p_payload_hash text,
  p_status text,
  p_validation_errors jsonb
)
returns table(
  id uuid,
  external_id text,
  payload jsonb,
  payload_hash text,
  version integer,
  status text,
  validation_errors jsonb,
  received_at timestamptz,
  updated_at timestamptz,
  processed_at timestamptz,
  crm_property_id uuid,
  was_updated boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_updated boolean := false;
begin
  update public.housing_inventory_submissions
  set payload = p_payload,
      payload_hash = p_payload_hash,
      version = version + 1,
      status = p_status,
      validation_errors = p_validation_errors,
      received_at = now(),
      updated_at = now(),
      processed_at = null,
      crm_property_id = null
  where housing_inventory_submissions.external_id = p_external_id;

  if found then
    v_updated := true;
  else
    begin
      insert into public.housing_inventory_submissions (
        external_id, payload, payload_hash, status, validation_errors
      ) values (
        p_external_id, p_payload, p_payload_hash, p_status, p_validation_errors
      );
    exception when unique_violation then
      update public.housing_inventory_submissions
      set payload = p_payload,
          payload_hash = p_payload_hash,
          version = version + 1,
          status = p_status,
          validation_errors = p_validation_errors,
          received_at = now(),
          updated_at = now(),
          processed_at = null,
          crm_property_id = null
      where housing_inventory_submissions.external_id = p_external_id;
      v_updated := true;
    end;
  end if;

  return query
  select s.id, s.external_id, s.payload, s.payload_hash, s.version, s.status,
    s.validation_errors, s.received_at, s.updated_at, s.processed_at,
    s.crm_property_id, v_updated
  from public.housing_inventory_submissions s
  where s.external_id = p_external_id;
end
$$;

revoke all on function public.upsert_housing_inventory_submission(text, jsonb, text, text, jsonb) from public;
grant execute on function public.upsert_housing_inventory_submission(text, jsonb, text, text, jsonb) to service_role;

create table if not exists public.integration_request_logs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  endpoint text not null,
  request_id uuid not null,
  authenticated boolean not null,
  response_status integer not null,
  property_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists integration_request_logs_provider_created_at_idx
  on public.integration_request_logs (provider, created_at desc);

alter table public.integration_request_logs enable row level security;
