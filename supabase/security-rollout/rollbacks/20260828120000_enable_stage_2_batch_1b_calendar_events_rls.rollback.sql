-- Stage 2, Batch 1B emergency security-containment rollback.
--
-- This artifact is deliberately outside supabase/migrations. It removes only
-- the Batch 1B Calendar policies and leaves RLS enabled with no browser access
-- to generic Calendar events. It intentionally does NOT restore legacy broad
-- authenticated privileges, anonymous access, or service-role grants.
--
-- Invoking this rollback makes generic Calendar events unavailable to normal
-- CRM users until a separately reviewed corrective migration is applied.

begin;

drop policy if exists "CRM users select calendar events" on public.calendar_events;
drop policy if exists "CRM users insert calendar events" on public.calendar_events;
drop policy if exists "CRM users update calendar events" on public.calendar_events;
drop policy if exists "CRM users delete calendar events" on public.calendar_events;

revoke all on table public.calendar_events from anon;
revoke all on table public.calendar_events from authenticated;

commit;
