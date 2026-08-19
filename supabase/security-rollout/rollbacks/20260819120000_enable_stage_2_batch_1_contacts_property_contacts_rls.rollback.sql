-- Stage 2, Batch 1 emergency security-containment rollback.
--
-- This removes the Batch 1 CRM-user policies and leaves RLS enabled with no
-- authenticated access. It intentionally does NOT disable RLS or restore the
-- legacy broad authenticated grants (REFERENCES, TRIGGER, TRUNCATE): those
-- actions would recreate the sensitive-table exposure this rollout removes.
--
-- Use only to contain an immediate policy regression. A functional recovery
-- must be a separately reviewed corrective migration for the affected browser
-- workflow, followed by a new security review.

begin;

drop policy if exists "CRM users select contacts" on public.contacts;
drop policy if exists "CRM users insert contacts" on public.contacts;
drop policy if exists "CRM users update contacts" on public.contacts;
drop policy if exists "CRM users delete contacts" on public.contacts;

drop policy if exists "CRM users select property contacts" on public.property_contacts;
drop policy if exists "CRM users insert property contacts" on public.property_contacts;
drop policy if exists "CRM users update property contacts" on public.property_contacts;
drop policy if exists "CRM users delete property contacts" on public.property_contacts;

revoke all on table public.contacts, public.property_contacts from anon;
revoke all on table public.contacts, public.property_contacts from authenticated;

commit;
