-- Main Kinfolk Social isolated alpha only: enable existing post dislike UI.
create table if not exists public.post_dislikes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id,user_id)
);
create index if not exists post_dislikes_user_idx on public.post_dislikes(user_id);
alter table public.post_dislikes enable row level security;
revoke all on public.post_dislikes from anon;
grant select,insert,delete on public.post_dislikes to authenticated;
drop policy if exists alpha_post_dislikes_read on public.post_dislikes;
create policy alpha_post_dislikes_read on public.post_dislikes
 for select to authenticated
 using (kinfolk_alpha_private.not_blocked(user_id)
        and exists (select 1 from public.posts p where p.id=post_id));
drop policy if exists alpha_post_dislikes_insert on public.post_dislikes;
create policy alpha_post_dislikes_insert on public.post_dislikes
 for insert to authenticated
 with check (user_id=(select auth.uid())
             and exists (select 1 from public.posts p where p.id=post_id));
drop policy if exists alpha_post_dislikes_delete on public.post_dislikes;
create policy alpha_post_dislikes_delete on public.post_dislikes
 for delete to authenticated using (user_id=(select auth.uid()));
