-- =====================================================
-- ENUMS
-- =====================================================

create type communication_channel as enum (
  'whatsapp',
  'email'
);

create type communication_category as enum (
  'buyer',
  'seller',
  'developer',
  'broker',
  'internal',
  'marketing',
  'legal',
  'finance'
);

create type communication_status as enum (
  'draft',
  'active',
  'archived'
);

-- =====================================================
-- TABLE
-- =====================================================

create table communications_templates (
    id uuid primary key default gen_random_uuid(),

    title text not null,
    slug text not null unique,

    channel communication_channel not null default 'whatsapp',
    category communication_category not null,

    subject text,

    body text not null,

    variables jsonb not null default '[]'::jsonb,

    tags text[] default '{}',

    status communication_status not null default 'active',

    usage_count integer not null default 0,

    created_by uuid references auth.users(id),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =====================================================
-- INDEXES
-- =====================================================

create index idx_template_category
on communications_templates(category);

create index idx_template_channel
on communications_templates(channel);

create index idx_template_status
on communications_templates(status);

create index idx_template_slug
on communications_templates(slug);