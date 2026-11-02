-- Recovery420: ISOLATED Kinfolk Social Alpha Test only (viantpfagtbgyyzavmtv).
-- NEVER apply to shared/live Kinfolk (zojajuzmfjpvubzibzgg).
-- The existing animated-wallpaper uploader uses a dedicated private bucket.
-- Only the authenticated account may upload/read/delete its own wallpaper objects.
do $$
begin
  if exists (
    select 1 from storage.buckets
    where id='kinfolk-wallpapers' and (
      public is distinct from false
      or file_size_limit is distinct from 15728640
      or allowed_mime_types is distinct from array[
        'image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm'
      ]::text[]
    )
  ) then
    raise exception 'Existing wallpaper bucket differs from the reviewed private alpha configuration';
  end if;
end $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values (
  'kinfolk-wallpapers','kinfolk-wallpapers',false,15728640,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm']::text[]
)
on conflict (id) do nothing;

create policy kinfolk_alpha_wallpaper_owner_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id='kinfolk-wallpapers'
    and (storage.foldername(name))[1]=(select auth.uid())::text
    and coalesce(array_length(storage.foldername(name),1),0)=1
    and split_part(name,'/',2) ~ '^profile-wallpaper-[0-9]+[.](jpg|png|webp|gif|mp4|webm)$'
  );

create policy kinfolk_alpha_wallpaper_owner_read on storage.objects
  for select to authenticated
  using (
    bucket_id='kinfolk-wallpapers'
    and (storage.foldername(name))[1]=(select auth.uid())::text
  );

create policy kinfolk_alpha_wallpaper_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id='kinfolk-wallpapers'
    and (storage.foldername(name))[1]=(select auth.uid())::text
  );

-- No UPDATE policy: the uploader uses upsert:false, so overwriting is denied.
-- No anonymous or public policy. Signed URL expiration is handled separately
-- by the client and remains an alpha privacy review item.
