-- Site visits use public.site_visits as the canonical operational record.
-- Calendar is a projection of that table; calendar_events is reserved for
-- meetings, follow-ups, tasks, and other general events.

begin;

-- Application code has always supplied property_id for property activities,
-- but the deployed legacy table was missing the column. Add the relationship
-- before creating Calendar-originated site-visit activities.
alter table public.activities
  add column if not exists property_id uuid
  references public.properties(id) on delete cascade;

create index if not exists activities_property_id_idx
  on public.activities (property_id);

-- Reconcile only legacy Calendar "site_visit" events that contain the
-- required canonical relationships. Incomplete legacy events are deliberately
-- retained for manual review rather than manufacturing invalid site visits.
with eligible_events as (
  select
    event.id,
    event.title,
    event.description,
    event.start_time,
    event.status,
    event.assigned_to,
    event.created_by,
    event.contact_id,
    event.property_id,
    event.deal_id,
    (event.start_time at time zone 'Asia/Kolkata')::date as scheduled_date,
    to_char(event.start_time at time zone 'Asia/Kolkata', 'HH24:MI') as scheduled_time
  from public.calendar_events as event
  where event.event_type = 'site_visit'
    and event.contact_id is not null
    and event.property_id is not null
)
insert into public.site_visits (
  deal_id,
  contact_id,
  property_id,
  scheduled_date,
  scheduled_time,
  status,
  notes,
  advisor_id
)
select
  event.deal_id,
  event.contact_id,
  event.property_id,
  event.scheduled_date,
  event.scheduled_time,
  case event.status
    when 'completed' then 'completed'
    when 'cancelled' then 'cancelled'
    else 'scheduled'
  end,
  nullif(event.description, ''),
  event.assigned_to
from eligible_events as event
where not exists (
  select 1
  from public.site_visits as visit
  where visit.contact_id = event.contact_id
    and visit.property_id = event.property_id
    and visit.deal_id is not distinct from event.deal_id
    and visit.advisor_id is not distinct from event.assigned_to
    and visit.scheduled_date = event.scheduled_date
    and coalesce(visit.scheduled_time, '') = event.scheduled_time
);

with eligible_events as (
  select
    event.title,
    event.description,
    event.start_time,
    event.status,
    event.created_by,
    event.contact_id,
    event.property_id,
    event.deal_id,
    (event.start_time at time zone 'Asia/Kolkata')::date as scheduled_date,
    to_char(event.start_time at time zone 'Asia/Kolkata', 'HH24:MI') as scheduled_time
  from public.calendar_events as event
  where event.event_type = 'site_visit'
    and event.contact_id is not null
    and event.property_id is not null
)
insert into public.activities (
  contact_id,
  deal_id,
  property_id,
  type,
  title,
  description,
  body,
  activity_date,
  user_id,
  created_by
)
select
  event.contact_id,
  event.deal_id,
  event.property_id,
  'site_visit',
  case event.status
    when 'completed' then 'Site visit completed'
    when 'cancelled' then 'Site visit cancelled'
    else 'Site visit scheduled'
  end,
  event.title,
  concat_ws(E'\n\n',
    'Migrated from Calendar.',
    'Scheduled for ' || event.scheduled_date || ' at ' || event.scheduled_time,
    nullif(event.description, '')
  ),
  event.start_time,
  event.created_by::text,
  case
    when exists (select 1 from public.profiles where id = event.created_by)
      then event.created_by
    else null
  end
from eligible_events as event
where not exists (
  select 1
  from public.activities as activity
  where activity.type = 'site_visit'
    and activity.contact_id = event.contact_id
    and activity.deal_id is not distinct from event.deal_id
    and activity.property_id = event.property_id
    and activity.title = case event.status
      when 'completed' then 'Site visit completed'
      when 'cancelled' then 'Site visit cancelled'
      else 'Site visit scheduled'
    end
    and activity.activity_date = event.start_time
);

delete from public.calendar_events as event
where event.event_type = 'site_visit'
  and event.contact_id is not null
  and event.property_id is not null;

commit;
