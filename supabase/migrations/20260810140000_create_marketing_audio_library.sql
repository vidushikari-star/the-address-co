-- Private administrator-managed audio only. This deliberately does not model
-- or access Instagram's licensed/trending music catalogue.
create table public.marketing_audio_tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  artist_source text check (artist_source is null or char_length(artist_source) <= 240),
  storage_path text not null unique,
  filename text not null check (char_length(filename) between 1 and 255),
  mime_type text not null check (mime_type in ('audio/mpeg', 'audio/mp4', 'audio/wav')),
  file_size bigint not null check (file_size > 0 and file_size <= 26214400),
  duration_seconds numeric(8, 3) not null check (duration_seconds > 0 and duration_seconds <= 3600),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index marketing_audio_tracks_created_at_idx on public.marketing_audio_tracks(created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'marketing-audio',
  'marketing-audio',
  false,
  26214400,
  array['audio/mpeg', 'audio/mp4', 'audio/wav']
)
on conflict (id) do update
set public = false,
    file_size_limit = 26214400,
    allowed_mime_types = array['audio/mpeg', 'audio/mp4', 'audio/wav'];

alter table public.marketing_audio_tracks enable row level security;

create policy marketing_audio_tracks_admin_only
on public.marketing_audio_tracks for all to authenticated
using (public.is_marketing_admin())
with check (public.is_marketing_admin());

create policy marketing_audio_files_admin_only
on storage.objects for all to authenticated
using (bucket_id = 'marketing-audio' and public.is_marketing_admin())
with check (bucket_id = 'marketing-audio' and public.is_marketing_admin());

create trigger update_marketing_audio_tracks_updated_at
before update on public.marketing_audio_tracks
for each row execute function public.update_updated_at_column();
