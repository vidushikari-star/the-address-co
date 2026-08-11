-- Approval, revised-Reel rendering, and worker recovery each change multiple
-- records. Keep their authoritative state transitions inside one database
-- transaction so a transient HTTP/worker failure cannot strand content.

create or replace function public.apply_marketing_approval(
  p_content_id uuid,
  p_decision text,
  p_note text,
  p_decided_by uuid
)
returns public.marketing_content
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.marketing_content%rowtype;
  updated_content public.marketing_content%rowtype;
  approval_action text;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_marketing_admin() then
    raise exception 'Marketing administrator access is required.';
  end if;

  select * into target
  from public.marketing_content as content
  where content.id = p_content_id
  for update;

  if not found then
    raise exception 'Content not found.';
  end if;

  if p_decision = 'approved' then
    if target.status not in ('draft', 'ready_for_review', 'changes_requested') then
      raise exception 'Content is not in a valid state for this action.';
    end if;
    update public.marketing_content as content
    set status = 'approved', updated_by = p_decided_by
    where content.id = p_content_id
    returning * into updated_content;

    -- A revised Reel can only render after the same approval that approved
    -- its parent content. Lock it here rather than in a later request step.
    if target.content_type = 'reel' then
      update public.marketing_reel_versions as version
      set status = 'approved', approved_by = p_decided_by,
          approved_at = now(), last_error = null
      where version.id = (
        select candidate.id
        from public.marketing_reel_versions as candidate
        where candidate.content_id = p_content_id
          and candidate.status = 'draft'
        order by candidate.version_number desc
        limit 1
        for update
      );
    end if;
    approval_action := 'content.approved';
  elsif p_decision = 'changes_requested' then
    if target.status not in ('ready_for_review', 'approved') then
      raise exception 'Content is not in a valid state for this action.';
    end if;
    update public.marketing_content as content
    set status = 'changes_requested', rejection_reason = p_note,
        updated_by = p_decided_by
    where content.id = p_content_id
    returning * into updated_content;
    approval_action := 'content.changes_requested';
  elsif p_decision = 'rejected' then
    if target.status not in ('ready_for_review', 'changes_requested', 'approved') then
      raise exception 'Content is not in a valid state for this action.';
    end if;
    update public.marketing_content as content
    set status = 'draft', rejection_reason = coalesce(p_note, 'Rejected by administrator.'),
        updated_by = p_decided_by
    where content.id = p_content_id
    returning * into updated_content;
    approval_action := 'content.rejected';
  else
    raise exception 'Unsupported approval action.';
  end if;

  insert into public.marketing_approvals (content_id, decision, note, decided_by)
  values (p_content_id, p_decision, p_note, p_decided_by);

  insert into public.marketing_audit_logs (actor_id, content_id, action, metadata)
  values (
    p_decided_by,
    p_content_id,
    approval_action,
    case when p_decision = 'approved' then '{}'::jsonb else jsonb_build_object('note', p_note) end
  );

  return updated_content;
end;
$$;

revoke execute on function public.apply_marketing_approval(uuid, text, text, uuid) from public, anon;
grant execute on function public.apply_marketing_approval(uuid, text, text, uuid) to authenticated, service_role;

create or replace function public.queue_marketing_reel_version_render(
  p_content_id uuid,
  p_version_id uuid,
  p_updated_by uuid,
  p_idempotency_key text
)
returns public.marketing_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.marketing_content%rowtype;
  version public.marketing_reel_versions%rowtype;
  queued_job public.marketing_jobs%rowtype;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_marketing_admin() then
    raise exception 'Marketing administrator access is required.';
  end if;

  select * into target
  from public.marketing_content as content
  where content.id = p_content_id
  for update;
  if not found or target.content_type <> 'reel' or target.status <> 'approved' then
    raise exception 'Approve this revised Reel version before rendering it.';
  end if;

  select * into version
  from public.marketing_reel_versions as candidate
  where candidate.id = p_version_id
    and candidate.content_id = p_content_id
  for update;
  if not found or version.status <> 'approved' then
    raise exception 'Approve this revised Reel version before rendering it.';
  end if;

  update public.marketing_content as content
  set status = 'rendering', updated_by = p_updated_by, last_error = null
  where content.id = p_content_id
  returning * into target;

  update public.marketing_reel_versions as candidate
  set status = 'rendering', last_error = null
  where candidate.id = p_version_id
    and candidate.status = 'approved';

  insert into public.marketing_jobs (
    content_id, type, status, input, idempotency_key, run_after
  ) values (
    p_content_id,
    'render_reel',
    'queued',
    jsonb_build_object('resumeApproved', true, 'reelVersionId', p_version_id),
    p_idempotency_key,
    now()
  )
  returning * into queued_job;

  return queued_job;
end;
$$;

revoke execute on function public.queue_marketing_reel_version_render(uuid, uuid, uuid, text) from public, anon;
grant execute on function public.queue_marketing_reel_version_render(uuid, uuid, uuid, text) to authenticated, service_role;

-- A running job has a lease, not permanent ownership. Rendering can process
-- ten source assets serially, each with a four-minute FFmpeg timeout, so the
-- one-hour threshold intentionally exceeds its longest legitimate run.
create or replace function public.recover_stale_marketing_jobs()
returns table (requeued_count integer, failed_publish_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  stale_after timestamptz := now() - interval '1 hour';
  requeued integer := 0;
  failed_publishes integer := 0;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Marketing worker access is required.';
  end if;

  with recovered as (
    update public.marketing_jobs as job
    set status = 'queued', progress = 0,
        error = 'Recovered after an expired worker lease.',
        run_after = now(), locked_at = null, locked_by = null
    where job.status = 'running'
      and job.type <> 'publish_instagram'
      and job.locked_at is not null
      and job.locked_at < stale_after
    returning job.id
  )
  select count(*) into requeued from recovered;

  -- Never automatically retry a stale Meta publish job. It may have reached
  -- Instagram after the worker set publish_attempted_at, so mark it terminal
  -- and require an administrator to verify the destination before retrying.
  with failed_jobs as (
    update public.marketing_jobs as job
    set status = 'failed', progress = 100,
        error = 'Publication worker lease expired. Verify Instagram before retrying.',
        locked_at = null, locked_by = null
    where job.status = 'running'
      and job.type = 'publish_instagram'
      and job.locked_at is not null
      and job.locked_at < stale_after
    returning job.content_id
  ), failed_publications as (
    update public.marketing_publications as publication
    set status = 'failed',
        last_error = 'Publication worker lease expired. Verify Instagram before retrying.'
    where publication.content_id in (select content_id from failed_jobs where content_id is not null)
    returning publication.content_id
  ), failed_content as (
    update public.marketing_content as content
    set status = 'failed',
        last_error = 'Publication worker lease expired. Verify Instagram before retrying.'
    where content.id in (select content_id from failed_jobs where content_id is not null)
      and content.status in ('scheduled', 'publishing')
    returning content.id
  )
  select count(*) into failed_publishes from failed_jobs;

  return query select requeued, failed_publishes;
end;
$$;

revoke execute on function public.recover_stale_marketing_jobs() from public, anon, authenticated;
grant execute on function public.recover_stale_marketing_jobs() to service_role;
