-- ==========================================================
-- THE ADDRESS CO.
-- INITIAL DATABASE SCHEMA
-- ==========================================================

-- UUID Support
create extension if not exists "pgcrypto";

-- ==========================================================
-- ENUMS
-- ==========================================================

create type lead_stage as enum (
    'new',
    'contacted',
    'qualified',
    'viewing',
    'negotiating',
    'won',
    'lost'
);

create type lead_temperature as enum (
    'cold',
    'warm',
    'hot'
);

create type resident_status as enum (
    'resident',
    'nri',
    'foreigner'
);

create type purchase_purpose as enum (
    'primary_residence',
    'holiday_home',
    'investment',
    'retirement'
);

create type financing_type as enum (
    'cash',
    'loan',
    'undecided'
);

create type property_type as enum (
    'apartment',
    'villa',
    'plot',
    'penthouse',
    'commercial'
);

create type bedroom_count as enum (
    '1',
    '2',
    '3',
    '4',
    '5+'
);

-- ==========================================================
-- PROFILES
-- ==========================================================

create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,

    full_name text not null,

    email text not null unique,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);

-- ==========================================================
-- CONTACTS
-- ==========================================================

create table contacts (

    id uuid primary key default gen_random_uuid(),

    advisor_id uuid references profiles(id),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    first_name text not null,
    last_name text,
    full_name text generated always as (
        trim(first_name || ' ' || coalesce(last_name,''))
    ) stored,

    email text,
    phone text not null,
    whatsapp text,

    preferred_language text,

    city text,
    country text,

    lead_source text,

    lead_stage lead_stage not null default 'new',

    lead_temperature lead_temperature
        not null default 'warm',

    last_contacted_at timestamptz,

    next_follow_up_at timestamptz,

    budget_min numeric(14,2),

    budget_max numeric(14,2),

    currency text default 'INR',

    purpose purchase_purpose,

    timeline text,

    financing financing_type,

    resident resident_status,

    property_type property_type,

    bedrooms bedroom_count,

    bathrooms integer,

    locations text[],

    min_area numeric,

    max_area numeric,

    plot_size numeric,

    must_have text[],

    nice_to_have text[],

    spouse_name text,

    co_buyer text,

    referral_source text,

    notes text,

    private_notes text
);

-- ==========================================================
-- UPDATED_AT TRIGGER
-- ==========================================================

create or replace function update_updated_at_column()
returns trigger
language plpgsql
as
$$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger update_profiles_updated_at
before update on profiles
for each row
execute function update_updated_at_column();

create trigger update_contacts_updated_at
before update on contacts
for each row
execute function update_updated_at_column();