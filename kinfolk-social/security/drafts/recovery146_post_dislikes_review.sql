-- REVIEW ONLY: not applied to any Supabase database.
-- Confirm posts.id and auth.users.id are UUIDs and existing post_likes policies before applying.
create table if not exists public.post_dislikes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.post_dislikes enable row level security;
create policy "Authenticated members can read dislikes" on public.post_dislikes for select to authenticated using (true);
create policy "Members add their own dislikes" on public.post_dislikes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Members remove their own dislikes" on public.post_dislikes for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, delete on public.post_dislikes to authenticated;
-- Before release, validate visibility requirements and enforce mutual exclusivity
-- of likes and dislikes server-side (the UI currently removes the opposite first).
