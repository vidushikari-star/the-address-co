-- A Carousel keeps an ordered Marketing-only reference set. This function
-- never writes to property_images: it only creates a missing content relation
-- and persists the selected relation IDs on the Marketing content record.
create or replace function public.update_marketing_carousel_media(
  p_content_id uuid,
  p_property_image_ids uuid[],
  p_updated_by uuid
)
returns public.marketing_content
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.marketing_content%rowtype;
  available_count integer;
  selected_asset_ids jsonb;
  updated public.marketing_content%rowtype;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_marketing_admin() then
    raise exception 'Marketing administrator access is required.';
  end if;
  if coalesce(cardinality(p_property_image_ids), 0) < 2 or cardinality(p_property_image_ids) > 10 then
    raise exception 'A Carousel requires 2–10 selected images.';
  end if;
  if cardinality(p_property_image_ids) <> (
    select count(distinct image_id)
    from unnest(p_property_image_ids) as selected(image_id)
  ) then
    raise exception 'Carousel media cannot contain duplicate images.';
  end if;

  select * into target
  from public.marketing_content as content
  where content.id = p_content_id
  for update;
  if not found then
    raise exception 'Content not found.';
  end if;
  if target.content_type <> 'carousel' then
    raise exception 'Only Carousel content can change selected media.';
  end if;
  if target.status = 'scheduled' then
    raise exception 'Unschedule this Carousel before changing its media.';
  end if;
  if target.status not in ('draft', 'changes_requested', 'ready_for_review', 'failed', 'approved') then
    raise exception 'Carousel media can no longer be changed in its current workflow state.';
  end if;
  if target.primary_property_id is null then
    raise exception 'This Carousel no longer has a source property gallery.';
  end if;

  select count(*) into available_count
  from public.property_images as image
  where image.property_id = target.primary_property_id
    and image.media_type = 'image'
    and image.id = any(p_property_image_ids);
  if available_count <> cardinality(p_property_image_ids) then
    raise exception 'Each selected image must belong to this Carousel source property.';
  end if;

  insert into public.marketing_content_assets (
    content_id, property_image_id, kind, media_type, source_url, metadata, sort_order
  )
  select
    target.id,
    image.id,
    'original_reference',
    'image',
    image.url,
    jsonb_build_object('isCover', coalesce(image.is_cover, false)),
    selected.position - 1
  from unnest(p_property_image_ids) with ordinality as selected(image_id, position)
  join public.property_images as image on image.id = selected.image_id
  where not exists (
    select 1
    from public.marketing_content_assets as existing
    where existing.content_id = target.id
      and existing.property_image_id = image.id
      and existing.kind = 'original_reference'
  );

  select jsonb_agg(chosen.id order by selected.position) into selected_asset_ids
  from unnest(p_property_image_ids) with ordinality as selected(image_id, position)
  cross join lateral (
    select asset.id
    from public.marketing_content_assets as asset
    where asset.content_id = target.id
      and asset.property_image_id = selected.image_id
      and asset.kind = 'original_reference'
      and asset.media_type = 'image'
      and asset.source_url is not null
    order by asset.created_at asc, asset.id asc
    limit 1
  ) as chosen;
  if selected_asset_ids is null or jsonb_array_length(selected_asset_ids) <> cardinality(p_property_image_ids) then
    raise exception 'Carousel source image relations could not be persisted.';
  end if;

  update public.marketing_content as content
  set composition = jsonb_set(coalesce(content.composition, '{}'::jsonb), '{selectedAssetIds}', selected_asset_ids, true),
      status = 'draft',
      proposed_publish_at = null,
      last_error = null,
      updated_by = p_updated_by
  where content.id = target.id
  returning * into updated;

  insert into public.marketing_audit_logs (actor_id, content_id, action, metadata)
  values (
    p_updated_by,
    target.id,
    'carousel.media_updated',
    jsonb_build_object('selectedImageCount', cardinality(p_property_image_ids), 'approvalReset', true)
  );

  return updated;
end;
$$;

revoke execute on function public.update_marketing_carousel_media(uuid, uuid[], uuid) from public, anon;
grant execute on function public.update_marketing_carousel_media(uuid, uuid[], uuid) to authenticated, service_role;
