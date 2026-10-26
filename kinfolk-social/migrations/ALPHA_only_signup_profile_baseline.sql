-- Kinfolk Social Recovery alpha signup baseline.
-- TARGET ONLY: isolated project viantpfagtbgyyzavmtv.
-- Never apply to shared/live project zojajuzmfjpvubzibzgg.
-- Synthetic test accounts only. No production data copied.
create schema if not exists kinfolk_alpha_private;
revoke all on schema kinfolk_alpha_private from public, anon, authenticated;

create table public.kinfolk_safety_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  birth_date date not null,
  mature_content_preference text not null default 'hide' check (mature_content_preference in ('hide','show')),
  direct_messages text not null default 'friends' check (direct_messages in ('nobody','friends','everyone')),
  discoverable boolean not null default false,
  daily_limit_minutes integer not null default 480 check (daily_limit_minutes between 1 and 1440),
  animated_wallpaper_url text,
  wallpaper_motion_enabled boolean not null default true,
  wallpaper_fit text not null default 'cover',
  wallpaper_autoplay boolean not null default false,
  wallpaper_dim_percent integer not null default 0 check (wallpaper_dim_percent between 0 and 100),
  updated_at timestamptz not null default now()
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,24}$'),
  display_name text not null default '',
  bio text not null default '',
  avatar_url text,
  wallpaper_url text,
  accent_color text not null default '#d95e9a',
  is_private boolean not null default true,
  created_at timestamptz not null default now(),
  website_url text,
  location_text text,
  profile_music_url text,
  zodiac_visible boolean not null default false,
  profile_layout text not null default 'classic',
  profile_animated boolean not null default false
);
create unique index profiles_username_ci_unique on public.profiles (lower(username));

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  show_online boolean not null default true,
  allow_messages text not null default 'friends' check (allow_messages in ('everyone','friends','nobody')),
  notify_posts boolean not null default true,
  notify_reels boolean not null default true,
  autoplay_video boolean not null default false,
  profile_music_enabled boolean not null default true,
  dark_mode boolean not null default true
);
create table public.kinfolk_user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  locale text not null default 'en',
  stay_signed_in boolean not null default false,
  allow_post_location boolean not null default false,
  disappearing_messages_default boolean not null default false,
  updated_at timestamptz not null default now()
);
create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  push_enabled boolean not null default true,
  email_enabled boolean not null default false,
  email_friend_requests boolean not null default true,
  email_messages boolean not null default false,
  email_group_activity boolean not null default false,
  email_post_activity boolean not null default false,
  marketing_email boolean not null default false,
  updated_at timestamptz not null default now()
);
create table public.kinfolk_profile_extras (
  user_id uuid primary key references auth.users(id) on delete cascade,
  music_url text,
  top_friends uuid[] not null default '{}',
  layout text not null default 'classic',
  updated_at timestamptz not null default now(),
  location_text text,
  website_url text,
  birthday date,
  gender text,
  orientation text,
  relationship_status text
);

alter table public.kinfolk_safety_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.kinfolk_user_preferences enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.kinfolk_profile_extras enable row level security;

revoke all on public.kinfolk_safety_settings,public.profiles,public.user_settings,
  public.kinfolk_user_preferences,public.notification_preferences,public.kinfolk_profile_extras from anon;
grant select,update on public.profiles to authenticated;
grant select,update on public.kinfolk_safety_settings to authenticated;
grant select,insert,update on public.user_settings,public.kinfolk_user_preferences,
  public.notification_preferences,public.kinfolk_profile_extras to authenticated;

create policy alpha_profile_read on public.profiles for select to authenticated using (true);
create policy alpha_profile_update_owner on public.profiles for update to authenticated
  using ((select auth.uid())=id) with check ((select auth.uid())=id);
create policy alpha_safety_read_owner on public.kinfolk_safety_settings for select to authenticated
  using ((select auth.uid())=user_id);
create policy alpha_safety_update_owner on public.kinfolk_safety_settings for update to authenticated
  using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

create policy alpha_settings_read on public.user_settings for select to authenticated using ((select auth.uid())=user_id);
create policy alpha_settings_insert on public.user_settings for insert to authenticated with check ((select auth.uid())=user_id);
create policy alpha_settings_update on public.user_settings for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy alpha_prefs_read on public.kinfolk_user_preferences for select to authenticated using ((select auth.uid())=user_id);
create policy alpha_prefs_insert on public.kinfolk_user_preferences for insert to authenticated with check ((select auth.uid())=user_id);
create policy alpha_prefs_update on public.kinfolk_user_preferences for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy alpha_notify_read on public.notification_preferences for select to authenticated using ((select auth.uid())=user_id);
create policy alpha_notify_insert on public.notification_preferences for insert to authenticated with check ((select auth.uid())=user_id);
create policy alpha_notify_update on public.notification_preferences for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy alpha_extras_read on public.kinfolk_profile_extras for select to authenticated using ((select auth.uid())=user_id);
create policy alpha_extras_insert on public.kinfolk_profile_extras for insert to authenticated with check ((select auth.uid())=user_id);
create policy alpha_extras_update on public.kinfolk_profile_extras for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

-- Birthdate is sealed at initial signup; users cannot re-declare adulthood in settings.
create function kinfolk_alpha_private.safety_write_guard() returns trigger language plpgsql
set search_path = '' as $$
begin
  if new.user_id is distinct from old.user_id or new.birth_date is distinct from old.birth_date then
    raise exception 'Account birthday cannot be changed through settings';
  end if;
  if pg_catalog.date_part('year',pg_catalog.age(current_date,old.birth_date)) < 18 then
    if new.mature_content_preference <> 'hide'
       or new.discoverable <> false or new.direct_messages='everyone'
       or new.daily_limit_minutes > 480 then
      raise exception 'Teen Safety Mode cannot be disabled';
    end if;
  end if;
  new.updated_at = now();
  return new;
end $$;
create trigger alpha_safety_write_guard before update on public.kinfolk_safety_settings
for each row execute function kinfolk_alpha_private.safety_write_guard();

create function kinfolk_alpha_private.profile_privacy_guard() returns trigger language plpgsql
set search_path = '' as $$
declare declared_date date;
begin
  if tg_op='UPDATE' and new.id is distinct from old.id then
    raise exception 'Profile owner cannot be changed';
  end if;
  select birth_date into declared_date from public.kinfolk_safety_settings where user_id=new.id;
  if declared_date is null then raise exception 'Missing account age record'; end if;
  if pg_catalog.date_part('year',pg_catalog.age(current_date,declared_date)) < 18 and new.is_private=false then
    raise exception 'Teen profiles must remain private';
  end if;
  return new;
end $$;
create trigger alpha_profile_privacy_guard before insert or update on public.profiles
for each row execute function kinfolk_alpha_private.profile_privacy_guard();

-- This fixed signup declaration supports alpha email tests only. Birthdates are
-- self-declared, not independent age verification. Do not claim age assurance.
create function kinfolk_alpha_private.create_alpha_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data,'{}'::jsonb);
  dob_text text := meta->>'signup_birthdate';
  dob date;
  declared_age integer;
  handle text;
  private_requested boolean;
begin
  if dob_text is null or dob_text !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    raise exception 'Birthday is required for alpha signup';
  end if;
  dob:=dob_text::date;
  declared_age:=pg_catalog.date_part('year',pg_catalog.age(current_date,dob))::integer;
  if declared_age < 13 or declared_age > 99 then
    raise exception 'Kinfolk signup requires ages 13 through 99';
  end if;
  handle:=coalesce(nullif(pg_catalog.btrim(meta->>'username'),''),'member_'||pg_catalog.substr(pg_catalog.replace(new.id::text,'-',''),1,12));
  if handle !~ '^[A-Za-z0-9_]{3,24}$' then
    raise exception 'Username must contain 3-24 letters, numbers or underscores';
  end if;
  private_requested:=coalesce(meta->>'profile_private','true') <> 'false';
  insert into public.kinfolk_safety_settings(user_id,birth_date) values(new.id,dob);
  insert into public.profiles(id,username,display_name,bio,is_private)
    values(new.id,handle,
      pg_catalog.left(coalesce(meta->>'profile_display_name',meta->>'display_name',''),100),
      pg_catalog.left(coalesce(meta->>'profile_bio',meta->>'bio',''),160),
      declared_age<18 or private_requested);
  insert into public.user_settings(user_id) values(new.id);
  insert into public.kinfolk_user_preferences(user_id,locale) values(new.id,
    case when meta->>'preferred_language' in ('en','es','fr','pt','de') then meta->>'preferred_language' else 'en' end);
  insert into public.notification_preferences(user_id) values(new.id);
  insert into public.kinfolk_profile_extras(user_id) values(new.id);
  return new;
end $$;
revoke all on function kinfolk_alpha_private.create_alpha_profile() from public, anon, authenticated;
revoke all on function kinfolk_alpha_private.safety_write_guard() from public, anon;
revoke all on function kinfolk_alpha_private.profile_privacy_guard() from public, anon;
create trigger on_alpha_user_created after insert on auth.users
for each row execute function kinfolk_alpha_private.create_alpha_profile();
