-- READ ONLY. Run in the Supabase SQL editor to refresh the security inventory.
-- It reads catalog metadata only; it does not query application-table rows.

select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind = 'r'
  and n.nspname in ('public', 'storage')
order by n.nspname, c.relname;

select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

select
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema in ('public', 'storage')
  and grantee in ('anon', 'authenticated', 'service_role', 'public')
order by table_schema, table_name, grantee, privilege_type;

select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;
