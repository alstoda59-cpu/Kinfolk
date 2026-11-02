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

-- A reply must reference a visible parent comment. The existing SELECT policy
-- on comments enforces post visibility and reciprocal block protection.
drop policy if exists alpha_comments_insert on public.comments;
create policy alpha_comments_insert on public.comments
for insert to authenticated
with check (
  author_id=(select auth.uid())
  and exists(select 1 from public.posts p where p.id=comments.post_id)
  and (
    comments.parent_id is null
    or exists(
      select 1 from public.comments parent
      where parent.id=comments.parent_id
        and parent.post_id=comments.post_id
    )
  )
);
