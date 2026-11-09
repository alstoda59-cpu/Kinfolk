-- Isolated Kinfolk Social alpha: media downloads must respect metadata visibility.
-- These policies are for viantpfagtbgyyzavmtv only. Do not apply to shared live.
-- Metadata SELECT policies on public.kinfolk_videos and public.kinfolk_stories
-- enforce private-profile and blocking restrictions for the caller.
drop policy if exists kinfolk_alpha_public_video_media_read on storage.objects;
create policy kinfolk_alpha_public_video_media_read on storage.objects
for select to authenticated
using (
  bucket_id = 'kinfolk-video'
  and exists (
    select 1 from public.kinfolk_videos v
    where v.storage_path = storage.objects.name
      and v.visibility = 'public'
      and v.processing_status = 'ready'
  )
);
drop policy if exists kinfolk_alpha_visible_story_media_read on storage.objects;
create policy kinfolk_alpha_visible_story_media_read on storage.objects
for select to authenticated
using (
  bucket_id = 'kinfolk-media'
  and (storage.foldername(name))[2] = 'stories'
  and exists (
    select 1 from public.kinfolk_stories s
    where s.media_url = storage.objects.name
      and s.expires_at > now()
  )
);
