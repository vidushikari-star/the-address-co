-- Scheduling is a single state transition: an approved item must never be
-- left with only some of content.status, scheduled_for, job, or audit state.
create or replace function public.schedule_marketing_content(
  p_content_id uuid,
  p_scheduled_for timestamptz,
  p_timezone text,
  p_created_by uuid
)
returns public.marketing_content
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.marketing_content%rowtype;
  scheduled public.marketing_content%rowtype;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_marketing_admin() then
    raise exception 'Marketing administrator access is required.';
  end if;
  if p_scheduled_for <= now() then
    raise exception 'Choose a future publication time.';
  end if;

  select * into target
  from public.marketing_content as content
  where content.id = p_content_id
  for update;
  if not found then
    raise exception 'Content not found.';
  end if;
  if target.status <> 'approved' then
    raise exception 'Only approved content can be scheduled.';
  end if;
  if exists (
    select 1
    from public.marketing_jobs as job
    where job.content_id = p_content_id
      and job.type = 'publish_instagram'
      and job.status in ('queued', 'running')
  ) then
    raise exception 'A publish job is already active for this content.';
  end if;

  update public.marketing_content as content
  set status = 'scheduled',
      proposed_publish_at = p_scheduled_for,
      updated_by = p_created_by,
      last_error = null
  where content.id = p_content_id
    and content.status = 'approved'
  returning * into scheduled;

  insert into public.marketing_schedules (content_id, scheduled_for, timezone, created_by)
  values (p_content_id, p_scheduled_for, p_timezone, p_created_by)
  on conflict (content_id) do update set
    scheduled_for = excluded.scheduled_for,
    timezone = excluded.timezone,
    created_by = excluded.created_by;

  insert into public.marketing_jobs (
    content_id, type, status, input, idempotency_key, run_after, max_attempts
  ) values (
    p_content_id,
    'publish_instagram',
    'queued',
    '{}'::jsonb,
    'scheduled-publish:' || p_content_id::text || ':' || p_scheduled_for::text,
    p_scheduled_for,
    10
  );

  insert into public.marketing_audit_logs (actor_id, content_id, action, metadata)
  values (
    p_created_by,
    p_content_id,
    'content.scheduled',
    jsonb_build_object('scheduledFor', p_scheduled_for, 'timezone', p_timezone)
  );

  return scheduled;
end;
$$;

revoke execute on function public.schedule_marketing_content(uuid, timestamptz, text, uuid) from public, anon;
grant execute on function public.schedule_marketing_content(uuid, timestamptz, text, uuid) to authenticated, service_role;
