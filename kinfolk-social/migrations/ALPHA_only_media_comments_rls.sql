-- Recovery418: ONLY existing nonproduction Kinfolk Social Alpha Test project
-- viantpfagtbgyyzavmtv. NEVER apply to shared/live zojajuzmfjpvubzibzgg.
-- No Auth changes, paid resources, public storage or production deployment.
-- Polymorphic targets are checked at INSERT and SELECT through explicit
-- visibility rules; orphan cleanup after target deletion remains future work.
create table public.media_comments (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('video','photo')),
  target_id uuid not null,
  parent_id uuid,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  unique (id,target_type,target_id),
  constraint media_comments_not_self_parent check (parent_id is null or parent_id<>id),
  constraint media_comments_same_target_parent_fk
    foreign key (parent_id,target_type,target_id)
    references public.media_comments(id,target_type,target_id) on delete cascade
);
create index media_comments_target_created_idx
  on public.media_comments(target_type,target_id,created_at,id);
create index media_comments_parent_idx on public.media_comments(parent_id)
  where parent_id is not null;

-- Explicit target visibility is required inside SECURITY DEFINER helpers:
-- their table reads do not inherit caller RLS. Private/teen profiles and
-- reciprocal blocks are never exposed by these helpers.
create function kinfolk_alpha_private.media_comment_target_visible(p_kind text,p_target uuid)
returns boolean language sql stable security definer set search_path = ''
as $function$
  select (select auth.uid()) is not null and (
    (p_kind='video' and exists (
      select 1 from public.kinfolk_videos v
      join public.profiles p on p.id=v.creator_id
      where v.id=p_target and (
        v.creator_id=(select auth.uid())
        or (v.visibility='public' and v.processing_status='ready'
            and p.is_private=false
            and kinfolk_alpha_private.not_blocked(v.creator_id))
      )
    ))
    or
    (p_kind='photo' and exists (
      select 1 from public.album_photos ph
      join public.photo_albums a on a.id=ph.album_id and a.owner_id=ph.owner_id
      join public.profiles p on p.id=a.owner_id
      where ph.id=p_target and (
        a.owner_id=(select auth.uid())
        or (a.visibility='public' and p.is_private=false
            and kinfolk_alpha_private.not_blocked(a.owner_id))
      )
    ))
  )
$function$;
revoke all on function kinfolk_alpha_private.media_comment_target_visible(text,uuid)
  from public,anon;
grant execute on function kinfolk_alpha_private.media_comment_target_visible(text,uuid)
  to authenticated;

-- Avoid a recursive media_comments RLS subquery. Verify parent belongs to
-- exactly the same target, is visible, and its author is not blocked.
create function kinfolk_alpha_private.media_comment_parent_visible(
  p_parent uuid,p_kind text,p_target uuid)
returns boolean language sql stable security definer set search_path = ''
as $function$
  select (select auth.uid()) is not null
    and kinfolk_alpha_private.media_comment_target_visible(p_kind,p_target)
    and exists (
      select 1 from public.media_comments c
      where c.id=p_parent and c.target_type=p_kind and c.target_id=p_target
        and kinfolk_alpha_private.not_blocked(c.author_id)
    )
$function$;
revoke all on function kinfolk_alpha_private.media_comment_parent_visible(uuid,text,uuid)
  from public,anon;
grant execute on function kinfolk_alpha_private.media_comment_parent_visible(uuid,text,uuid)
  to authenticated;

alter table public.media_comments enable row level security;
revoke all on public.media_comments from public,anon,authenticated;
grant select,delete on public.media_comments to authenticated;
grant insert(target_type,target_id,parent_id,author_id,body)
  on public.media_comments to authenticated;

create policy alpha_media_comments_read on public.media_comments
  for select to authenticated using (
    kinfolk_alpha_private.media_comment_target_visible(target_type,target_id)
    and kinfolk_alpha_private.not_blocked(author_id)
  );
create policy alpha_media_comments_insert on public.media_comments
  for insert to authenticated with check (
    author_id=(select auth.uid())
    and kinfolk_alpha_private.media_comment_target_visible(target_type,target_id)
    and (parent_id is null or kinfolk_alpha_private.media_comment_parent_visible(
      parent_id,target_type,target_id))
  );
create policy alpha_media_comments_delete on public.media_comments
  for delete to authenticated using (author_id=(select auth.uid()));

comment on table public.media_comments is
  'Recovery418 isolated alpha threaded photo/video comments; private/teen/block RLS';
