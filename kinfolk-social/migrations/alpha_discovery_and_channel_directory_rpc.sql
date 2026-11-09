-- Applied to isolated alpha project viantpfagtbgyyzavmtv on 2026-11-09.
-- SECURITY INVOKER intentionally retains table RLS; anon cannot call either RPC.
create or replace function public.kinfolk_discover_people(p_query text default null,p_limit integer default 30)
returns table(id uuid,username text,display_name text,bio text,avatar_url text,is_private boolean,friend_status text,friend_direction text)
language sql security invoker set search_path = ''
as $$
select p.id,p.username,p.display_name,p.bio,p.avatar_url,p.is_private,
fr.status as friend_status,
case when fr.sender_id=(select auth.uid()) then 'outgoing'
     when fr.receiver_id=(select auth.uid()) then 'incoming' else null end as friend_direction
from public.profiles p
left join lateral (
 select f.sender_id,f.receiver_id,f.status from public.friend_requests f
 where (f.sender_id=(select auth.uid()) and f.receiver_id=p.id)
 or (f.receiver_id=(select auth.uid()) and f.sender_id=p.id)
 order by f.created_at desc limit 1
) fr on true
where (select auth.uid()) is not null and p.id<>(select auth.uid())
and not exists (select 1 from public.blocks b
 where (b.blocker_id=(select auth.uid()) and b.blocked_id=p.id)
 or (b.blocker_id=p.id and b.blocked_id=(select auth.uid())))
and (nullif(trim(coalesce(p_query,'')),'') is null or
p.username ilike '%'||trim(p_query)||'%' or
coalesce(p.display_name,'') ilike '%'||trim(p_query)||'%')
order by case when lower(p.username)=lower(coalesce(p_query,'')) then 0 else 1 end,
coalesce(p.display_name,p.username),p.username
limit greatest(1,least(coalesce(p_limit,30),50))
$$;
create or replace function public.kinfolk_channel_directory(p_mode text default 'discover',p_limit integer default 60)
returns table(id uuid,owner_id uuid,title text,description text,slug text,avatar_url text,banner_url text,category text,created_at timestamptz,updated_at timestamptz,subscriber_count bigint,is_subscribed boolean)
language sql security invoker set search_path = ''
as $$
select p.id,p.owner_id,p.title,p.description,p.slug,p.avatar_url,p.banner_url,p.category,p.created_at,p.updated_at,
(select count(*) from public.kinfolk_channel_subscriptions s where s.channel_id=p.id) as subscriber_count,
exists(select 1 from public.kinfolk_channel_subscriptions s where s.channel_id=p.id and s.user_id=(select auth.uid())) as is_subscribed
from public.kinfolk_pages p
where (select auth.uid()) is not null
and not exists (select 1 from public.blocks b where
(b.blocker_id=(select auth.uid()) and b.blocked_id=p.owner_id)
or (b.blocker_id=p.owner_id and b.blocked_id=(select auth.uid())))
and (coalesce(p_mode,'discover')='discover'
or (p_mode='mine' and p.owner_id=(select auth.uid()))
or (p_mode='subscriptions' and exists(select 1 from public.kinfolk_channel_subscriptions s where s.channel_id=p.id and s.user_id=(select auth.uid()))))
order by p.created_at desc
limit greatest(1,least(coalesce(p_limit,60),100))
$$;
revoke all on function public.kinfolk_discover_people(text,integer) from public,anon;
revoke all on function public.kinfolk_channel_directory(text,integer) from public,anon;
grant execute on function public.kinfolk_discover_people(text,integer) to authenticated;
grant execute on function public.kinfolk_channel_directory(text,integer) to authenticated;
