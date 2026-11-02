-- Recovery407. ONLY apply to existing isolated Kinfolk Social Alpha Test project
-- viantpfagtbgyyzavmtv. NEVER apply to shared/live zojajuzmfjpvubzibzgg.
-- No real accounts, production data, or Auth settings are created/modified.
-- Groups are private: only owner and invited accepted friends can access them.
create table public.group_conversations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  created_at timestamptz not null default now()
);
create index group_conversations_owner_created_idx
  on public.group_conversations(owner_id,created_at desc);

create table public.group_members (
  conversation_id uuid not null references public.group_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversation_id,user_id)
);
create index group_members_user_conversation_idx
  on public.group_members(user_id,conversation_id);

create table public.group_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.group_conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index group_messages_conversation_created_idx
  on public.group_messages(conversation_id,created_at,id);

-- SECURITY DEFINER lookups prevent recursive RLS across groups and members.
-- Each helper derives the caller from auth.uid(); no caller-supplied identity.
-- Fully qualified references and a locked search_path prevent name hijacking.
create function kinfolk_alpha_private.alpha_group_owner(group_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.group_conversations g
    where g.id=group_id and g.owner_id=(select auth.uid())
  )
$$;

create function kinfolk_alpha_private.alpha_group_access(group_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.group_conversations g
    where g.id=group_id
      and kinfolk_alpha_private.not_blocked(g.owner_id)
      and (
        g.owner_id=(select auth.uid())
        or exists (
          select 1 from public.group_members gm
          where gm.conversation_id=g.id and gm.user_id=(select auth.uid())
        )
      )
  )
$$;

-- The current UI offers invitations only to accepted friends. Enforce that
-- boundary server-side, including block lists and the recipient's DM settings.
-- An invitation is an owner-only action, never a self-join or arbitrary add.
create function kinfolk_alpha_private.alpha_group_invite_allowed(group_id uuid, invitee uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select invitee is not null
    and invitee<>(select auth.uid())
    and kinfolk_alpha_private.alpha_group_owner(group_id)
    and kinfolk_alpha_private.not_blocked(invitee)
    and exists (
      select 1 from public.friend_requests fr
      where fr.status='accepted'
        and (
          (fr.sender_id=(select auth.uid()) and fr.receiver_id=invitee)
          or (fr.receiver_id=(select auth.uid()) and fr.sender_id=invitee)
        )
    )
    and exists (
      select 1 from public.kinfolk_safety_settings ss
      where ss.user_id=invitee and ss.direct_messages<>'nobody'
    )
    and exists (
      select 1 from public.user_settings us
      where us.user_id=invitee and us.allow_messages<>'nobody'
    )
$$;

revoke all on function kinfolk_alpha_private.alpha_group_owner(uuid) from public, anon;
revoke all on function kinfolk_alpha_private.alpha_group_access(uuid) from public, anon;
revoke all on function kinfolk_alpha_private.alpha_group_invite_allowed(uuid,uuid) from public, anon;
grant usage on schema kinfolk_alpha_private to authenticated;
grant execute on function kinfolk_alpha_private.alpha_group_owner(uuid) to authenticated;
grant execute on function kinfolk_alpha_private.alpha_group_access(uuid) to authenticated;
grant execute on function kinfolk_alpha_private.alpha_group_invite_allowed(uuid,uuid) to authenticated;

alter table public.group_conversations enable row level security;
alter table public.group_members enable row level security;
alter table public.group_messages enable row level security;
revoke all on public.group_conversations,public.group_members,public.group_messages
  from public,anon,authenticated;
grant select,insert,delete on public.group_conversations to authenticated;
grant update(title) on public.group_conversations to authenticated;
grant select,insert,delete on public.group_members to authenticated;
grant select,insert,delete on public.group_messages to authenticated;

create policy alpha_group_conversation_read on public.group_conversations
  for select to authenticated
  using (kinfolk_alpha_private.alpha_group_access(id));
create policy alpha_group_conversation_insert on public.group_conversations
  for insert to authenticated
  with check (owner_id=(select auth.uid()));
create policy alpha_group_conversation_update on public.group_conversations
  for update to authenticated
  using (kinfolk_alpha_private.alpha_group_owner(id))
  with check (kinfolk_alpha_private.alpha_group_owner(id));
create policy alpha_group_conversation_delete on public.group_conversations
  for delete to authenticated
  using (kinfolk_alpha_private.alpha_group_owner(id));

create policy alpha_group_member_read on public.group_members
  for select to authenticated
  using (kinfolk_alpha_private.alpha_group_access(conversation_id));
create policy alpha_group_member_invite on public.group_members
  for insert to authenticated
  with check (kinfolk_alpha_private.alpha_group_invite_allowed(conversation_id,user_id));
create policy alpha_group_member_leave_or_remove on public.group_members
  for delete to authenticated
  using (user_id=(select auth.uid())
    or kinfolk_alpha_private.alpha_group_owner(conversation_id));

create policy alpha_group_message_read on public.group_messages
  for select to authenticated
  using (kinfolk_alpha_private.alpha_group_access(conversation_id)
    and kinfolk_alpha_private.not_blocked(sender_id));
create policy alpha_group_message_insert on public.group_messages
  for insert to authenticated
  with check (sender_id=(select auth.uid())
    and kinfolk_alpha_private.alpha_group_access(conversation_id));
create policy alpha_group_message_delete on public.group_messages
  for delete to authenticated
  using (kinfolk_alpha_private.alpha_group_access(conversation_id)
    and (sender_id=(select auth.uid())
      or kinfolk_alpha_private.alpha_group_owner(conversation_id)));

comment on table public.group_conversations is
  'Recovery407 isolated-alpha private group chats; RLS membership/owner gated';
comment on table public.group_members is
  'Recovery407 owner-invited accepted friends only; self-leave permitted';
comment on table public.group_messages is
  'Recovery407 sender-authenticated private group messages; RLS membership gated';
