-- Completes the legacy CRM schema that existed before migrations were tracked.
-- Run this script after the normal migration chain using
-- scripts/bootstrap-supabase-fresh.sh.
--
-- This is deliberately outside supabase/migrations. It is a fresh-schema
-- snapshot, not a production migration and not an RLS hardening rollout.
-- The legacy RLS and storage state below mirrors the linked production project
-- so that security remediation can be designed and reviewed separately.

create table if not exists public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  phone_number text not null,
  contact_id uuid references public.contacts(id),
  contact_name text,
  status text default 'new'::text,
  last_message text,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  lead_type text,
  property_type text,
  location text,
  budget text,
  bedrooms integer,
  qualification jsonb
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete cascade,
  property_id uuid references public.properties(id),
  stage text default 'lead'::text,
  probability integer default 0,
  advisor text,
  expected_close_date date,
  property_price numeric default 0,
  commission_amount numeric default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text,
  priority text default 'medium'::text,
  tasks jsonb default '[]'::jsonb,
  last_activity timestamptz,
  closed_at timestamptz,
  closing_price numeric,
  final_commission numeric,
  lost_reason text,
  lost_notes text,
  advisor_id uuid references public.user_profiles(id),
  whatsapp_conversation_id uuid references public.whatsapp_conversations(id),
  commission_percentage numeric default 0,
  housing_lead_id text,
  constraint deals_stage_check check (stage in (
    'lead', 'qualification', 'property_shared', 'site_visit', 'negotiation',
    'documentation', 'closed_won', 'closed_lost'
  ))
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  property_id uuid references public.properties(id),
  type text not null,
  title text not null,
  description text,
  body text,
  activity_date timestamptz default now(),
  user_id text,
  created_at timestamptz default now(),
  created_by uuid references public.profiles(id)
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_type text not null default 'meeting'::text,
  start_time timestamptz not null,
  end_time timestamptz,
  assigned_to uuid references public.user_profiles(id),
  created_by uuid references public.user_profiles(id),
  contact_id uuid references public.contacts(id),
  property_id uuid references public.properties(id),
  deal_id uuid references public.deals(id),
  status text default 'scheduled'::text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references public.deals(id) on delete cascade,
  contact_id uuid references public.contacts(id),
  property_id uuid references public.properties(id),
  commission_type text not null default 'sale'::text,
  amount numeric not null default 0,
  status text not null default 'pending'::text,
  due_date date,
  received_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  advisor_id uuid references public.user_profiles(id),
  invoice_number text,
  invoice_date date,
  payment_reference text,
  payment_mode text,
  payment_date date,
  commission_basis text,
  commission_percentage numeric,
  commission_role text,
  constraint commissions_unique_deal_contact_role unique (deal_id, contact_id, commission_role)
);

create table if not exists public.commission_distributions (
  id uuid primary key default gen_random_uuid(),
  commission_id uuid references public.commissions(id) on delete cascade,
  user_id uuid references public.user_profiles(id),
  role text not null,
  percentage numeric,
  amount numeric not null default 0,
  status text not null default 'pending'::text,
  paid_date timestamptz,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.company_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  category text not null,
  description text,
  amount numeric not null default 0,
  payment_method text,
  status text default 'paid'::text,
  notes text,
  created_by uuid,
  created_at timestamp without time zone default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references public.profiles(id)
);

create table if not exists public.property_shares (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references public.deals(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  status text default 'shared'::text,
  buyer_feedback text,
  notes text,
  shared_at timestamptz default now(),
  created_at timestamptz default now(),
  created_by text,
  whatsapp_conversation_id uuid
);

create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references public.deals(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  scheduled_date date not null,
  scheduled_time text,
  status text default 'scheduled'::text,
  notes text,
  buyer_feedback text,
  advisor_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  title text not null,
  description text,
  status text default 'pending'::text,
  priority text default 'medium'::text,
  due_date date,
  assigned_to text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references public.profiles(id),
  archived boolean default false
);

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.whatsapp_conversations(id) on delete cascade,
  direction text not null,
  message text not null,
  message_type text default 'text'::text,
  sent_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

do $$
begin
  alter type public.lead_stage add value if not exists 'active';
  alter type public.lead_stage add value if not exists 'inactive';

  alter table public.profiles
    add column if not exists whatsapp text,
    add column if not exists whatsapp_connected boolean default false;

  alter table public.contacts
    add column if not exists relationship_types text[] default '{}'::text[],
    add column if not exists housing_lead_id text,
    add column if not exists created_by uuid,
    add column if not exists owner_id uuid,
    add column if not exists is_private boolean default false,
    add column if not exists transaction_type text,
    add column if not exists intent text,
    add column if not exists last_activity_at timestamptz,
    add column if not exists assigned_advisor uuid;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'contacts'
      and column_name = 'full_name'
      and is_generated = 'ALWAYS'
  ) then
    alter table public.contacts alter column full_name drop expression;
  end if;

  alter table public.contacts
    alter column full_name set default trim(both from (first_name || ' '::text) || coalesce(last_name, ''::text));

  if not exists (select 1 from pg_constraint where conname = 'contacts_created_by_fkey') then
    alter table public.contacts add constraint contacts_created_by_fkey foreign key (created_by) references public.profiles(id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'contacts_owner_id_fkey') then
    alter table public.contacts add constraint contacts_owner_id_fkey foreign key (owner_id) references public.profiles(id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'contacts_assigned_advisor_fkey') then
    alter table public.contacts add constraint contacts_assigned_advisor_fkey foreign key (assigned_advisor) references public.user_profiles(id);
  end if;

  -- The following policies mirror live production. Their breadth is documented
  -- as a future security concern, but is not silently changed by this baseline.
  alter table public.activities enable row level security;
  create policy "Allow public create activities"
    on public.activities for insert to anon, authenticated with check (true);
  create policy "Allow public view activities"
    on public.activities for select to anon, authenticated using (true);
  create policy "Authenticated users can delete activities"
    on public.activities for delete to authenticated using (true);
  create policy "Authenticated users can update activities"
    on public.activities for update to authenticated using (true);

  -- Policies exist in production even though this table has RLS disabled.
  create policy "Allow anonymous commission insert"
    on public.commissions for insert to anon with check (true);
  create policy "Allow authenticated users to insert commissions"
    on public.commissions for insert to authenticated with check (true);
  create policy "Allow authenticated users to update commissions"
    on public.commissions for update to authenticated using (true) with check (true);
  create policy "Allow authenticated users to view commissions"
    on public.commissions for select to authenticated using (true);

  alter table public.deals enable row level security;
  create policy "Allow public deal deletes"
    on public.deals for delete to anon using (true);
  create policy "Allow public deal inserts"
    on public.deals for insert to anon with check (true);
  create policy "Allow public deal reads"
    on public.deals for select to anon using (true);
  create policy "Allow public deal updates"
    on public.deals for update to anon using (true) with check (true);
  create policy "Authenticated users can create deals"
    on public.deals for insert to authenticated with check (true);
  create policy "Authenticated users can delete deals"
    on public.deals for delete to authenticated using (true);
  create policy "Authenticated users can update deals"
    on public.deals for update to authenticated using (true);
  create policy "Authenticated users can view deals"
    on public.deals for select to authenticated using (true);

  alter table public.notes enable row level security;
  create policy "Authenticated users can create notes"
    on public.notes for insert to authenticated with check (true);
  create policy "Authenticated users can delete notes"
    on public.notes for delete to authenticated using (true);
  create policy "Authenticated users can update notes"
    on public.notes for update to authenticated using (true);
  create policy "Authenticated users can view notes"
    on public.notes for select to authenticated using (true);

  alter table public.properties enable row level security;
  create policy "Allow public property deletes"
    on public.properties for delete to anon using (true);
  create policy "Allow public property inserts"
    on public.properties for insert to anon with check (true);
  create policy "Allow public property reads"
    on public.properties for select to anon using (true);
  create policy "Allow public property updates"
    on public.properties for update to anon using (true) with check (true);
  create policy "Authenticated users can create properties"
    on public.properties for insert to authenticated with check (true);
  create policy "Authenticated users can delete properties"
    on public.properties for delete to authenticated using (true);
  create policy "Authenticated users can update properties"
    on public.properties for update to authenticated using (true);
  create policy "Authenticated users can view properties"
    on public.properties for select to authenticated using (true);

  alter table public.property_shares enable row level security;
  create policy "Allow authenticated property share management"
    on public.property_shares for all to authenticated using (true) with check (true);

  alter table public.site_visits enable row level security;
  create policy "Allow authenticated users"
    on public.site_visits for all to public using (true) with check (true);

  alter table public.tasks enable row level security;
  create policy "Authenticated users can create tasks"
    on public.tasks for insert to authenticated with check (true);
  create policy "Authenticated users can delete tasks"
    on public.tasks for delete to authenticated using (true);
  create policy "Authenticated users can update tasks"
    on public.tasks for update to authenticated using (true);
  create policy "Authenticated users can view tasks"
    on public.tasks for select to authenticated using (true);

  alter table public.user_profiles enable row level security;
  create policy "Allow public read profiles"
    on public.user_profiles for select to anon using (true);
  create policy "Users can read profiles"
    on public.user_profiles for select to authenticated using (true);

  alter table public.whatsapp_conversations enable row level security;
  create policy "Users create own WhatsApp conversations"
    on public.whatsapp_conversations for insert to public with check (owner_id = auth.uid());
  create policy "Users see own WhatsApp conversations"
    on public.whatsapp_conversations for select to public using (owner_id = auth.uid());
  create policy "Users update own WhatsApp conversations"
    on public.whatsapp_conversations for update to public
    using (owner_id = auth.uid()) with check (owner_id = auth.uid());

  alter table public.whatsapp_messages enable row level security;
  create policy "Users insert own WhatsApp messages"
    on public.whatsapp_messages for insert to public
    with check (conversation_id in (
      select id from public.whatsapp_conversations where owner_id = auth.uid()
    ));
  create policy "Users see own WhatsApp messages"
    on public.whatsapp_messages for select to public
    using (conversation_id in (
      select id from public.whatsapp_conversations where owner_id = auth.uid()
    ));
  create policy "Users update own WhatsApp messages"
    on public.whatsapp_messages for update to public
    using (conversation_id in (
      select id from public.whatsapp_conversations where owner_id = auth.uid()
    ));

  insert into storage.buckets (id, name, public)
  values
    ('property-documents', 'property-documents', true),
    ('property-images', 'property-images', true)
  on conflict (id) do update set public = excluded.public;

  create policy "Allow authenticated document deletes"
    on storage.objects for delete to authenticated
    using (bucket_id = 'property-documents' and auth.role() = 'authenticated');
  create policy "Allow authenticated document reads"
    on storage.objects for select to authenticated
    using (bucket_id = 'property-documents' and auth.role() = 'authenticated');
  create policy "Allow authenticated document uploads"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'property-documents' and auth.role() = 'authenticated');
  create policy "Allow authenticated users to delete property images"
    on storage.objects for delete to authenticated using (bucket_id = 'property-images');
  create policy "Allow authenticated users to upload property images"
    on storage.objects for insert to authenticated with check (bucket_id = 'property-images');
  create policy "Allow public viewing of property images"
    on storage.objects for select to public using (bucket_id = 'property-images');
end
$$;

create index if not exists activities_contact_id_idx on public.activities (contact_id);
create index if not exists activities_deal_id_idx on public.activities (deal_id);
create index if not exists calendar_events_assigned_to_idx on public.calendar_events (assigned_to);
create index if not exists calendar_events_contact_idx on public.calendar_events (contact_id);
create index if not exists calendar_events_start_time_idx on public.calendar_events (start_time);
create index if not exists idx_contacts_housing_lead_id on public.contacts (housing_lead_id);
create index if not exists deals_contact_id_idx on public.deals (contact_id);
create index if not exists deals_property_id_idx on public.deals (property_id);
create index if not exists deals_stage_idx on public.deals (stage);
create index if not exists notes_contact_id_idx on public.notes (contact_id);
create index if not exists notes_deal_id_idx on public.notes (deal_id);
create index if not exists tasks_contact_id_idx on public.tasks (contact_id);
create index if not exists tasks_deal_id_idx on public.tasks (deal_id);
create index if not exists idx_whatsapp_conversations_owner on public.whatsapp_conversations (owner_id);
create index if not exists idx_whatsapp_messages_conversation on public.whatsapp_messages (conversation_id);
create index if not exists idx_whatsapp_messages_created on public.whatsapp_messages (created_at);
