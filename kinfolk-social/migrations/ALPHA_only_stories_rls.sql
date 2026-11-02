-- Recovery415: existing isolated Kinfolk Social Alpha Test project ONLY.
-- Project viantpfagtbgyyzavmtv. NEVER run on shared/live zojajuzmfjpvubzibzgg.
-- No Auth configuration, real accounts, bucket visibility or production changes.
-- Story expiry is server-owned: authenticated clients cannot set created_at/expires_at.
create table public.kinfolk_stories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  body text not null default '' check (char_length(body)<=2000),
  media_url text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now()+interval '24 hours'),
  constraint kinfolk_stories_nonempty check (char_length(btrim(body))>0 or media_url is not null),
  constraint kinfolk_stories_media_owner_path check (
    media_url is null or (
      left(media_url,char_length(owner_id::text||'/stories/'))=owner_id::text||'/stories/'
      and char_length(media_url)>char_length(owner_id::text||'/stories/')
    )
  ),
  constraint kinfolk_stories_expiry_bounds check (
    expires_at>created_at and expires_at<=created_at+interval '24 hours'
  )
);
create index kinfolk_stories_expiry_created_idx
  on public.kinfolk_stories(expires_at,created_at desc);
create index kinfolk_stories_owner_created_idx
  on public.kinfolk_stories(owner_id,created_at desc);
alter table public.kinfolk_stories enable row level security;
revoke all on public.kinfolk_stories from public,anon,authenticated;
grant select,delete on public.kinfolk_stories to authenticated;
grant insert(owner_id,body,media_url) on public.kinfolk_stories to authenticated;

-- A private or teen account's stories are never visible to unrelated viewers.
-- The owner may read their own unexpired stories. Reciprocal blocks hide others.
create policy alpha_story_read on public.kinfolk_stories
for select to authenticated using (
  expires_at>now()
  and (
    owner_id=(select auth.uid())
    or (
      kinfolk_alpha_private.not_blocked(owner_id)
      and exists (
        select 1 from public.profiles p
        where p.id=owner_id and p.is_private=false
      )
    )
  )
);
create policy alpha_story_insert on public.kinfolk_stories
for insert to authenticated with check (owner_id=(select auth.uid()));
create policy alpha_story_delete on public.kinfolk_stories
for delete to authenticated using (owner_id=(select auth.uid()));

-- The existing kinfolk-media bucket stays private. Only an unexpired story
-- visible under the parent table's RLS can authorize signed media reads.
-- Existing owner-folder upload/read/delete policies remain unchanged.
create policy kinfolk_alpha_visible_story_media_read
on storage.objects for select to authenticated using (
  bucket_id='kinfolk-media'
  and (storage.foldername(name))[2]='stories'
  and exists (
    select 1 from public.kinfolk_stories s
    where s.media_url=storage.objects.name and s.expires_at>now()
  )
);
comment on table public.kinfolk_stories is
  'Recovery415 isolated-alpha 24-hour stories; owner writes, private-profile/block/expiry RLS';
