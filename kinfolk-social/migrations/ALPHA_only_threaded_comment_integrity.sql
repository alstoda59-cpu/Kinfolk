-- Recovery417: ONLY the isolated Kinfolk Social Alpha Test project viantpfagtbgyyzavmtv.
-- Never apply to shared live Kinfolk (zojajuzmfjpvubzibzgg) or Kinfolksworld.
-- The effective Home comment UI submits parent_id even for root comments.
-- The original alpha comments table lacked that column, breaking all inserts.
alter table public.comments add column if not exists parent_id uuid;

-- Composite FK ensures every reply belongs to the same post as its parent.
-- ON DELETE CASCADE removes nested replies when a parent is deleted.
create unique index if not exists comments_id_post_unique
  on public.comments(id, post_id);
create index if not exists comments_parent_id_idx
  on public.comments(parent_id) where parent_id is not null;

do $migration$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.comments'::regclass
      and conname='comments_parent_same_post_fkey'
  ) then
    alter table public.comments
      add constraint comments_parent_same_post_fkey
      foreign key(parent_id, post_id)
      references public.comments(id, post_id)
      on delete cascade;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.comments'::regclass
      and conname='comments_no_self_reply'
  ) then
    alter table public.comments
      add constraint comments_no_self_reply
      check(parent_id is null or parent_id <> id);
  end if;
end $migration$;

-- A policy subquery directly referencing comments would recursively invoke RLS.
-- Use a narrow SECURITY DEFINER boolean helper with explicit visibility checks.
create or replace function kinfolk_alpha_private.visible_comment_parent(p_parent uuid,p_post uuid)
returns boolean language sql stable security definer set search_path = ''
as $function$
  select (select auth.uid()) is not null and exists(
    select 1 from public.comments c
    join public.posts p on p.id=c.post_id
    where c.id=p_parent and c.post_id=p_post
      and kinfolk_alpha_private.not_blocked(c.author_id)
      and kinfolk_alpha_private.not_blocked(p.author_id)
      and (
        p.author_id=(select auth.uid())
        or exists(
          select 1 from public.profiles owner_profile
          where owner_profile.id=p.author_id and owner_profile.is_private=false
        )
      )
  )
$function$;
revoke all on function kinfolk_alpha_private.visible_comment_parent(uuid,uuid) from public, anon;
grant execute on function kinfolk_alpha_private.visible_comment_parent(uuid,uuid) to authenticated;

drop policy if exists alpha_comments_insert on public.comments;
create policy alpha_comments_insert on public.comments
for insert to authenticated
with check (
  author_id=(select auth.uid())
  and exists(select 1 from public.posts p where p.id=comments.post_id)
  and (
    comments.parent_id is null
    or kinfolk_alpha_private.visible_comment_parent(comments.parent_id,comments.post_id)
  )
);
