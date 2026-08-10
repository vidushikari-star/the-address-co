-- ==========================================================
-- PRIVATE MARKETING STUDIO
-- All data is deliberately private to CRM administrators. This CRM does not
-- currently model organisations, so marketing data follows the single-tenant
-- application boundary. Add organisation_id to every table before enabling
-- multi-tenant access.
-- ==========================================================

create type marketing_content_status as enum (
  'draft',
  'rendering',
  'ready_for_review',
  'changes_requested',
  'approved',
  'scheduled',
  'publishing',
  'published',
  'blocked_connection',
  'failed'
);

create type marketing_job_type as enum (
  'analyze_media',
  'generate_creative',
  'render_image',
  'render_carousel',
  'render_reel',
  'publish_instagram',
  'sync_publish_status',
  'sync_analytics'
);

create type marketing_job_status as enum (
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled'
);

create type marketing_asset_kind as enum (
  'original_reference',
  'working_composition',
  'rendered_media',
  'cover',
  'audio'
);

-- Used by the campaign planner only; it does not change how normal inventory
-- records are displayed or managed elsewhere in the CRM.
alter table properties
  add column if not exists marketing_priority text not null default 'normal'
  check (marketing_priority in ('high', 'normal', 'low', 'paused'));

create table marketing_accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'instagram' check (platform = 'instagram'),
  unique (platform),
  external_account_id text not null unique,
  username text,
  display_name text,
  account_type text,
  profile_image_url text,
  access_token_ciphertext text not null,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  status text not null default 'connected' check (status in ('connected', 'expiring', 'expired', 'revoked', 'error', 'disconnected')),
  metadata jsonb not null default '{}'::jsonb,
  connected_by uuid references auth.users(id) on delete set null,
  connected_at timestamptz not null default now(),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table marketing_oauth_states (
  id uuid primary key default gen_random_uuid(),
  state_hash text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  return_to text not null default '/marketing/settings',
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table marketing_brand_settings (
  id boolean primary key default true check (id),
  brand_name text,
  instagram_handle text,
  website text,
  whatsapp_cta text,
  preferred_tone text not null default 'Premium, sophisticated, aspirational luxury real estate.',
  preferred_cta text,
  default_hashtags text[] not null default '{}',
  excluded_words text[] not null default '{}',
  logo_storage_path text,
  watermark_storage_path text,
  font_family text,
  brand_colors jsonb not null default '{"primary":"#1f4d3b","accent":"#c9a96a"}'::jsonb,
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  brief text,
  objective text,
  creative_direction text,
  status text not null default 'draft' check (status in (
    'draft', 'planning', 'plan_ready', 'generating', 'review_required',
    'partially_approved', 'approved', 'partially_scheduled', 'scheduled',
    'active', 'completed', 'cancelled'
  )),
  duration_days integer,
  posting_frequency integer,
  content_mix jsonb not null default '{}'::jsonb,
  plan jsonb not null default '[]'::jsonb,
  planned_start_at timestamptz,
  planned_end_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table marketing_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'campaign',
  description text,
  configuration jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table marketing_content (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references marketing_campaigns(id) on delete set null,
  account_id uuid references marketing_accounts(id) on delete set null,
  -- A nullable reference preserves an approved content history after property deletion.
  primary_property_id uuid references properties(id) on delete set null,
  property_snapshot jsonb not null default '{}'::jsonb,
  content_type text not null check (content_type in (
    'reel', 'single_image', 'carousel', 'story', 'infographic',
    'property_spotlight', 'new_listing', 'price_update', 'just_listed',
    'luxury_lifestyle', 'investment_opportunity', 'location_spotlight',
    'feature_highlight', 'architecture_highlight', 'construction_update',
    'inventory_roundup', 'property_comparison'
  )),
  creative_direction text not null default 'surprise_me',
  title text,
  status marketing_content_status not null default 'draft',
  caption text,
  short_caption text,
  headline text,
  hook text,
  cta text,
  hashtags text[] not null default '{}',
  alt_text text,
  creative jsonb not null default '{}'::jsonb,
  composition jsonb not null default '{}'::jsonb,
  proposed_publish_at timestamptz,
  published_at timestamptz,
  rejection_reason text,
  last_error text,
  idempotency_key uuid not null default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

create table marketing_campaign_items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references marketing_campaigns(id) on delete cascade,
  content_id uuid unique references marketing_content(id) on delete set null,
  property_id uuid references properties(id) on delete set null,
  property_snapshot jsonb not null default '{}'::jsonb,
  content_type text not null,
  creative_direction text,
  hook text,
  planned_for timestamptz,
  position integer not null default 0,
  status text not null default 'proposed' check (status in ('proposed', 'approved_for_generation', 'generating', 'ready_for_review', 'removed', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table marketing_content_properties (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references marketing_content(id) on delete cascade,
  property_id uuid references properties(id) on delete set null,
  property_snapshot jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  unique (content_id, property_id)
);

create table marketing_content_assets (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references marketing_content(id) on delete cascade,
  property_image_id uuid references property_images(id) on delete set null,
  kind marketing_asset_kind not null,
  media_type text not null check (media_type in ('image', 'video', 'audio', 'document')),
  storage_path text,
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  check (storage_path is not null or source_url is not null)
);

create table marketing_jobs (
  id uuid primary key default gen_random_uuid(),
  content_id uuid references marketing_content(id) on delete cascade,
  type marketing_job_type not null,
  status marketing_job_status not null default 'queued',
  progress integer not null default 0 check (progress between 0 and 100),
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error text,
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  run_after timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

create table marketing_approvals (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references marketing_content(id) on delete cascade,
  decision text not null check (decision in ('approved', 'changes_requested', 'rejected')),
  note text,
  decided_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table marketing_schedules (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null unique references marketing_content(id) on delete cascade,
  scheduled_for timestamptz not null,
  timezone text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table marketing_publications (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null unique references marketing_content(id) on delete restrict,
  account_id uuid references marketing_accounts(id) on delete set null,
  platform text not null default 'instagram' check (platform = 'instagram'),
  external_container_id text,
  external_publication_id text unique,
  permalink text,
  request_diagnostics jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'published', 'failed')),
  idempotency_key uuid not null unique,
  publish_attempted_at timestamptz,
  published_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table marketing_analytics (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references marketing_publications(id) on delete cascade,
  captured_at timestamptz not null default now(),
  metrics jsonb not null default '{}'::jsonb,
  unique (publication_id, captured_at)
);

create table marketing_audit_logs (
  id uuid primary key default gen_random_uuid(),
  content_id uuid references marketing_content(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table marketing_usage_events (
  id uuid primary key default gen_random_uuid(),
  content_id uuid references marketing_content(id) on delete set null,
  category text not null check (category in ('ai_generation', 'image_generation', 'video_render', 'storage', 'publishing')),
  quantity numeric not null default 1,
  unit text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index marketing_content_status_idx on marketing_content(status, proposed_publish_at);
create index marketing_content_property_idx on marketing_content(primary_property_id);
create index marketing_campaign_items_campaign_idx on marketing_campaign_items(campaign_id, position);
create index marketing_content_properties_content_idx on marketing_content_properties(content_id);
create index marketing_jobs_runnable_idx on marketing_jobs(status, run_after) where status = 'queued';
create index marketing_assets_content_idx on marketing_content_assets(content_id, sort_order);
create index marketing_audit_logs_content_idx on marketing_audit_logs(content_id, created_at desc);

-- Uses the authoritative role table and avoids trusting a client-supplied role.
create or replace function public.is_marketing_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_marketing_admin() to authenticated;

-- Marketing media is intentionally separate from property-images. Rendered and
-- working assets stay private; the app creates short-lived signed URLs for preview.
insert into storage.buckets (id, name, public)
values ('marketing-assets', 'marketing-assets', false)
on conflict (id) do update set public = false;

alter table marketing_accounts enable row level security;
alter table marketing_oauth_states enable row level security;
alter table marketing_brand_settings enable row level security;
alter table marketing_campaigns enable row level security;
alter table marketing_campaign_items enable row level security;
alter table marketing_templates enable row level security;
alter table marketing_content enable row level security;
alter table marketing_content_properties enable row level security;
alter table marketing_content_assets enable row level security;
alter table marketing_jobs enable row level security;
alter table marketing_approvals enable row level security;
alter table marketing_schedules enable row level security;
alter table marketing_publications enable row level security;
alter table marketing_analytics enable row level security;
alter table marketing_audit_logs enable row level security;
alter table marketing_usage_events enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'marketing_accounts', 'marketing_oauth_states', 'marketing_brand_settings', 'marketing_campaigns',
    'marketing_campaign_items', 'marketing_templates',
    'marketing_content', 'marketing_content_properties', 'marketing_content_assets',
    'marketing_jobs', 'marketing_approvals', 'marketing_schedules',
    'marketing_publications', 'marketing_analytics', 'marketing_audit_logs',
    'marketing_usage_events'
  ] loop
    execute format('create policy %I on public.%I for all to authenticated using (public.is_marketing_admin()) with check (public.is_marketing_admin())', table_name || '_admin_only', table_name);
  end loop;
end;
$$;

create policy marketing_assets_admin_only
on storage.objects for all to authenticated
using (bucket_id = 'marketing-assets' and public.is_marketing_admin())
with check (bucket_id = 'marketing-assets' and public.is_marketing_admin());

create trigger update_marketing_accounts_updated_at before update on marketing_accounts for each row execute function update_updated_at_column();
create trigger update_marketing_brand_settings_updated_at before update on marketing_brand_settings for each row execute function update_updated_at_column();
create trigger update_marketing_campaigns_updated_at before update on marketing_campaigns for each row execute function update_updated_at_column();
create trigger update_marketing_campaign_items_updated_at before update on marketing_campaign_items for each row execute function update_updated_at_column();
create trigger update_marketing_templates_updated_at before update on marketing_templates for each row execute function update_updated_at_column();
create trigger update_marketing_content_updated_at before update on marketing_content for each row execute function update_updated_at_column();
create trigger update_marketing_jobs_updated_at before update on marketing_jobs for each row execute function update_updated_at_column();
create trigger update_marketing_schedules_updated_at before update on marketing_schedules for each row execute function update_updated_at_column();
create trigger update_marketing_publications_updated_at before update on marketing_publications for each row execute function update_updated_at_column();
