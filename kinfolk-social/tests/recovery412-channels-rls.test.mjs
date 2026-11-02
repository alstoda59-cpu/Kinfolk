import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Source-contract tests only. They do NOT prove real Auth, two-account RLS,
// email delivery, media playback or physical Android/iPhone behavior.
const sql=readFileSync(new URL('../migrations/ALPHA_only_channels_video_playlists_rls.sql',import.meta.url),'utf8');
const tables=['kinfolk_pages','kinfolk_channel_subscriptions','kinfolk_videos',
  'kinfolk_playlists','kinfolk_playlist_items','kinfolk_video_reactions'];
const policy=(name,table,command)=>new RegExp('create policy '+name+' on public\\.'+table+' for '+command+' to authenticated');

test('Recovery412 migration is isolated and never mutates live Auth',()=>{
  assert.match(sql,/ONLY the existing isolated Kinfolk Social Alpha Test project/);
  assert.match(sql,/viantpfagtbgyyzavmtv/);
  assert.match(sql,/NEVER apply to shared\/live zojajuzmfjpvubzibzgg/);
  assert.doesNotMatch(sql,/\bdrop\s+(?:table|schema|policy)\b/i);
  assert.doesNotMatch(sql,/\b(?:insert|update|delete|alter)\s+(?:into\s+|from\s+)?auth\.users\b/i);
});
test('six Channels/video tables are RLS enabled and anonymous table access is revoked',()=>{
  for(const table of tables){
    assert.match(sql,new RegExp('create table public\\.'+table+' \\('));
    assert.match(sql,new RegExp('alter table public\\.'+table+' enable row level security'));
  }
  assert.match(sql,/from public,anon,authenticated/);
  assert.doesNotMatch(sql,/grant\s+[^;]+\s+to anon\s*;/i);
});
test('channel creation and editing require owner identity and privacy/blocks gate reads',()=>{
  assert.match(sql,policy('alpha_channel_read','kinfolk_pages','select'));
  assert.match(sql,/p\.is_private=false/);
  assert.match(sql,/kinfolk_alpha_private\.not_blocked\(owner_id\)/);
  assert.match(sql,policy('alpha_channel_insert','kinfolk_pages','insert'));
  assert.match(sql,/with check \(owner_id=\(select auth\.uid\(\)\)\)/);
  assert.match(sql,policy('alpha_channel_update','kinfolk_pages','update'));
  assert.match(sql,/grant update\(title,slug,description,category,avatar_url,banner_url,updated_at\)/);
});
test('channel avatar and banner paths cannot reference another member storage',()=>{
  assert.match(sql,/owner_id::text\|\|\'\/channels\/avatar\/\'/);
  assert.match(sql,/owner_id::text\|\|\'\/channels\/banner\/\'/);
  assert.match(sql,/create policy kinfolk_alpha_channel_media_read on storage\.objects/);
});
test('subscription writes are self-only and notification levels constrained',()=>{
  assert.match(sql,/notify_level in \('all','personalized','none'\)/);
  for(const verb of ['insert','update','delete'])assert.match(sql,policy('alpha_channel_sub_'+verb,'kinfolk_channel_subscriptions',verb));
  assert.match(sql,/user_id=\(select auth\.uid\(\)\)/);
});
test('videos enforce owned channel FK, upload size/MIME and storage path safety',()=>{
  assert.match(sql,/foreign key\(channel_id,creator_id\)/);
  assert.match(sql,/references public\.kinfolk_pages\(id,owner_id\)/);
  assert.match(sql,/source_size between 1 and 52428800/);
  assert.match(sql,/source_mime in \('video\/mp4','video\/webm'\)/);
  assert.match(sql,/source_type='external' and storage_path is null/);
  assert.match(sql,/source_type='upload'[\s\S]*?and video_url is null/);
  assert.match(sql,/creator_id::text\|\|\'\/videos\/\'/);
});
test('video reads require ready public media, public profile and no blocks',()=>{
  assert.match(sql,policy('alpha_video_read','kinfolk_videos','select'));
  assert.match(sql,/visibility='public' and processing_status='ready'/);
  assert.match(sql,/kinfolk_alpha_private\.not_blocked\(creator_id\)/);
  assert.match(sql,/create policy kinfolk_alpha_public_video_media_read on storage\.objects/);
});
test('playlists belong to channel owner and private/unlisted are not public',()=>{
  assert.match(sql,/constraint kinfolk_playlist_owned_channel_fk foreign key\(channel_id,owner_id\)/);
  assert.match(sql,policy('alpha_playlist_read','kinfolk_playlists','select'));
  assert.match(sql,/visibility='public' and kinfolk_alpha_private\.not_blocked\(owner_id\)/);
  assert.match(sql,policy('alpha_playlist_insert','kinfolk_playlists','insert'));
});
test('playlist item insertion requires same-channel owned videos',()=>{
  assert.match(sql,policy('alpha_playlist_item_insert','kinfolk_playlist_items','insert'));
  assert.match(sql,/v\.id=video_id and v\.channel_id=p\.channel_id/);
  assert.match(sql,/p\.owner_id=\(select auth\.uid\(\)\)/);
  assert.match(sql,/v\.creator_id=\(select auth\.uid\(\)\)/);
  assert.doesNotMatch(sql,/grant update\([^)]*\) on public\.kinfolk_playlist_items/);
});
test('reactions are restricted to visible videos and the authenticated reactor',()=>{
  for(const verb of ['read','insert','update','delete']){
    const cmd=verb==='read'?'select':verb;
    assert.match(sql,policy('alpha_video_reaction_'+verb,'kinfolk_video_reactions',cmd));
  }
  assert.match(sql,/reaction in \('like','dislike'\)/);
  assert.match(sql,/exists\(select 1 from public\.kinfolk_videos v where v\.id=video_id\)/);
});
