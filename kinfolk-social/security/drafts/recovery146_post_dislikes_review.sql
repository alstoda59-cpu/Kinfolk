-- REVIEW-ONLY DRAFT. Do not apply to the shared live Supabase project.
-- Read-only metadata verified 2026-10-24: posts.id and profiles.id are UUID;
-- existing post_likes references profiles(id), and its RLS gates reads/writes
-- through SELECT-visible posts. This draft mirrors those restrictions.
-- Apply only in an isolated nonproduction database after reviewing policies.
create table if not exists public.post_dislikes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
alter table public.post_dislikes enable row level security;

create policy "dislikes read visible posts"
  on public.post_dislikes for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_dislikes.post_id));
create policy "dislikes insert self on visible posts"
  on public.post_dislikes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.posts p where p.id = post_dislikes.post_id)
  );
create policy "dislikes delete self"
  on public.post_dislikes for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, delete on public.post_dislikes to authenticated;
-- The browser currently clears the opposite reaction before inserting.
-- Mutual exclusivity across post_likes/post_dislikes is not atomic.
-- Before public release, design/test server-side transaction/RPC enforcement
-- and role-separated RLS tests in isolated nonproduction.
