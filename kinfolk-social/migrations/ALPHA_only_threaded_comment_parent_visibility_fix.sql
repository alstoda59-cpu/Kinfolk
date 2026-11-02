-- Recovery417 isolated Alpha Test corrective migration only: viantpfagtbgyyzavmtv.
-- Replaces the initially applied self-referencing INSERT RLS policy which
-- failed planning with 42P17 infinite recursion. No shared live changes.
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
