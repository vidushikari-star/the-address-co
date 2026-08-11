-- Public property shares are opt-in.  This migration intentionally does not
-- backfill tokens or enable sharing for existing listings, so applying it does
-- not publish any current CRM data.
alter table public.properties
  add column if not exists public_share_token uuid,
  add column if not exists public_share_enabled boolean not null default false,
  add column if not exists public_share_show_price boolean not null default false,
  add column if not exists public_share_show_advisor_contact boolean not null default false,
  add column if not exists public_share_show_documents boolean not null default false,
  add column if not exists public_share_show_exact_address boolean not null default false,
  add column if not exists public_share_expires_at timestamptz,
  add column if not exists public_share_advisor_name text,
  add column if not exists public_share_advisor_phone text,
  add column if not exists public_share_advisor_whatsapp text,
  add column if not exists public_share_advisor_email text;

create unique index if not exists properties_public_share_token_key
  on public.properties (public_share_token)
  where public_share_token is not null;

-- A property can have many CRM media rows, but none are public-share media
-- until a CRM admin explicitly selects them.
alter table public.property_images
  add column if not exists public_share_allowed boolean not null default false;

create index if not exists property_images_public_share_allowed_idx
  on public.property_images (property_id, created_at)
  where public_share_allowed;

-- Public documents are an explicit, category-limited allowlist.  The public
-- projection only issues short-lived URLs for brochure and floor-plan rows.
alter table public.property_documents
  add column if not exists public_share_allowed boolean not null default false;

create index if not exists property_documents_public_share_allowed_idx
  on public.property_documents (property_id, created_at desc)
  where public_share_allowed;
