-- Isolated Kinfolk Social alpha only. Do not apply to shared LIVE.
create table if not exists public.kinfolk_community_members (
  community_id uuid not null references public.kinfolk_communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);
create index if not exists kinfolk_community_members_user_idx on public.kinfolk_community_members(user_id);
alter table public.kinfolk_community_members enable row level security;
revoke all on public.kinfolk_community_members from anon;
grant select, insert, delete on public.kinfolk_community_members to authenticated;
create policy kinfolk_community_members_read on public.kinfolk_community_members for select to authenticated
using (user_id = (select auth.uid()) or exists (
  select 1 from public.kinfolk_communities c
  where c.id = community_id and c.owner_id = (select auth.uid())
));
create policy kinfolk_community_members_join on public.kinfolk_community_members for insert to authenticated
with check (user_id = (select auth.uid()) and exists (
  select 1 from public.kinfolk_communities c
  where c.id = community_id and c.visibility = 'public'
    and c.owner_id <> (select auth.uid())
));
create policy kinfolk_community_members_leave on public.kinfolk_community_members for delete to authenticated
using (user_id = (select auth.uid()));
