-- Queueing a render must be atomic: a content item can never enter `rendering`
-- unless the matching runnable `render_reel` job is inserted in this same transaction.
create or replace function public.queue_marketing_reel_render(
  p_content_id uuid,
  p_updated_by uuid,
  p_idempotency_key text,
  p_input jsonb default '{}'::jsonb
)
returns public.marketing_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_content public.marketing_content%rowtype;
  queued_job public.marketing_jobs%rowtype;
begin
  -- Browser requests are subject to the administrator check. The trusted
  -- service-role worker may call this while completing a generated Reel.
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_marketing_admin() then
    raise exception 'Marketing administrator access is required.';
  end if;

  update public.marketing_content
  set status = 'rendering',
      updated_by = p_updated_by,
      last_error = null
  where id = p_content_id
    and status in ('draft', 'changes_requested', 'ready_for_review', 'approved', 'failed')
  returning * into updated_content;

  if not found then
    raise exception 'Content is not in a valid state for Reel rendering.';
  end if;

  insert into public.marketing_jobs (
    content_id,
    type,
    status,
    input,
    idempotency_key,
    run_after
  ) values (
    p_content_id,
    'render_reel',
    'queued',
    coalesce(p_input, '{}'::jsonb),
    p_idempotency_key,
    now()
  )
  returning * into queued_job;

  return queued_job;
end;
$$;

revoke execute on function public.queue_marketing_reel_render(uuid, uuid, text, jsonb) from public, anon;
grant execute on function public.queue_marketing_reel_render(uuid, uuid, text, jsonb) to authenticated, service_role;

-- Repair the only possible legacy stranded state created before the atomic
-- queue function existed. Nothing is deleted; the item becomes actionable
-- again and clearly explains why it did not render.
update public.marketing_content as content
set status = 'failed',
    last_error = 'Render job was not queued. Re-approve and retry rendering.'
where content.content_type = 'reel'
  and content.status = 'rendering'
  and not exists (
    select 1
    from public.marketing_jobs as job
    where job.content_id = content.id
      and job.type = 'render_reel'
      and job.status in ('queued', 'running')
  );
