-- Manual rollback for 20261023040532_add_commission_recipients_and_financial_integrity.
-- Do not run this while external recipient distributions exist.

drop trigger if exists enforce_commission_amount_allocation_cap on public.commissions;
drop trigger if exists enforce_commission_distribution_total on public.commission_distributions;
drop trigger if exists enforce_commission_distribution_recipient on public.commission_distributions;

drop function if exists public.enforce_commission_amount_allocation_cap();
drop function if exists public.enforce_commission_distribution_total();
drop function if exists public.enforce_commission_distribution_recipient();

drop index if exists public.commission_distributions_unique_external_recipient;
drop index if exists public.commission_distributions_unique_crm_recipient;

alter table public.commission_distributions
  drop constraint if exists commission_distributions_percentage_range_check,
  drop constraint if exists commission_distributions_nonnegative_amount_check,
  drop constraint if exists commission_distributions_exactly_one_recipient_check,
  drop constraint if exists commission_distributions_recipient_kind_check,
  drop column if exists external_recipient_id,
  drop column if exists recipient_kind;

drop table if exists public.commission_recipients;
