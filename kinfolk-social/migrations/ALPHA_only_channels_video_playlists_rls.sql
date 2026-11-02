-- Recovery412: ONLY the existing isolated Kinfolk Social Alpha Test project
-- viantpfagtbgyyzavmtv. NEVER apply to shared/live zojajuzmfjpvubzibzgg.
-- No Auth, production, user data, bucket visibility or payment changes.
-- Private profiles (including self-declared teens) are not publicly discoverable.
create table public.kinfolk_pages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  slug text check (slug is null or slug ~ '^[A-Za-z0-9_]{3,30}$'),
  description text not null default '' check (char_length(description) <= 600),
  category text not null default 'creator' check (char_length(category) between 1 and 80),
  avatar_url text check (
    avatar_url is null or
    left(avatar_url,char_length(owner_id::text||'/channels/avatar/'))=owner_id::text||'/channels/avatar/'
  ),
  banner_url text check (
    banner_url is null or
    left(banner_url,char_length(owner_id::text||'/channels/banner/'))=owner_id::text||'/channels/banner/'
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id,owner_id)
);
create unique index kinfolk_pages_slug_ci_idx on public.kinfolk_pages(lower(slug)) where slug is not null;
create index kinfolk_pages_owner_created_idx on public.kinfolk_pages(owner_id,created_at desc);

create table public.kinfolk_channel_subscriptions (
  channel_id uuid not null references public.kinfolk_pages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  notify_level text not null default 'all' check (notify_level in ('all','personalized','none')),
  created_at timestamptz not null default now(),
  primary key(channel_id,user_id)
);
create index kinfolk_channel_subscriptions_user_idx on public.kinfolk_channel_subscriptions(user_id);

create table public.kinfolk_videos (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  channel_id uuid,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  kind text not null check (kind in ('reel','video')),
  source_type text not null check (source_type in ('upload','external')),
  storage_path text unique,
  video_url text,
  source_mime text,
  source_size bigint,
  visibility text not null default 'public' check (visibility in ('public','unlisted','private')),
  processing_status text not null default 'ready' check (processing_status in ('ready','processing','failed')),
  transcode_status text not null default 'not_required',
  created_at timestamptz not null default now(),
  constraint kinfolk_videos_owned_channel_fk foreign key(channel_id,creator_id)
    references public.kinfolk_pages(id,owner_id) on delete cascade,
  constraint kinfolk_video_source_check check (
    (source_type='upload'
      and storage_path is not null
      and left(storage_path,char_length(creator_id::text||'/videos/'))=creator_id::text||'/videos/'
      and char_length(storage_path)>char_length(creator_id::text||'/videos/')
      and video_url is null
      and source_mime in ('video/mp4','video/webm')
      and source_size between 1 and 52428800)
    or (source_type='external' and storage_path is null and video_url ~ '^https://')
  )
);
create index kinfolk_videos_creator_created_idx on public.kinfolk_videos(creator_id,created_at desc);
create index kinfolk_videos_channel_created_idx on public.kinfolk_videos(channel_id,created_at desc);

create table public.kinfolk_playlists (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 100),
  description text not null default '' check (char_length(description)<=500),
  visibility text not null default 'public' check (visibility in ('public','unlisted','private')),
  created_at timestamptz not null default now(),
  constraint kinfolk_playlist_owned_channel_fk foreign key(channel_id,owner_id)
    references public.kinfolk_pages(id,owner_id) on delete cascade
);
create index kinfolk_playlists_channel_created_idx on public.kinfolk_playlists(channel_id,created_at desc);

create table public.kinfolk_playlist_items (
  playlist_id uuid not null references public.kinfolk_playlists(id) on delete cascade,
  video_id uuid not null references public.kinfolk_videos(id) on delete cascade,
  position integer not null check (position>=0 and position<10000),
  primary key(playlist_id,video_id)
);
create index kinfolk_playlist_items_position_idx on public.kinfolk_playlist_items(playlist_id,position);

create table public.kinfolk_video_reactions (
  video_id uuid not null references public.kinfolk_videos(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('like','dislike')),
  created_at timestamptz not null default now(),
  primary key(video_id,user_id)
);
create index kinfolk_video_reactions_user_idx on public.kinfolk_video_reactions(user_id);

alter table public.kinfolk_pages enable row level security;
alter table public.kinfolk_channel_subscriptions enable row level security;
alter table public.kinfolk_videos enable row level security;
alter table public.kinfolk_playlists enable row level security;
alter table public.kinfolk_playlist_items enable row level security;
alter table public.kinfolk_video_reactions enable row level security;

revoke all on public.kinfolk_pages,public.kinfolk_channel_subscriptions,
  public.kinfolk_videos,public.kinfolk_playlists,public.kinfolk_playlist_items,
  public.kinfolk_video_reactions from public,anon,authenticated;
grant select,insert,delete on public.kinfolk_pages,public.kinfolk_channel_subscriptions,
  public.kinfolk_videos,public.kinfolk_playlists,public.kinfolk_playlist_items,
  public.kinfolk_video_reactions to authenticated;
grant update(title,slug,description,category,avatar_url,banner_url,updated_at)
  on public.kinfolk_pages to authenticated;
grant update(notify_level) on public.kinfolk_channel_subscriptions to authenticated;
grant update(title,visibility) on public.kinfolk_videos to authenticated;
grant update(title,description,visibility) on public.kinfolk_playlists to authenticated;
grant update(reaction) on public.kinfolk_video_reactions to authenticated;

create policy alpha_channel_read on public.kinfolk_pages for select to authenticated using (
  owner_id=(select auth.uid()) or (
    kinfolk_alpha_private.not_blocked(owner_id)
    and exists(select 1 from public.profiles p where p.id=owner_id and p.is_private=false)
  )
);
create policy alpha_channel_insert on public.kinfolk_pages for insert to authenticated
  with check (owner_id=(select auth.uid()));
create policy alpha_channel_update on public.kinfolk_pages for update to authenticated
  using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
create policy alpha_channel_delete on public.kinfolk_pages for delete to authenticated
  using (owner_id=(select auth.uid()));

-- Subscription preferences and subscriber identities are visible only to
-- the subscriber and the channel owner, not to arbitrary visitors.
create policy alpha_channel_sub_read on public.kinfolk_channel_subscriptions for select to authenticated
  using (user_id=(select auth.uid()) or (
    kinfolk_alpha_private.not_blocked(user_id)
    and exists(select 1 from public.kinfolk_pages p
      where p.id=channel_id and p.owner_id=(select auth.uid()))
  ));
create policy alpha_channel_sub_insert on public.kinfolk_channel_subscriptions for insert to authenticated
  with check (user_id=(select auth.uid()) and
    exists(select 1 from public.kinfolk_pages p where p.id=channel_id and p.owner_id<>user_id));
create policy alpha_channel_sub_update on public.kinfolk_channel_subscriptions for update to authenticated
  using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy alpha_channel_sub_delete on public.kinfolk_channel_subscriptions for delete to authenticated
  using (user_id=(select auth.uid()));

create policy alpha_video_read on public.kinfolk_videos for select to authenticated using (
  creator_id=(select auth.uid()) or (
    visibility='public' and processing_status='ready'
    and kinfolk_alpha_private.not_blocked(creator_id)
    and exists(select 1 from public.profiles p where p.id=creator_id and p.is_private=false)
  )
);
create policy alpha_video_insert on public.kinfolk_videos for insert to authenticated
  with check (creator_id=(select auth.uid()) and
    (channel_id is null or exists(select 1 from public.kinfolk_pages p
      where p.id=channel_id and p.owner_id=(select auth.uid()))));
create policy alpha_video_update on public.kinfolk_videos for update to authenticated
  using (creator_id=(select auth.uid())) with check (creator_id=(select auth.uid()));
create policy alpha_video_delete on public.kinfolk_videos for delete to authenticated
  using (creator_id=(select auth.uid()));

create policy alpha_playlist_read on public.kinfolk_playlists for select to authenticated using (
  owner_id=(select auth.uid()) or (
    visibility='public' and kinfolk_alpha_private.not_blocked(owner_id)
    and exists(select 1 from public.kinfolk_pages p where p.id=channel_id and p.owner_id=owner_id)
  )
);
create policy alpha_playlist_insert on public.kinfolk_playlists for insert to authenticated
  with check (owner_id=(select auth.uid()) and
    exists(select 1 from public.kinfolk_pages p where p.id=channel_id and p.owner_id=owner_id));
create policy alpha_playlist_update on public.kinfolk_playlists for update to authenticated
  using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
create policy alpha_playlist_delete on public.kinfolk_playlists for delete to authenticated
  using (owner_id=(select auth.uid()));

-- Playlist items must belong to videos in the SAME owned channel; the
-- frontend's delete-and-reinsert editor cannot attach a foreign video.
create policy alpha_playlist_item_read on public.kinfolk_playlist_items for select to authenticated
  using (exists(
    select 1 from public.kinfolk_playlists p join public.kinfolk_videos v
      on v.id=video_id and v.channel_id=p.channel_id
    where p.id=playlist_id
  ));
create policy alpha_playlist_item_insert on public.kinfolk_playlist_items for insert to authenticated
  with check (exists(
    select 1 from public.kinfolk_playlists p join public.kinfolk_videos v
      on v.id=video_id and v.channel_id=p.channel_id
    where p.id=playlist_id and p.owner_id=(select auth.uid())
      and v.creator_id=(select auth.uid())
  ));
create policy alpha_playlist_item_delete on public.kinfolk_playlist_items for delete to authenticated
  using (exists(select 1 from public.kinfolk_playlists p
    where p.id=playlist_id and p.owner_id=(select auth.uid())));

create policy alpha_video_reaction_read on public.kinfolk_video_reactions for select to authenticated
  using (exists(select 1 from public.kinfolk_videos v where v.id=video_id));
create policy alpha_video_reaction_insert on public.kinfolk_video_reactions for insert to authenticated
  with check (user_id=(select auth.uid()) and
    exists(select 1 from public.kinfolk_videos v where v.id=video_id));
create policy alpha_video_reaction_update on public.kinfolk_video_reactions for update to authenticated
  using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy alpha_video_reaction_delete on public.kinfolk_video_reactions for delete to authenticated
  using (user_id=(select auth.uid()));

-- Existing kinfolk-media and kinfolk-video buckets remain private. Signed
-- media reads for authenticated viewers require a visible parent record.
create policy kinfolk_alpha_channel_media_read on storage.objects for select to authenticated
  using (bucket_id='kinfolk-media' and exists(
    select 1 from public.kinfolk_pages p
    where storage.objects.name in (p.avatar_url,p.banner_url)
  ));
create policy kinfolk_alpha_public_video_media_read on storage.objects for select to authenticated
  using (bucket_id='kinfolk-video' and exists(
    select 1 from public.kinfolk_videos v where v.storage_path=storage.objects.name
  ));

comment on table public.kinfolk_pages is 'Recovery412 isolated-alpha creator channels; profile privacy and blocks enforced';
comment on table public.kinfolk_videos is 'Recovery412 isolated-alpha media; owner writes and public-profile visibility';
comment on table public.kinfolk_playlists is 'Recovery412 isolated-alpha playlists; owned channel and private/unlisted visibility';
comment on table public.kinfolk_playlist_items is 'Recovery412 isolated-alpha playlist items; same-channel write RLS';
