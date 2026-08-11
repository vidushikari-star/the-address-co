-- Fresh-environment prerequisite for legacy CRM objects that predate the
-- repository migration history. This migration deliberately runs before 001.
--
-- It is not a production deployment migration. On the linked production
-- project `properties` already exists, so the temporary marker is not created
-- and the final reconciliation migration will leave existing objects alone.

create extension if not exists "pgcrypto";

do $$
begin
  if to_regclass('public.properties') is null then
    create table public._schema_reconciliation_fresh_marker (
      id boolean primary key default true check (id)
    );
  end if;

  if not exists (
    select 1
    from pg_type type_row
    join pg_namespace namespace_row on namespace_row.oid = type_row.typnamespace
    where namespace_row.nspname = 'public'
      and type_row.typname = 'user_role'
  ) then
    create type public.user_role as enum ('admin', 'sales');
  end if;
end
$$;

-- Required by the marketing migration's authorization function. Keep this
-- ahead of the historical migrations, which reference user_profiles.
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text,
  role public.user_role not null default 'sales'::public.user_role,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  phone text,
  whatsapp text
);

-- Required by 002/003 and the marketing migrations. Columns introduced by
-- later recorded migrations (marketing_priority, housing_enabled, and
-- creation_request_id) intentionally remain in those migrations.
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  developer text,
  location text,
  locality text,
  listing_type text,
  development_stage text,
  status text default 'available'::text,
  property_type text,
  price jsonb,
  specifications jsonb,
  tags text[],
  cover_image text,
  advisor text,
  buyer_matches jsonb,
  last_shared timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  bedrooms integer default 0,
  bathrooms integer default 0,
  carpet_area numeric default 0,
  plot_area numeric default 0,
  built_up_area numeric default 0,
  note text,
  description text,
  amenities jsonb default '[]'::jsonb,
  furnishing text,
  google_map_link text,
  public_link text,
  transaction_type text default 'Sale'::text,
  housing_listing_id text,
  housing_sync_status text,
  housing_last_synced_at timestamptz,
  housing_sync_error text
);

create index if not exists properties_slug_idx on public.properties (slug);
create index if not exists properties_status_idx on public.properties (status);

-- marketing_content_assets references property_images during the recorded
-- marketing migration, so this has to be available at the same early point.
create table if not exists public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade,
  url text not null,
  is_cover boolean default false,
  created_at timestamp without time zone default now(),
  media_type text default 'image'::text
);
