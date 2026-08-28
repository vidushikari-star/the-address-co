-- READ ONLY — Stage 2, Batch 1B post-deployment verification.
-- This reads catalog metadata and aggregate counts only. It neither reads
-- Calendar record contents nor mutates database state.

begin read only;

-- Batch 1B must enable, but never force, RLS.
select
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'calendar_events';

-- Inspect the complete policy inventory before checking it for discrepancies.
select
  p.policyname,
  p.roles,
  p.cmd,
  p.qual as using_expression,
  p.with_check as with_check_expression
from pg_policies p
where p.schemaname = 'public'
  and p.tablename = 'calendar_events'
order by p.policyname;

-- A zero-row result confirms that exactly the four approved authenticated
-- policies exist with their expected commands and CRM-user expressions.
with expected(policyname, command, expected_qual, expected_with_check) as (
  values
    ('CRM users select calendar events', 'SELECT', 'is_crm_user()', null::text),
    ('CRM users insert calendar events', 'INSERT', null::text, 'is_crm_user()'),
    ('CRM users update calendar events', 'UPDATE', 'is_crm_user()', 'is_crm_user()'),
    ('CRM users delete calendar events', 'DELETE', 'is_crm_user()', null::text)
),
observed as (
  select p.policyname, upper(p.cmd) as command, p.roles, p.qual, p.with_check
  from pg_policies p
  where p.schemaname = 'public'
    and p.tablename = 'calendar_events'
)
select
  expected.policyname,
  expected.command,
  'missing or unexpected definition' as discrepancy
from expected
left join observed
  on observed.policyname = expected.policyname
  and observed.command = expected.command
  and observed.roles = array['authenticated']::name[]
  and observed.qual is not distinct from expected.expected_qual
  and observed.with_check is not distinct from expected.expected_with_check
where observed.policyname is null
union all
select
  observed.policyname,
  observed.command,
  'unexpected policy' as discrepancy
from observed
left join expected
  on expected.policyname = observed.policyname
  and expected.command = observed.command
  and observed.roles = array['authenticated']::name[]
  and observed.qual is not distinct from expected.expected_qual
  and observed.with_check is not distinct from expected.expected_with_check
where expected.policyname is null
order by 1, 2;

-- Show direct grants for all browser and service roles in scope.
select
  g.grantee,
  g.privilege_type
from information_schema.role_table_grants g
where g.table_schema = 'public'
  and g.table_name = 'calendar_events'
  and g.grantee in ('anon', 'authenticated', 'service_role')
order by g.grantee, g.privilege_type;

-- A zero-row result confirms anon has no effective table privilege,
-- authenticated has ordinary CRUD only, and service_role retains the direct
-- grant set observed in the approved preflight.
with expected(grantee, privilege_type) as (
  values
    ('authenticated', 'SELECT'),
    ('authenticated', 'INSERT'),
    ('authenticated', 'UPDATE'),
    ('authenticated', 'DELETE'),
    ('service_role', 'SELECT'),
    ('service_role', 'INSERT'),
    ('service_role', 'UPDATE'),
    ('service_role', 'DELETE'),
    ('service_role', 'TRUNCATE'),
    ('service_role', 'REFERENCES'),
    ('service_role', 'TRIGGER')
),
observed as (
  select
    role_name as grantee,
    privilege_type
  from (
    values
      ('anon'::name, 'SELECT'::text),
      ('anon'::name, 'INSERT'::text),
      ('anon'::name, 'UPDATE'::text),
      ('anon'::name, 'DELETE'::text),
      ('anon'::name, 'TRUNCATE'::text),
      ('anon'::name, 'REFERENCES'::text),
      ('anon'::name, 'TRIGGER'::text),
      ('authenticated'::name, 'SELECT'::text),
      ('authenticated'::name, 'INSERT'::text),
      ('authenticated'::name, 'UPDATE'::text),
      ('authenticated'::name, 'DELETE'::text),
      ('authenticated'::name, 'TRUNCATE'::text),
      ('authenticated'::name, 'REFERENCES'::text),
      ('authenticated'::name, 'TRIGGER'::text),
      ('service_role'::name, 'SELECT'::text),
      ('service_role'::name, 'INSERT'::text),
      ('service_role'::name, 'UPDATE'::text),
      ('service_role'::name, 'DELETE'::text),
      ('service_role'::name, 'TRUNCATE'::text),
      ('service_role'::name, 'REFERENCES'::text),
      ('service_role'::name, 'TRIGGER'::text)
  ) as role_privileges(role_name, privilege_type)
  where has_table_privilege(
    role_name,
    'public.calendar_events',
    privilege_type
  )
)
select
  expected.grantee,
  expected.privilege_type,
  'missing expected effective privilege' as discrepancy
from expected
left join observed
  on observed.grantee = expected.grantee::name
  and observed.privilege_type = expected.privilege_type
where observed.grantee is null
union all
select
  observed.grantee::text,
  observed.privilege_type,
  'unexpected effective privilege' as discrepancy
from observed
left join expected
  on expected.grantee::name = observed.grantee
  and expected.privilege_type = observed.privilege_type
where expected.grantee is null
order by 1, 2;

-- Stage 1's membership helper must remain a stable, security-definer function
-- with the approved protected search path and body.
with expected as (
  select $expected$  select auth.uid() is not null
    and exists (
      select 1
      from public.user_profiles
      where id = auth.uid()
    );
$expected$::text as body
)
select
  p.oid::regprocedure as function_name,
  'unexpected is_crm_user definition' as discrepancy
from pg_proc p
cross join expected
where p.oid = to_regprocedure('public.is_crm_user()')
  and not (
    p.prosecdef
    and p.provolatile = 's'::"char"
    and p.proconfig = array['search_path=public, pg_temp']
    and p.prosrc = expected.body
  );

-- The Site Visit separation remains intact if this returns zero.
select count(*) as legacy_site_visit_row_count
from public.calendar_events
where event_type = 'site_visit';

commit;
