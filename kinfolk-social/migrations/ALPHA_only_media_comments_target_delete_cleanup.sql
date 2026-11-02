-- Recovery419: ONLY existing nonproduction Kinfolk Social Alpha Test project
-- viantpfagtbgyyzavmtv. NEVER apply to shared/live zojajuzmfjpvubzibzgg.
-- Remove private threaded comments when their photo/video target is deleted.
-- The media_comments parent FK cascades replies. No Auth or storage changes.
create function kinfolk_alpha_private.cleanup_deleted_media_target_comments()
returns trigger language plpgsql security definer set search_path = ''
as $function$
begin
  -- Fail closed if this function is accidentally attached to another table
  -- or the trigger's declared target type is changed.
  if TG_RELID = 'public.kinfolk_videos'::regclass
     and TG_NARGS = 1 and TG_ARGV[0] = 'video' then
    delete from public.media_comments
      where target_type = 'video' and target_id = OLD.id;
  elsif TG_RELID = 'public.album_photos'::regclass
     and TG_NARGS = 1 and TG_ARGV[0] = 'photo' then
    delete from public.media_comments
      where target_type = 'photo' and target_id = OLD.id;
  else
    raise exception 'Unsupported Kinfolk media comment cleanup target';
  end if;
  return OLD;
end;
$function$;
revoke all on function kinfolk_alpha_private.cleanup_deleted_media_target_comments()
  from public, anon, authenticated;

create trigger kinfolk_alpha_video_comment_cleanup
after delete on public.kinfolk_videos
for each row execute function
  kinfolk_alpha_private.cleanup_deleted_media_target_comments('video');

create trigger kinfolk_alpha_photo_comment_cleanup
after delete on public.album_photos
for each row execute function
  kinfolk_alpha_private.cleanup_deleted_media_target_comments('photo');

comment on function kinfolk_alpha_private.cleanup_deleted_media_target_comments()
is 'Recovery419 isolated alpha: remove video/photo comments and cascading replies when their target is deleted';
