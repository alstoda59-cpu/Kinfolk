-- REVIEW ONLY. Do not execute against the shared production Supabase project without owner approval.
-- Apply to an isolated staging project first, then validate authenticated RLS policies.
create table if not exists public.kinfolk_video_reactions (
 video_id uuid not null references public.kinfolk_videos(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 reaction text not null check (reaction in ('like','dislike')),
 created_at timestamptz not null default now(),
 primary key(video_id,user_id)
);
alter table public.kinfolk_video_reactions enable row level security;
create policy "Authenticated users can read video reactions" on public.kinfolk_video_reactions for select to authenticated using (exists (select 1 from public.kinfolk_videos v where v.id=video_id));
create policy "Users can add their own reactions" on public.kinfolk_video_reactions for insert to authenticated with check (auth.uid()=user_id and exists (select 1 from public.kinfolk_videos v where v.id=video_id));
create policy "Users can update their own reactions" on public.kinfolk_video_reactions for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "Users can remove their own reactions" on public.kinfolk_video_reactions for delete to authenticated using (auth.uid()=user_id);
-- Before approval, verify kinfolk_videos RLS and visibility/age restrictions; policy above may be too broad for private/mature videos.
