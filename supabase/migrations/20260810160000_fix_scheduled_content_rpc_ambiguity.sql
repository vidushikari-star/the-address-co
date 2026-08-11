-- The previous RPC exposed an output parameter named `content_id`, which
-- shadows unqualified table columns in PL/pgSQL. Qualify every storage table
-- reference so scheduled delete/unschedule can keep its row-lock safety.
create or replace function public.manage_scheduled_marketing_content(
  p_ids uuid[],
  p_action text,
  p_updated_by uuid
)
returns table (content_id uuid, outcome text)
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate_id uuid;
  target public.marketing_content%rowtype;
  job_row record;
  has_running_publish boolean;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_marketing_admin() then
    raise exception 'Marketing administrator access is required.';
  end if;
  if p_action not in ('unschedule', 'delete') then
    raise exception 'Unsupported scheduled-content action.';
  end if;

  foreach candidate_id in array p_ids loop
    select * into target
    from public.marketing_content as content
    where content.id = candidate_id
    for update;

    if not found then
      content_id := candidate_id; outcome := 'skipped_not_found'; return next;
    elsif target.status <> 'scheduled' then
      content_id := candidate_id; outcome := 'skipped_not_scheduled'; return next;
    end if;

    -- Lock every cancellable publish job before deciding. This means a worker
    -- cannot claim a queued job between this check and cancellation.
    has_running_publish := false;
    for job_row in
      select job.status
      from public.marketing_jobs as job
      where job.content_id = candidate_id
        and job.type = 'publish_instagram'
        and job.status in ('queued', 'running')
      for update
    loop
      has_running_publish := has_running_publish or job_row.status = 'running';
    end loop;

    if has_running_publish then
      content_id := candidate_id; outcome := 'skipped_publishing'; return next;
    elsif p_action = 'delete' and exists (
      select 1 from public.marketing_publications as publication
      where publication.content_id = candidate_id
    ) then
      content_id := candidate_id; outcome := 'skipped_publication_history'; return next;
    end if;

    update public.marketing_jobs as job
    set status = 'cancelled',
        error = 'Cancelled because scheduled content was removed.',
        locked_at = null,
        locked_by = null
    where job.content_id = candidate_id
      and job.type = 'publish_instagram'
      and job.status = 'queued';

    delete from public.marketing_schedules as schedule
    where schedule.content_id = candidate_id;

    if p_action = 'unschedule' then
      update public.marketing_content as content
      set status = 'approved', proposed_publish_at = null, updated_by = p_updated_by
      where content.id = candidate_id and content.status = 'scheduled';
      content_id := candidate_id; outcome := 'unscheduled'; return next;
    else
      -- Foreign-key cascade removes the cancelled publication job. Original
      -- CRM media is reference-only and storage cleanup happens in the app.
      delete from public.marketing_content as content
      where content.id = candidate_id and content.status = 'scheduled';
      content_id := candidate_id; outcome := 'deleted'; return next;
    end if;
  end loop;
end;
$$;

revoke execute on function public.manage_scheduled_marketing_content(uuid[], text, uuid) from public, anon;
grant execute on function public.manage_scheduled_marketing_content(uuid[], text, uuid) to authenticated, service_role;
