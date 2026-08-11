-- The RETURNS TABLE output named `version` is also a PL/pgSQL variable. Qualify
-- the table column in each update so PostgreSQL does not raise 42702.
create or replace function public.upsert_housing_inventory_submission(
  p_external_id text,
  p_payload jsonb,
  p_payload_hash text,
  p_status text,
  p_validation_errors jsonb
)
returns table(
  id uuid,
  external_id text,
  payload jsonb,
  payload_hash text,
  version integer,
  status text,
  validation_errors jsonb,
  received_at timestamptz,
  updated_at timestamptz,
  processed_at timestamptz,
  crm_property_id uuid,
  was_updated boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_updated boolean := false;
begin
  update public.housing_inventory_submissions as submission
  set payload = p_payload,
      payload_hash = p_payload_hash,
      version = submission.version + 1,
      status = p_status,
      validation_errors = p_validation_errors,
      received_at = now(),
      updated_at = now(),
      processed_at = null,
      crm_property_id = null
  where submission.external_id = p_external_id;

  if found then
    v_updated := true;
  else
    begin
      insert into public.housing_inventory_submissions (
        external_id, payload, payload_hash, status, validation_errors
      ) values (
        p_external_id, p_payload, p_payload_hash, p_status, p_validation_errors
      );
    exception when unique_violation then
      update public.housing_inventory_submissions as submission
      set payload = p_payload,
          payload_hash = p_payload_hash,
          version = submission.version + 1,
          status = p_status,
          validation_errors = p_validation_errors,
          received_at = now(),
          updated_at = now(),
          processed_at = null,
          crm_property_id = null
      where submission.external_id = p_external_id;
      v_updated := true;
    end;
  end if;

  return query
  select submission.id, submission.external_id, submission.payload, submission.payload_hash,
    submission.version, submission.status, submission.validation_errors,
    submission.received_at, submission.updated_at, submission.processed_at,
    submission.crm_property_id, v_updated
  from public.housing_inventory_submissions as submission
  where submission.external_id = p_external_id;
end
$$;

revoke all on function public.upsert_housing_inventory_submission(text, jsonb, text, text, jsonb) from public;
grant execute on function public.upsert_housing_inventory_submission(text, jsonb, text, text, jsonb) to service_role;
