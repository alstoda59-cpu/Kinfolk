-- Isolated Kinfolk Social alpha only. Do not apply to the shared live backend.
-- Existing kinfolk-communities.js inserts/selects these exact fields.
create table if not exists public.kinfolk_communities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 3 and 60 and name = btrim(name)),
  description text not null default '' check (char_length(description) <= 500),
  visibility text not null default 'public' check (visibility in ('public','private')),
  created_at timestamptz not null default now()
);
create index if not exists kinfolk_communities_public_recent_idx
  on public.kinfolk_communities(created_at desc) where visibility='public';
create index if not exists kinfolk_communities_owner_recent_idx
  on public.kinfolk_communities(owner_id,created_at desc);
alter table public.kinfolk_communities enable row level security;
revoke all on public.kinfolk_communities from anon;
grant select,insert,update,delete on public.kinfolk_communities to authenticated;
drop policy if exists kinfolk_communities_read on public.kinfolk_communities;
create policy kinfolk_communities_read on public.kinfolk_communities
  for select to authenticated
  using (visibility='public' or owner_id=(select auth.uid()));
drop policy if exists kinfolk_communities_create on public.kinfolk_communities;
create policy kinfolk_communities_create on public.kinfolk_communities
  for insert to authenticated
  with check (owner_id=(select auth.uid()));
drop policy if exists kinfolk_communities_edit on public.kinfolk_communities;
create policy kinfolk_communities_edit on public.kinfolk_communities
  for update to authenticated
  using (owner_id=(select auth.uid()))
  with check (owner_id=(select auth.uid()));
drop policy if exists kinfolk_communities_delete on public.kinfolk_communities;
create policy kinfolk_communities_delete on public.kinfolk_communities
  for delete to authenticated
  using (owner_id=(select auth.uid()));
