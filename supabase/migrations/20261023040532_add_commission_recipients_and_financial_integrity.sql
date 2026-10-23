-- External financial counterparties and distribution integrity.
--
-- This migration is deliberately additive. Existing historical distributions
-- retain their user_id references and receive the compatible crm_user default.

begin;

create table if not exists public.commission_recipients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  recipient_type text not null default 'broker'
    check (recipient_type in ('broker', 'co_broker', 'referral_partner', 'channel_partner', 'consultant', 'other')),
  company_name text,
  phone text,
  email text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger update_commission_recipients_updated_at
before update on public.commission_recipients
for each row execute function public.update_updated_at_column();

revoke all on table public.commission_recipients from public, anon, authenticated;
grant select, insert, update, delete on table public.commission_recipients to authenticated;
grant all on table public.commission_recipients to service_role;

alter table public.commission_recipients enable row level security;

create policy "CRM users create commission recipients"
  on public.commission_recipients for insert to authenticated
  with check (public.is_crm_user());
create policy "CRM users view commission recipients"
  on public.commission_recipients for select to authenticated
  using (public.is_crm_user());
create policy "CRM users update commission recipients"
  on public.commission_recipients for update to authenticated
  using (public.is_crm_user())
  with check (public.is_crm_user());
create policy "CRM users delete commission recipients"
  on public.commission_recipients for delete to authenticated
  using (public.is_crm_user());

alter table public.commission_distributions
  add column if not exists recipient_kind text not null default 'crm_user',
  add column if not exists external_recipient_id uuid
    references public.commission_recipients(id) on delete restrict;

alter table public.commission_distributions
  add constraint commission_distributions_recipient_kind_check
    check (recipient_kind in ('crm_user', 'external')) not valid,
  add constraint commission_distributions_exactly_one_recipient_check
    check (
      (recipient_kind = 'crm_user' and user_id is not null and external_recipient_id is null)
      or
      (recipient_kind = 'external' and user_id is null and external_recipient_id is not null)
    ) not valid,
  add constraint commission_distributions_nonnegative_amount_check
    check (amount >= 0) not valid,
  add constraint commission_distributions_percentage_range_check
    check (percentage is null or (percentage > 0 and percentage <= 100)) not valid;

alter table public.commission_distributions
  validate constraint commission_distributions_recipient_kind_check,
  validate constraint commission_distributions_exactly_one_recipient_check,
  validate constraint commission_distributions_nonnegative_amount_check,
  validate constraint commission_distributions_percentage_range_check;

create unique index if not exists commission_distributions_unique_crm_recipient
  on public.commission_distributions(commission_id, user_id)
  where user_id is not null;

create unique index if not exists commission_distributions_unique_external_recipient
  on public.commission_distributions(commission_id, external_recipient_id)
  where external_recipient_id is not null;

-- New distributions may only target active CRM users or active external
-- financial recipients. The trigger intentionally runs only when recipient
-- identity changes so historical inactive recipients remain payable/displayable.
create or replace function public.enforce_commission_distribution_recipient()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.recipient_kind = 'crm_user' then
    if not exists (
      select 1
      from public.user_profiles
      where id = new.user_id
        and is_active = true
    ) then
      raise exception 'Commission distributions require an active CRM recipient';
    end if;
  elsif not exists (
    select 1
    from public.commission_recipients
    where id = new.external_recipient_id
      and is_active = true
  ) then
    raise exception 'Commission distributions require an active external recipient';
  end if;

  return new;
end;
$$;

create trigger enforce_commission_distribution_recipient
before insert or update of recipient_kind, user_id, external_recipient_id
on public.commission_distributions
for each row execute function public.enforce_commission_distribution_recipient();

-- Lock the parent commission before calculating the aggregate so concurrent
-- inserts cannot independently pass the cap check.
create or replace function public.enforce_commission_distribution_total()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent_amount numeric;
  allocated_amount numeric;
begin
  select amount into parent_amount
  from public.commissions
  where id = new.commission_id
  for update;

  if not found then
    raise exception 'Commission distribution must reference an existing commission';
  end if;

  select coalesce(sum(amount), 0) into allocated_amount
  from public.commission_distributions
  where commission_id = new.commission_id
    and id is distinct from new.id;

  if allocated_amount + new.amount > parent_amount then
    raise exception 'Commission distributions cannot exceed the parent commission amount';
  end if;

  return new;
end;
$$;

create trigger enforce_commission_distribution_total
before insert or update of commission_id, amount
on public.commission_distributions
for each row execute function public.enforce_commission_distribution_total();

create or replace function public.enforce_commission_amount_allocation_cap()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  allocated_amount numeric;
begin
  select coalesce(sum(amount), 0) into allocated_amount
  from public.commission_distributions
  where commission_id = new.id;

  if allocated_amount > new.amount then
    raise exception 'Commission amount cannot be reduced below its allocated distributions';
  end if;

  return new;
end;
$$;

create trigger enforce_commission_amount_allocation_cap
before update of amount on public.commissions
for each row execute function public.enforce_commission_amount_allocation_cap();

revoke all on function public.enforce_commission_distribution_recipient() from public, anon, authenticated;
revoke all on function public.enforce_commission_distribution_total() from public, anon, authenticated;
revoke all on function public.enforce_commission_amount_allocation_cap() from public, anon, authenticated;

commit;
