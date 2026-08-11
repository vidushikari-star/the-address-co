-- A deal-stage move and its timeline entry are one CRM event. Browser-side
-- sequential writes could persist the move while reporting a failed activity.
-- Keep the state and audit entry in one authenticated transaction instead.
create or replace function public.transition_deal_stage(
  p_deal_id uuid,
  p_stage text
)
returns table (changed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.deals%rowtype;
  previous_stage text;
begin
  if auth.uid() is null
    or not exists (select 1 from public.user_profiles where id = auth.uid()) then
    raise exception using errcode = '42501', message = 'Deal stage changes are not authorized';
  end if;

  if p_stage not in (
    'lead', 'qualification', 'property_shared', 'site_visit',
    'negotiation', 'documentation', 'closed_won', 'closed_lost'
  ) then
    raise exception using errcode = '22023', message = 'Unsupported deal stage';
  end if;

  select * into target
  from public.deals as deal
  where deal.id = p_deal_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Deal not found';
  end if;

  previous_stage := target.stage;
  if previous_stage = p_stage then
    return query select false;
    return;
  end if;

  update public.deals as deal
  set stage = p_stage,
      last_activity = now(),
      updated_at = now()
  where deal.id = p_deal_id;

  insert into public.activities (
    type, title, description, body, deal_id, contact_id, property_id,
    activity_date, created_by, user_id
  ) values (
    'deal_stage_changed',
    'Deal Stage Changed',
    target.name,
    'Deal moved from ' || replace(previous_stage, '_', ' ') || ' to ' || replace(p_stage, '_', ' '),
    target.id,
    target.contact_id,
    target.property_id,
    now(),
    auth.uid(),
    auth.uid()
  );

  return query select true;
end;
$$;

revoke all on function public.transition_deal_stage(uuid, text) from public, anon;
grant execute on function public.transition_deal_stage(uuid, text) to authenticated;
