-- Guard for scripts/bootstrap-supabase-fresh.sh.
-- A target with any recorded project migration is not a fresh bootstrap target.
do $$
begin
  if exists (select 1 from supabase_migrations.schema_migrations) then
    raise exception 'Refusing baseline bootstrap: target already has recorded migrations';
  end if;

  if to_regclass('public.properties') is not null
    or to_regclass('public.contacts') is not null
    or to_regclass('public.user_profiles') is not null then
    raise exception 'Refusing baseline bootstrap: target already has legacy CRM objects';
  end if;
end
$$;
