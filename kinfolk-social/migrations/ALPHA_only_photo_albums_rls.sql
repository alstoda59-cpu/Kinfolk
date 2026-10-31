-- Recovery377. ONLY for the existing isolated Kinfolk Social Alpha Test project
-- viantpfagtbgyyzavmtv. NEVER run on shared/live zojajuzmfjpvubzibzgg.
-- Review before applying. No production schema, Auth or data migration.
-- A public album is visible only if the owner has a public profile and neither
-- account blocks the other. Teen accounts have private profiles server-side.
create table public.photo_albums (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  description text not null default '' check (char_length(description)<=500),
  visibility text not null default 'private' check (visibility in ('public','private')),
  created_at timestamptz not null default now(),
  unique (id, owner_id)
);
create index photo_albums_owner_created_idx on public.photo_albums(owner_id,created_at desc);

create table public.album_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null,
  owner_id uuid not null,
  storage_path text not null unique,
  caption text not null default '' check (char_length(caption)<=500),
  created_at timestamptz not null default now(),
  constraint album_photos_album_owner_fk foreign key(album_id,owner_id)
    references public.photo_albums(id,owner_id) on delete cascade,
  constraint album_photos_owner_path_check check (
    char_length(storage_path)>char_length(owner_id::text||'/albums/'||album_id::text||'/')
    and left(storage_path,char_length(owner_id::text||'/albums/'||album_id::text||'/'))
      =owner_id::text||'/albums/'||album_id::text||'/'
  )
);
create index album_photos_album_created_idx on public.album_photos(album_id,created_at,id);

alter table public.photo_albums enable row level security;
alter table public.album_photos enable row level security;
revoke all on public.photo_albums, public.album_photos from public, anon, authenticated;
grant select,insert,delete on public.photo_albums,public.album_photos to authenticated;
grant update(title,description,visibility) on public.photo_albums to authenticated;
grant update(caption) on public.album_photos to authenticated;

create policy alpha_album_read on public.photo_albums for select to authenticated
using (
  owner_id=(select auth.uid())
  or (
    visibility='public'
    and kinfolk_alpha_private.not_blocked(owner_id)
    and exists (
      select 1 from public.profiles p
      where p.id=owner_id and p.is_private=false
    )
  )
);
create policy alpha_album_insert on public.photo_albums for insert to authenticated
with check (owner_id=(select auth.uid()));
create policy alpha_album_update on public.photo_albums for update to authenticated
using (owner_id=(select auth.uid()))
with check (owner_id=(select auth.uid()));
create policy alpha_album_delete on public.photo_albums for delete to authenticated
using (owner_id=(select auth.uid()));

-- Album RLS is the authority for photo visibility; the composite FK prevents
-- a photo's owner_id from disagreeing with the parent album's owner_id.
create policy alpha_album_photo_read on public.album_photos for select to authenticated
using (
  exists (
    select 1 from public.photo_albums a
    where a.id=album_id and a.owner_id=owner_id
  )
);
create policy alpha_album_photo_insert on public.album_photos for insert to authenticated
with check (
  owner_id=(select auth.uid())
  and exists (
    select 1 from public.photo_albums a
    where a.id=album_id and a.owner_id=owner_id
  )
);
create policy alpha_album_photo_update on public.album_photos for update to authenticated
using (owner_id=(select auth.uid()))
with check (owner_id=(select auth.uid()));
create policy alpha_album_photo_delete on public.album_photos for delete to authenticated
using (owner_id=(select auth.uid()));

-- The kinfolk-media bucket is ALREADY private in the isolated alpha project.
-- This adds only authenticated SELECT for media linked to a visible public album.
-- Existing owner-folder upload/read/delete policies remain unchanged.
-- Never grant anonymous access or make the bucket public.
create policy kinfolk_alpha_public_album_media_read
on storage.objects for select to authenticated
using (
  bucket_id='kinfolk-media'
  and exists (
    select 1 from public.album_photos ph
    join public.photo_albums a on a.id=ph.album_id and a.owner_id=ph.owner_id
    join public.profiles p on p.id=a.owner_id
    where ph.storage_path=storage.objects.name
      and a.visibility='public'
      and p.is_private=false
      and kinfolk_alpha_private.not_blocked(a.owner_id)
  )
);

comment on table public.photo_albums is 'Isolated alpha photo albums; RLS owner/public-profile/block gated';
comment on table public.album_photos is 'Isolated alpha album photos; composite album-owner FK and private storage path';
