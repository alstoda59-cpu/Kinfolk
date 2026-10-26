-- MAIN Kinfolk Social isolated alpha only: viantpfagtbgyyzavmtv.
-- Never run on shared live Kinfolk Supabase project.
-- Source-compatible Home feed, post likes, threaded comment baseline.
-- Private posts are visible only to their owner until approved-friend RLS exists.
create or replace function kinfolk_alpha_private.not_blocked(target_user uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null
    and target_user is not null
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id=(select auth.uid()) and b.blocked_id=target_user)
         or (b.blocked_id=(select auth.uid()) and b.blocker_id=target_user)
    )
$$;
revoke all on function kinfolk_alpha_private.not_blocked(uuid) from public, anon;
grant usage on schema kinfolk_alpha_private to authenticated;
grant execute on function kinfolk_alpha_private.not_blocked(uuid) to authenticated;

drop policy if exists alpha_profile_read on public.profiles;
create policy alpha_profile_read on public.profiles for select to authenticated
  using (kinfolk_alpha_private.not_blocked(id));

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null default '',
  media_url text,
  created_at timestamptz not null default now(),
  constraint posts_nonempty check (length(btrim(body))>0 or media_url is not null),
  constraint posts_body_limit check (char_length(body)<=10000)
);
create index posts_created_at_idx on public.posts(created_at desc);
create index posts_author_created_idx on public.posts(author_id,created_at desc);
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index comments_post_created_idx on public.comments(post_id,created_at);
create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(post_id,user_id)
);
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
revoke all on public.posts, public.comments, public.post_likes from anon;
revoke all on public.posts, public.comments, public.post_likes from authenticated;
grant select,insert,delete on public.posts to authenticated;
grant select,insert,delete on public.comments to authenticated;
grant select,insert,delete on public.post_likes to authenticated;

create policy alpha_posts_read on public.posts for select to authenticated
using (
  kinfolk_alpha_private.not_blocked(author_id)
  and (
    author_id=(select auth.uid())
    or exists (select 1 from public.profiles p where p.id=author_id and p.is_private=false)
  )
);
create policy alpha_posts_insert on public.posts for insert to authenticated
with check (author_id=(select auth.uid()));
create policy alpha_posts_delete on public.posts for delete to authenticated
using (author_id=(select auth.uid()));

create policy alpha_comments_read on public.comments for select to authenticated
using (
  kinfolk_alpha_private.not_blocked(author_id)
  and exists (select 1 from public.posts p where p.id=post_id)
);
create policy alpha_comments_insert on public.comments for insert to authenticated
with check (
  author_id=(select auth.uid())
  and exists (select 1 from public.posts p where p.id=post_id)
);
create policy alpha_comments_delete on public.comments for delete to authenticated
using (author_id=(select auth.uid()));

create policy alpha_post_likes_read on public.post_likes for select to authenticated
using (
  kinfolk_alpha_private.not_blocked(user_id)
  and exists (select 1 from public.posts p where p.id=post_id)
);
create policy alpha_post_likes_insert on public.post_likes for insert to authenticated
with check (
  user_id=(select auth.uid())
  and exists (select 1 from public.posts p where p.id=post_id)
);
create policy alpha_post_likes_delete on public.post_likes for delete to authenticated
using (user_id=(select auth.uid()));
