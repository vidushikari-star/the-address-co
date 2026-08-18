-- Persist incomplete CRM creation workflows without creating partial contacts,
-- deals, or properties. Task due dates remain date-only unless a user explicitly
-- supplies a local time.

begin;

alter table public.tasks
  add column if not exists due_time time without time zone;

create table if not exists public.crm_drafts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.user_profiles(id) on delete cascade,
  workflow text not null check (workflow in ('relationship', 'deal', 'property')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, workflow)
);

create index if not exists crm_drafts_owner_updated_at_idx
  on public.crm_drafts (owner_id, updated_at desc);

alter table public.crm_drafts enable row level security;

revoke all on table public.crm_drafts from anon;
grant select, insert, update, delete on table public.crm_drafts to authenticated;

drop policy if exists "CRM users manage their own drafts" on public.crm_drafts;
create policy "CRM users manage their own drafts"
  on public.crm_drafts
  for all
  to authenticated
  using (public.is_crm_user() and owner_id = auth.uid())
  with check (public.is_crm_user() and owner_id = auth.uid());

commit;
