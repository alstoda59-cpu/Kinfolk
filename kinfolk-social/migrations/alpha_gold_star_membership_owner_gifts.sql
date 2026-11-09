-- Isolated Kinfolk alpha only: Gold Star membership and owner-gifting integration.
create table if not exists public.gold_grants (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  note text,
  granted_by uuid references auth.users(id) on delete set null
);
create table if not exists public.gold_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text,
  provider_subscription_id text,
  status text not null default 'inactive' check(status in ('inactive','active','trialing','past_due','canceled')),
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.gold_grants enable row level security;
alter table public.gold_memberships enable row level security;
revoke all on public.gold_grants from anon,authenticated;
revoke all on public.gold_memberships from anon,authenticated;
create schema if not exists kinfolk_private;
revoke all on schema kinfolk_private from public,anon;
grant usage on schema kinfolk_private to authenticated;

create or replace function kinfolk_private.has_gold_star_impl(target_user uuid)
returns boolean language sql stable security definer set search_path=''
as $$
 select exists (
   select 1 from public.gold_grants g
   where g.user_id=target_user and (g.expires_at is null or g.expires_at>now())
 ) or exists (
   select 1 from public.gold_memberships m
   where m.user_id=target_user and m.status in ('active','trialing')
     and (m.current_period_end is null or m.current_period_end>now())
 );
$$;
revoke all on function kinfolk_private.has_gold_star_impl(uuid) from public,anon;
grant execute on function kinfolk_private.has_gold_star_impl(uuid) to authenticated;

create or replace function kinfolk_private.grant_gold_star_impl(target_user uuid,grant_note text)
returns void language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid();
begin
 if actor is null or not exists(
   select 1 from auth.users u where u.id=actor
     and (u.raw_app_meta_data->>'kinfolk_role'='owner'
       or u.raw_app_meta_data->>'can_grant_gold'='true')
 ) then
   raise exception 'Gold Star gifting requires owner authorization' using errcode='42501';
 end if;
 if target_user is null or target_user=actor or not exists(select 1 from auth.users where id=target_user) then
   raise exception 'Invalid Gold Star recipient' using errcode='22023';
 end if;
 insert into public.gold_grants(user_id,granted_by,note,granted_at,expires_at)
 values(target_user,actor,left(coalesce(grant_note,''),300),now(),null)
 on conflict(user_id) do update
 set granted_by=excluded.granted_by,note=excluded.note,granted_at=now(),expires_at=null;
end;
$$;
revoke all on function kinfolk_private.grant_gold_star_impl(uuid,text) from public,anon;
grant execute on function kinfolk_private.grant_gold_star_impl(uuid,text) to authenticated;

create or replace function public.has_gold_star(target_user uuid)
returns boolean language sql stable security invoker set search_path=''
as $$ select kinfolk_private.has_gold_star_impl(target_user) $$;
create or replace function public.grant_gold_star(target_user uuid,grant_note text default null)
returns void language sql volatile security invoker set search_path=''
as $$ select kinfolk_private.grant_gold_star_impl(target_user,grant_note) $$;
revoke all on function public.has_gold_star(uuid) from public,anon;
revoke all on function public.grant_gold_star(uuid,text) from public,anon;
grant execute on function public.has_gold_star(uuid) to authenticated;
grant execute on function public.grant_gold_star(uuid,text) to authenticated;
