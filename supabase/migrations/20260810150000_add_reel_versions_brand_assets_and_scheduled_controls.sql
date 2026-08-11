-- Reel versions preserve creative history. They reference original CRM media
-- by ID only; rendered output stays in Marketing-owned storage.
create table public.marketing_brand_assets (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'logo' check (kind = 'logo'),
  storage_path text not null unique,
  filename text not null check (char_length(filename) between 1 and 255),
  mime_type text not null check (mime_type in ('image/png', 'image/webp')),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  active boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index marketing_brand_assets_one_active_logo_idx
  on public.marketing_brand_assets(kind) where active;

create table public.marketing_reel_versions (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.marketing_content(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  status text not null default 'draft' check (status in ('draft', 'approved', 'rendering', 'rendered', 'failed')),
  is_current boolean not null default false,
  composition jsonb not null,
  source_asset_ids uuid[] not null default '{}',
  logo_settings jsonb,
  audio_settings jsonb,
  rendered_asset_id uuid references public.marketing_content_assets(id) on delete set null,
  user_prompt text check (user_prompt is null or char_length(user_prompt) <= 600),
  last_error text,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  rendered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_id, version_number)
);

create unique index marketing_reel_versions_one_current_idx
  on public.marketing_reel_versions(content_id) where is_current;
create index marketing_reel_versions_content_created_idx
  on public.marketing_reel_versions(content_id, version_number desc);

alter table public.marketing_content
  add column active_reel_version_id uuid references public.marketing_reel_versions(id) on delete set null;

alter table public.marketing_brand_settings
  add column default_reel_logo_placement text not null default 'none'
    check (default_reel_logo_placement in ('none', 'top_left', 'top_right', 'bottom_left', 'bottom_right', 'end_card_only')),
  add column default_reel_logo_opacity numeric(3,2) not null default 0.65
    check (default_reel_logo_opacity between 0.10 and 1.00),
  add column default_reel_logo_scale text not null default 'small'
    check (default_reel_logo_scale in ('small', 'medium', 'large'));

-- The render pipeline only consumes PNG/WebP. SVG is intentionally not
-- accepted here because this deployment does not provide a hardened SVG
-- rasterisation path for untrusted upload content.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('marketing-brand-assets', 'marketing-brand-assets', false, 5242880, array['image/png', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png', 'image/webp'];

alter table public.marketing_brand_assets enable row level security;
alter table public.marketing_reel_versions enable row level security;

create policy marketing_brand_assets_admin_only
on public.marketing_brand_assets for all to authenticated
using (public.is_marketing_admin()) with check (public.is_marketing_admin());

create policy marketing_reel_versions_admin_only
on public.marketing_reel_versions for all to authenticated
using (public.is_marketing_admin()) with check (public.is_marketing_admin());

create policy marketing_brand_asset_files_admin_only
on storage.objects for all to authenticated
using (bucket_id = 'marketing-brand-assets' and public.is_marketing_admin())
with check (bucket_id = 'marketing-brand-assets' and public.is_marketing_admin());

create trigger update_marketing_brand_assets_updated_at
before update on public.marketing_brand_assets
for each row execute function public.update_updated_at_column();

create trigger update_marketing_reel_versions_updated_at
before update on public.marketing_reel_versions
for each row execute function public.update_updated_at_column();

-- Serialises per-content version numbering and the single-current invariant.
create or replace function public.create_marketing_reel_version(
  p_content_id uuid,
  p_composition jsonb,
  p_source_asset_ids uuid[],
  p_logo_settings jsonb,
  p_audio_settings jsonb,
  p_user_prompt text,
  p_created_by uuid,
  p_status text default 'draft',
  p_is_current boolean default false
)
returns public.marketing_reel_versions
language plpgsql
security definer
set search_path = public
as $$
declare
  next_number integer;
  created_version public.marketing_reel_versions%rowtype;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_marketing_admin() then
    raise exception 'Marketing administrator access is required.';
  end if;
  perform 1 from public.marketing_content where id = p_content_id for update;
  if not found then raise exception 'Marketing content was not found.'; end if;
  select coalesce(max(version_number), 0) + 1 into next_number
  from public.marketing_reel_versions where content_id = p_content_id;
  if p_is_current then
    update public.marketing_reel_versions set is_current = false where content_id = p_content_id and is_current;
  end if;
  insert into public.marketing_reel_versions (
    content_id, version_number, status, is_current, composition, source_asset_ids,
    logo_settings, audio_settings, user_prompt, created_by
  ) values (
    p_content_id, next_number, p_status, p_is_current, p_composition,
    coalesce(p_source_asset_ids, '{}'::uuid[]), p_logo_settings, p_audio_settings,
    p_user_prompt, p_created_by
  ) returning * into created_version;
  return created_version;
end;
$$;

revoke execute on function public.create_marketing_reel_version(uuid, jsonb, uuid[], jsonb, jsonb, text, uuid, text, boolean) from public, anon;
grant execute on function public.create_marketing_reel_version(uuid, jsonb, uuid[], jsonb, jsonb, text, uuid, text, boolean) to authenticated, service_role;

-- Locks each scheduled row immediately before state mutation. A job already
-- running, a publishing transition, or a publication history blocks deletion.
create or replace function public.manage_scheduled_marketing_content(
  p_ids uuid[],
  p_action text,
  p_updated_by uuid
)
returns table (content_id uuid, outcome text)
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate_id uuid;
  target public.marketing_content%rowtype;
  job_row record;
  has_running_publish boolean;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_marketing_admin() then
    raise exception 'Marketing administrator access is required.';
  end if;
  if p_action not in ('unschedule', 'delete') then raise exception 'Unsupported scheduled-content action.'; end if;

  foreach candidate_id in array p_ids loop
    select * into target from public.marketing_content where id = candidate_id for update;
    if not found then
      content_id := candidate_id; outcome := 'skipped_not_found'; return next;
    elsif target.status <> 'scheduled' then
      content_id := candidate_id; outcome := 'skipped_not_scheduled'; return next;
    end if;

    -- Lock queued/running publication jobs before inspecting them. A worker
    -- cannot claim a queued job between this safety check and cancellation.
    has_running_publish := false;
    for job_row in
      select status from public.marketing_jobs
      where content_id = candidate_id and type = 'publish_instagram' and status in ('queued', 'running')
      for update
    loop
      has_running_publish := has_running_publish or job_row.status = 'running';
    end loop;

    if has_running_publish then
      content_id := candidate_id; outcome := 'skipped_publishing'; return next;
    elsif p_action = 'delete' and exists (select 1 from public.marketing_publications where content_id = candidate_id) then
      content_id := candidate_id; outcome := 'skipped_publication_history'; return next;
    end if;

    update public.marketing_jobs
    set status = 'cancelled', error = 'Cancelled because scheduled content was removed.', locked_at = null, locked_by = null
    where content_id = candidate_id and type = 'publish_instagram' and status = 'queued';
    delete from public.marketing_schedules where content_id = candidate_id;

    if p_action = 'unschedule' then
      update public.marketing_content
      set status = 'approved', proposed_publish_at = null, updated_by = p_updated_by
      where id = candidate_id and status = 'scheduled';
      content_id := candidate_id; outcome := 'unscheduled'; return next;
    else
      delete from public.marketing_content where id = candidate_id and status = 'scheduled';
      content_id := candidate_id; outcome := 'deleted'; return next;
    end if;
  end loop;
end;
$$;

revoke execute on function public.manage_scheduled_marketing_content(uuid[], text, uuid) from public, anon;
grant execute on function public.manage_scheduled_marketing_content(uuid[], text, uuid) to authenticated, service_role;
