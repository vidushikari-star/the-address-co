-- activities.property_id already exists on the deployed legacy table.
-- Add the missing relationship without rewriting Activity rows or indexes.

begin;

alter table public.activities
  add constraint activities_property_id_fkey
  foreign key (property_id)
  references public.properties(id)
  on delete cascade
  not valid;

alter table public.activities
  validate constraint activities_property_id_fkey;

commit;
