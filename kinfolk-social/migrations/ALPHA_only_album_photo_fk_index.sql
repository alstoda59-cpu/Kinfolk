-- Recovery377 follow-up: existing isolated alpha project viantpfagtbgyyzavmtv ONLY.
-- Never run on shared/live zojajuzmfjpvubzibzgg.
-- Cover both columns of the composite photo->album owner foreign key.
create index album_photos_album_owner_fk_idx
on public.album_photos(album_id,owner_id);
