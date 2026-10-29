-- REVIEW-ONLY PROPOSAL. DO NOT EXECUTE against shared live Supabase.
-- Requires isolated-project owner/org approval, security review and real two-user RLS tests.
-- No existing tables are modified; do not deploy until schema conflicts are checked.
create table public.kinfolk_communities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 3 and 60),
  description text not null default '' check (char_length(description) <= 500),
  visibility text not null check (visibility in ('public','private')),
  created_at timestamptz not null default now()
);
create index kinfolk_communities_owner_idx on public.kinfolk_communities(owner_id);
create index kinfolk_communities_public_idx on public.kinfolk_communities(created_at desc) where visibility='public';
alter table public.kinfolk_communities enable row level security;
revoke all on public.kinfolk_communities from anon,authenticated;
grant select,insert,update,delete on public.kinfolk_communities to authenticated;
create policy communities_read on public.kinfolk_communities for select to authenticated
  using (visibility='public' or owner_id=(select auth.uid()));
create policy communities_create on public.kinfolk_communities for insert to authenticated
  with check (owner_id=(select auth.uid()));
create policy communities_edit on public.kinfolk_communities for update to authenticated
  using (owner_id=(select auth.uid()))
  with check (owner_id=(select auth.uid()));
create policy communities_delete on public.kinfolk_communities for delete to authenticated
  using (owner_id=(select auth.uid()));

create table public.kinfolk_community_members (
  community_id uuid not null references public.kinfolk_communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (community_id,user_id)
);
create index kinfolk_community_members_user_idx on public.kinfolk_community_members(user_id);
alter table public.kinfolk_community_members enable row level security;
revoke all on public.kinfolk_community_members from anon,authenticated;
grant select,insert,delete on public.kinfolk_community_members to authenticated;
create policy community_members_read on public.kinfolk_community_members for select to authenticated
  using (user_id=(select auth.uid()) or exists (
    select 1 from public.kinfolk_communities c
    where c.id=community_id and c.owner_id=(select auth.uid())
  ));
create policy community_members_join_public on public.kinfolk_community_members for insert to authenticated
  with check (user_id=(select auth.uid()) and exists (
    select 1 from public.kinfolk_communities c
    where c.id=community_id and c.visibility='public' and c.owner_id<>(select auth.uid())
  ));
create policy community_members_leave_or_owner_remove on public.kinfolk_community_members for delete to authenticated
  using (user_id=(select auth.uid()) or exists (
    select 1 from public.kinfolk_communities c
    where c.id=community_id and c.owner_id=(select auth.uid())
  ));
-- No member UPDATE privilege/policy. Private joining/invitations, posting, bans,
-- moderation, teen restrictions and blocklists remain intentionally DENIED/UNIMPLEMENTED.
-- Required before deployment: pgTAP allow/deny tests for anonymous, owner,
-- unrelated adult, teen, joined member, and removed member; verify all data API grants.
