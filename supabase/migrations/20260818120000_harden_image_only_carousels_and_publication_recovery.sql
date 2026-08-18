-- Phase A: image-only Carousel invariants and publication-state recovery.
-- This migration does not contact Meta or publish any content. It makes
-- malformed Carousels fail before the external side effect and reconciles
-- only CRM state that no active worker can still complete.

begin;

create or replace function public.assert_valid_marketing_carousel(
  p_content_id uuid,
  p_composition jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_count integer;
  resolved_count integer;
  invalid_count integer;
begin
  if p_composition ? 'selectedAssetIds' then
    if jsonb_typeof(p_composition->'selectedAssetIds') <> 'array' then
      raise exception 'Carousel selected media must be an ordered image list.';
    end if;
    if exists (
      select 1
      from jsonb_array_elements(p_composition->'selectedAssetIds') as selected(value)
      where jsonb_typeof(selected.value) <> 'string'
    ) then
      raise exception 'Carousel selected media must contain asset IDs only.';
    end if;
    select jsonb_array_length(p_composition->'selectedAssetIds') into selected_count;
    if selected_count < 2 or selected_count > 10 then
      raise exception 'A Carousel requires 2–10 selected images.';
    end if;
    if exists (
      select value
      from jsonb_array_elements_text(p_composition->'selectedAssetIds') as selected(value)
      group by value
      having count(*) > 1
    ) then
      raise exception 'Carousel media cannot contain duplicate images.';
    end if;

    select count(*) into resolved_count
    from public.marketing_content_assets as asset
    join jsonb_array_elements_text(p_composition->'selectedAssetIds') as selected(value)
      on asset.id::text = selected.value
    where asset.content_id = p_content_id;

    if resolved_count <> selected_count then
      raise exception 'This Carousel contains selected media that could not be resolved. Edit Carousel Media before continuing.';
    end if;

    select count(*) into invalid_count
    from public.marketing_content_assets as asset
    join jsonb_array_elements_text(p_composition->'selectedAssetIds') as selected(value)
      on asset.id::text = selected.value
    where asset.content_id = p_content_id
      and (
        asset.kind <> 'original_reference'
        or asset.media_type <> 'image'
        or asset.source_url is null
        or asset.source_url !~* '^https://'
      );
  else
    -- Legacy Carousels pre-date selectedAssetIds. Treat their stored source
    -- relation as the selection so video is reported, never silently dropped.
    select count(*) into selected_count
    from public.marketing_content_assets as asset
    where asset.content_id = p_content_id
      and asset.kind = 'original_reference'
      and asset.source_url is not null;

    select count(*) into invalid_count
    from public.marketing_content_assets as asset
    where asset.content_id = p_content_id
      and asset.kind = 'original_reference'
      and asset.source_url is not null
      and (
        asset.media_type <> 'image'
        or asset.source_url !~* '^https://'
      );
  end if;

  if selected_count < 2 or selected_count > 10 then
    raise exception 'A Carousel requires 2–10 selected images.';
  end if;
  if invalid_count > 0 then
    raise exception 'This Carousel contains unsupported video media. Remove the video before continuing.';
  end if;
end;
$$;

revoke execute on function public.assert_valid_marketing_carousel(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.assert_valid_marketing_carousel(uuid, jsonb) to service_role;

create or replace function public.enforce_marketing_carousel_invariant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.content_type = 'carousel' and (
    (tg_op = 'INSERT' and new.composition ? 'selectedAssetIds')
    or (tg_op = 'UPDATE' and new.composition is distinct from old.composition)
    or (tg_op = 'UPDATE' and new.status in ('approved', 'scheduled', 'publishing') and new.status is distinct from old.status)
  ) then
    perform public.assert_valid_marketing_carousel(new.id, coalesce(new.composition, '{}'::jsonb));
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_marketing_carousel_invariant on public.marketing_content;
create trigger enforce_marketing_carousel_invariant
before insert or update of composition, status on public.marketing_content
for each row execute function public.enforce_marketing_carousel_invariant();

-- The service performs the same validation to give a fast user-facing error,
-- but scheduling is a security boundary too: no caller can bypass it with a
-- direct RPC invocation.
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
  if target.content_type = 'carousel' then
    perform public.assert_valid_marketing_carousel(target.id, target.composition);
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

-- A terminal worker outcome updates all three local state records together.
-- If Meta's publication ID was persisted before a later local error, prefer
-- that durable evidence and repair the CRM to published rather than failing it.
create or replace function public.fail_marketing_publication(
  p_job_id uuid,
  p_content_id uuid,
  p_error text
)
returns public.marketing_content
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.marketing_content%rowtype;
  publication public.marketing_publications%rowtype;
  repaired public.marketing_content%rowtype;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Marketing worker access is required.';
  end if;

  select * into target from public.marketing_content as content where content.id = p_content_id for update;
  if not found then
    raise exception 'Content not found.';
  end if;
  select * into publication from public.marketing_publications as item where item.content_id = p_content_id for update;

  if found and publication.external_publication_id is not null then
    update public.marketing_publications as item
    set status = 'published', last_error = null,
        published_at = coalesce(item.published_at, now())
    where item.id = publication.id;
    update public.marketing_content as content
    set status = 'published', published_at = coalesce(content.published_at, publication.published_at, now()), last_error = null
    where content.id = p_content_id
    returning * into repaired;
    update public.marketing_jobs as job
    set status = 'completed', progress = 100, error = null, locked_at = null, locked_by = null
    where job.id = p_job_id;
    return repaired;
  end if;

  update public.marketing_jobs as job
  set status = 'failed', progress = 100, error = left(p_error, 2000), locked_at = null, locked_by = null
  where job.id = p_job_id;
  update public.marketing_publications as item
  set status = 'failed', last_error = left(p_error, 2000)
  where item.content_id = p_content_id;
  update public.marketing_content as content
  set status = 'failed', last_error = left(p_error, 2000)
  where content.id = p_content_id
  returning * into repaired;
  return repaired;
end;
$$;

revoke execute on function public.fail_marketing_publication(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.fail_marketing_publication(uuid, uuid, text) to service_role;

-- Only a record with no media_publish attempt and no Instagram media ID can
-- return to Approved. The caller may then schedule it or explicitly queue a
-- fresh protected retry. Ambiguous outcomes remain failed for verification.
create or replace function public.recover_marketing_publication(
  p_content_id uuid,
  p_updated_by uuid
)
returns public.marketing_content
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.marketing_content%rowtype;
  publication public.marketing_publications%rowtype;
  recovered public.marketing_content%rowtype;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_marketing_admin() then
    raise exception 'Marketing administrator access is required.';
  end if;

  select * into target from public.marketing_content as content where content.id = p_content_id for update;
  if not found or target.status <> 'failed' then
    raise exception 'Only failed content can be returned to Approved.';
  end if;
  if target.content_type = 'carousel' then
    perform public.assert_valid_marketing_carousel(target.id, target.composition);
  end if;
  if exists (
    select 1 from public.marketing_jobs as job
    where job.content_id = p_content_id and job.type = 'publish_instagram' and job.status = 'running'
  ) then
    raise exception 'Publishing is still active and cannot be recovered.';
  end if;

  select * into publication from public.marketing_publications as item where item.content_id = p_content_id for update;
  if found and (publication.external_publication_id is not null or publication.publish_attempted_at is not null) then
    raise exception 'Publication outcome requires verification before retrying.';
  end if;

  if found then
    update public.marketing_publications as item
    set status = 'pending', external_container_id = null, last_error = null,
        request_diagnostics = jsonb_build_object('recovered_at', now(), 'recovered_by', p_updated_by)
    where item.id = publication.id;
  end if;
  update public.marketing_content as content
  set status = 'approved', proposed_publish_at = null, last_error = null, updated_by = p_updated_by
  where content.id = p_content_id
  returning * into recovered;
  insert into public.marketing_audit_logs (actor_id, content_id, action, metadata)
  values (p_updated_by, p_content_id, 'publication.returned_to_approved', '{}'::jsonb);
  return recovered;
end;
$$;

revoke execute on function public.recover_marketing_publication(uuid, uuid) from public, anon;
grant execute on function public.recover_marketing_publication(uuid, uuid) to authenticated, service_role;

-- A lease protects an active worker, not the content forever. Stale or
-- orphaned `publishing` content is reconciled without ever issuing a second
-- media_publish request. An existing Meta media ID is durable success; every
-- other prior publish attempt is deliberately marked ambiguous.
-- Keep the original two-column return contract. The worker treats any future
-- reconciliation count as optional, and changing OUT columns would require a
-- DROP FUNCTION that could break unknown API callers despite there being no
-- current catalog dependents.
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
        error = 'Recovered after an expired worker lease.', run_after = now(),
        locked_at = null, locked_by = null
    where job.status = 'running'
      and job.type <> 'publish_instagram'
      and job.locked_at is not null
      and job.locked_at < stale_after
    returning job.id
  )
  select count(*) into requeued from recovered;

  with stale_jobs as (
    update public.marketing_jobs as job
    set status = 'failed', progress = 100,
        error = 'Publication worker lease expired. Publication outcome requires verification before retrying.',
        locked_at = null, locked_by = null
    where job.status = 'running'
      and job.type = 'publish_instagram'
      and job.locked_at is not null
      and job.locked_at < stale_after
    returning job.content_id
  ), recovered_publications as (
    update public.marketing_publications as publication
    set status = 'published', last_error = null,
        published_at = coalesce(publication.published_at, now())
    where publication.content_id in (select content_id from stale_jobs where content_id is not null)
      and publication.external_publication_id is not null
    returning publication.content_id
  ), recovered_content as (
    update public.marketing_content as content
    set status = 'published', published_at = coalesce(content.published_at, now()), last_error = null
    where content.id in (select content_id from recovered_publications)
      and content.status in ('scheduled', 'publishing', 'failed')
    returning content.id
  ), failed_publications as (
    update public.marketing_publications as publication
    set status = 'failed', last_error = 'Publication worker lease expired. Publication outcome requires verification before retrying.'
    where publication.content_id in (select content_id from stale_jobs where content_id is not null)
      and publication.external_publication_id is null
    returning publication.content_id
  ), failed_content as (
    update public.marketing_content as content
    set status = 'failed', last_error = 'Publication worker lease expired. Publication outcome requires verification before retrying.'
    where content.id in (select content_id from stale_jobs where content_id is not null)
      and content.id not in (select content_id from recovered_publications)
      and content.status in ('scheduled', 'publishing')
    returning content.id
  )
  select count(*) into failed_publishes from stale_jobs;

  with recovered_orphans as (
    update public.marketing_publications as publication
    set status = 'published', last_error = null,
        published_at = coalesce(publication.published_at, now())
    from public.marketing_content as content
    where content.id = publication.content_id
      and content.status = 'publishing'
      and publication.external_publication_id is not null
      and not exists (
        select 1 from public.marketing_jobs as job
        where job.content_id = content.id and job.type = 'publish_instagram' and job.status in ('queued', 'running')
      )
    returning content.id as content_id
  ), repaired_orphans as (
    update public.marketing_content as content
    set status = 'published', published_at = coalesce(content.published_at, now()), last_error = null
    where content.id in (select content_id from recovered_orphans)
    returning content.id as content_id
  ), ambiguous_publications as (
    update public.marketing_publications as publication
    set status = 'failed', last_error = case
      when publication.publish_attempted_at is not null then 'Publication outcome requires verification before retrying.'
      else 'Publishing worker disappeared before media_publish. It is safe to return this item to Approved.'
    end
    from public.marketing_content as content
    where content.id = publication.content_id
      and content.status = 'publishing'
      and publication.external_publication_id is null
      and not exists (
        select 1 from public.marketing_jobs as job
        where job.content_id = content.id and job.type = 'publish_instagram' and job.status in ('queued', 'running')
      )
    returning content.id as content_id, publication.publish_attempted_at
  ), failed_orphans as (
    update public.marketing_content as content
    set status = 'failed', last_error = case
      when exists (
        select 1 from ambiguous_publications as publication
        where publication.content_id = content.id and publication.publish_attempted_at is not null
      ) then 'Publication outcome requires verification before retrying.'
      else 'Publishing worker disappeared before media_publish. It is safe to return this item to Approved.'
    end
    where content.status = 'publishing'
      and not exists (
        select 1 from public.marketing_jobs as job
        where job.content_id = content.id and job.type = 'publish_instagram' and job.status in ('queued', 'running')
      )
      and content.id not in (select content_id from repaired_orphans)
    returning content.id as content_id
  )
  perform 1 from failed_orphans;

  return query select requeued, failed_publishes;
end;
$$;

revoke execute on function public.recover_stale_marketing_jobs() from public, anon, authenticated;
grant execute on function public.recover_stale_marketing_jobs() to service_role;

-- Existing scheduled mixed-media Carousels have not reached media_publish.
-- Flag them for correction and cancel their queued jobs; published history and
-- active publishing rows are intentionally left untouched for reconciliation.
with invalid_scheduled as (
  select content.id
  from public.marketing_content as content
  where content.status = 'scheduled'
    and content.content_type = 'carousel'
    and exists (
      select 1 from public.marketing_content_assets as asset
      where asset.content_id = content.id
        and asset.kind = 'original_reference'
        and asset.media_type <> 'image'
        and (
          not content.composition ? 'selectedAssetIds'
          or asset.id::text in (
            select selected.value
            from jsonb_array_elements_text(case
              when jsonb_typeof(content.composition->'selectedAssetIds') = 'array'
                then content.composition->'selectedAssetIds'
              else '[]'::jsonb
            end) as selected(value)
          )
        )
    )
), cancelled_jobs as (
  update public.marketing_jobs as job
  set status = 'cancelled', error = 'This Carousel contains unsupported video media. Remove the video before continuing.',
      locked_at = null, locked_by = null
  where job.content_id in (select id from invalid_scheduled)
    and job.type = 'publish_instagram'
    and job.status = 'queued'
)
update public.marketing_content as content
set status = 'failed',
    last_error = 'This Carousel contains unsupported video media. Remove the video before continuing.',
    proposed_publish_at = null
where content.id in (select id from invalid_scheduled)
  and content.status = 'scheduled';

commit;
