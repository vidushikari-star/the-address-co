-- Completes the legacy CRM schema that existed before migrations were tracked.
--
-- This is a fresh-environment baseline companion to
-- 00000000000000_legacy_crm_prerequisites.sql. It intentionally does not
-- mutate an existing linked production project: the changes that alter legacy
-- tables and access controls run only while the fresh marker exists.
--
-- Do not use this migration as a substitute for a reviewed production RLS
-- hardening rollout. See docs/supabase-schema-reconciliation.md.

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

-- The rest of this migration intentionally applies only to an empty project
-- that was marked by the prerequisite migration. It never changes existing
-- production defaults, data, or policies.
do $$
declare
  table_name text;
begin
  if to_regclass('public._schema_reconciliation_fresh_marker') is null then
    raise notice 'Skipping fresh-only legacy CRM reconciliation on an existing schema';
    return;
  end if;

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

  foreach table_name in array array[
    'profiles', 'contacts', 'properties', 'property_images', 'property_documents',
    'property_contacts', 'property_commissions', 'communications_templates',
    'activities', 'calendar_events', 'commission_distributions', 'commissions',
    'company_settings', 'deals', 'expenses', 'notes', 'property_shares',
    'site_visits', 'tasks'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true)',
      table_name || '_authenticated_full_access',
      table_name
    );
  end loop;

  alter table public.user_profiles enable row level security;
  create policy user_profiles_authenticated_read
    on public.user_profiles for select to authenticated using (true);
  create policy user_profiles_self_update
    on public.user_profiles for update to authenticated
    using (id = auth.uid()) with check (id = auth.uid());

  alter table public.whatsapp_conversations enable row level security;
  create policy whatsapp_conversations_own_read
    on public.whatsapp_conversations for select to authenticated using (owner_id = auth.uid());
  create policy whatsapp_conversations_own_insert
    on public.whatsapp_conversations for insert to authenticated with check (owner_id = auth.uid());
  create policy whatsapp_conversations_own_update
    on public.whatsapp_conversations for update to authenticated
    using (owner_id = auth.uid()) with check (owner_id = auth.uid());

  alter table public.whatsapp_messages enable row level security;
  create policy whatsapp_messages_own_read
    on public.whatsapp_messages for select to authenticated
    using (conversation_id in (
      select id from public.whatsapp_conversations where owner_id = auth.uid()
    ));
  create policy whatsapp_messages_own_insert
    on public.whatsapp_messages for insert to authenticated
    with check (conversation_id in (
      select id from public.whatsapp_conversations where owner_id = auth.uid()
    ));
  create policy whatsapp_messages_own_update
    on public.whatsapp_messages for update to authenticated
    using (conversation_id in (
      select id from public.whatsapp_conversations where owner_id = auth.uid()
    ))
    with check (conversation_id in (
      select id from public.whatsapp_conversations where owner_id = auth.uid()
    ));

  -- Integration inboxes stay service-role-only. Enabling RLS without a policy
  -- denies anon/authenticated access while the service role continues to bypass RLS.
  alter table public.housing_inventory_submissions enable row level security;
  alter table public.integration_request_logs enable row level security;
  revoke all on table public.housing_inventory_submissions from anon, authenticated;
  revoke all on table public.integration_request_logs from anon, authenticated;

  insert into storage.buckets (id, name, public)
  values
    ('property-documents', 'property-documents', false),
    ('property-images', 'property-images', true)
  on conflict (id) do update set public = excluded.public;

  create policy property_documents_authenticated_access
    on storage.objects for all to authenticated
    using (bucket_id = 'property-documents')
    with check (bucket_id = 'property-documents');
  create policy property_images_public_read
    on storage.objects for select to public
    using (bucket_id = 'property-images');
  create policy property_images_authenticated_write
    on storage.objects for insert to authenticated
    with check (bucket_id = 'property-images');
  create policy property_images_authenticated_delete
    on storage.objects for delete to authenticated
    using (bucket_id = 'property-images');
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

drop table if exists public._schema_reconciliation_fresh_marker;
