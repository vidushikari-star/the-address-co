-- READ ONLY — Stage 2, Batch 1 post-deployment verification.
-- This reads catalog metadata only. It does not read CRM rows or mutate state.

begin read only;

-- Both tables must have RLS enabled and remain non-forced, matching the
-- existing application/service-role model.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('contacts', 'property_contacts')
order by c.relname;

-- There must be exactly the eight explicit authenticated policies below.
select
  p.tablename,
  p.policyname,
  p.roles,
  p.cmd,
  p.qual as using_expression,
  p.with_check as with_check_expression
from pg_policies p
where p.schemaname = 'public'
  and p.tablename in ('contacts', 'property_contacts')
order by p.tablename, p.policyname;

-- A non-empty result is a policy discrepancy.
with expected(tablename, policyname, command) as (
  values
    ('contacts', 'CRM users select contacts', 'SELECT'),
    ('contacts', 'CRM users insert contacts', 'INSERT'),
    ('contacts', 'CRM users update contacts', 'UPDATE'),
    ('contacts', 'CRM users delete contacts', 'DELETE'),
    ('property_contacts', 'CRM users select property contacts', 'SELECT'),
    ('property_contacts', 'CRM users insert property contacts', 'INSERT'),
    ('property_contacts', 'CRM users update property contacts', 'UPDATE'),
    ('property_contacts', 'CRM users delete property contacts', 'DELETE')
)
select
  expected.tablename,
  expected.policyname,
  expected.command,
  case when p.policyname is null then 'missing' else 'unexpected definition' end as discrepancy
from expected
left join pg_policies p
  on p.schemaname = 'public'
  and p.tablename = expected.tablename
  and p.policyname = expected.policyname
  and upper(p.cmd) = expected.command
  and p.roles = array['authenticated']::name[]
  and (
    (expected.command = 'SELECT' and p.qual = 'is_crm_user()' and p.with_check is null)
    or (expected.command = 'INSERT' and p.qual is null and p.with_check = 'is_crm_user()')
    or (expected.command = 'UPDATE' and p.qual = 'is_crm_user()' and p.with_check = 'is_crm_user()')
    or (expected.command = 'DELETE' and p.qual = 'is_crm_user()' and p.with_check is null)
  )
where p.policyname is null
union all
select
  p.tablename,
  p.policyname,
  upper(p.cmd),
  'unexpected policy' as discrepancy
from pg_policies p
where p.schemaname = 'public'
  and p.tablename in ('contacts', 'property_contacts')
  and (p.tablename, p.policyname) not in (
    ('contacts', 'CRM users select contacts'),
    ('contacts', 'CRM users insert contacts'),
    ('contacts', 'CRM users update contacts'),
    ('contacts', 'CRM users delete contacts'),
    ('property_contacts', 'CRM users select property contacts'),
    ('property_contacts', 'CRM users insert property contacts'),
    ('property_contacts', 'CRM users update property contacts'),
    ('property_contacts', 'CRM users delete property contacts')
  )
order by 1, 2;

-- Authenticated has ordinary CRUD only; anon has no direct table privileges.
select
  g.table_name,
  g.grantee,
  g.privilege_type
from information_schema.role_table_grants g
where g.table_schema = 'public'
  and g.table_name in ('contacts', 'property_contacts')
  and g.grantee in ('anon', 'authenticated')
order by g.table_name, g.grantee, g.privilege_type;

-- This query returns a row for each missing expected authenticated CRUD grant.
with expected(table_name, privilege_type) as (
  values
    ('contacts', 'SELECT'), ('contacts', 'INSERT'), ('contacts', 'UPDATE'), ('contacts', 'DELETE'),
    ('property_contacts', 'SELECT'), ('property_contacts', 'INSERT'), ('property_contacts', 'UPDATE'), ('property_contacts', 'DELETE')
)
select expected.table_name, expected.privilege_type, 'missing authenticated CRUD grant' as discrepancy
from expected
left join information_schema.role_table_grants g
  on g.table_schema = 'public'
  and g.table_name = expected.table_name
  and g.grantee = 'authenticated'
  and g.privilege_type = expected.privilege_type
where g.table_name is null
union all
select g.table_name, g.privilege_type, 'unexpected anon/authenticated privilege' as discrepancy
from information_schema.role_table_grants g
where g.table_schema = 'public'
  and g.table_name in ('contacts', 'property_contacts')
  and g.grantee in ('anon', 'authenticated')
  and not (g.grantee = 'authenticated' and g.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE'))
order by 1, 2;

-- Stage 1 membership helper is unchanged and still security-definer scoped.
select pg_get_functiondef('public.is_crm_user()'::regprocedure) as is_crm_user_definition;

commit;
