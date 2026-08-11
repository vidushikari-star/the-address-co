-- PENDING SECURITY ROLLOUT — DO NOT RUN FROM supabase/migrations.
--
-- Expected access change:
--   * property-documents becomes a private bucket
--   * anonymous downloads stop working
--   * authorized CRM callers use signed download URLs or an authenticated route
--
-- Preconditions:
--   1. Replace getPublicUrl() in lib/repositories/property-document-repository.ts
--      with signed URLs issued only after the caller is authorized.
--   2. Move public brochures/floor plans needed by /share/[slug] into a
--      deliberately public, allowlisted publishing path; do not make the
--      generic property-documents bucket public for those few files.
--   3. Verify existing sale deeds, ownership files and agreements are not
--      reachable anonymously using a known object URL.
--
-- Rollback: set storage.buckets.public back to true only as a time-limited
-- incident response, then investigate the failed signed-URL caller. Do not
-- restore anonymous write policies.

begin;

update storage.buckets
set public = false
where id = 'property-documents';

drop policy if exists "Allow authenticated document deletes" on storage.objects;
drop policy if exists "Allow authenticated document reads" on storage.objects;
drop policy if exists "Allow authenticated document uploads" on storage.objects;

create policy "CRM users read property documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'property-documents' and public.is_crm_user());
create policy "CRM users upload property documents"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'property-documents' and public.is_crm_user());
create policy "CRM users delete property documents"
  on storage.objects for delete to authenticated
  using (bucket_id = 'property-documents' and public.is_crm_user());

commit;

-- ROLLBACK (review before use):
-- update storage.buckets set public = true where id = 'property-documents';
-- drop policy if exists "CRM users read property documents" on storage.objects;
-- drop policy if exists "CRM users upload property documents" on storage.objects;
-- drop policy if exists "CRM users delete property documents" on storage.objects;
