import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(
  new URL('../migrations/ALPHA_only_media_comments_target_delete_cleanup.sql',import.meta.url),
  'utf8'
);
const prior=readFileSync(
  new URL('../migrations/ALPHA_only_media_comments_rls.sql',import.meta.url),
  'utf8'
);

test('cleanup is explicitly scoped to the existing isolated alpha project',()=>{
  assert.match(sql,/viantpfagtbgyyzavmtv/);
  assert.match(sql,/NEVER apply to shared\/live zojajuzmfjpvubzibzgg/);
  assert.doesNotMatch(sql,/alter\s+table\s+auth\./i);
});

test('cleanup runs only after actual target deletion',()=>{
  assert.match(sql,/create trigger kinfolk_alpha_video_comment_cleanup\s+after delete on public\.kinfolk_videos\s+for each row/i);
  assert.match(sql,/create trigger kinfolk_alpha_photo_comment_cleanup\s+after delete on public\.album_photos\s+for each row/i);
  assert.doesNotMatch(sql,/before delete on public\./i);
});

test('video deletion removes only comments attached to that exact video',()=>{
  assert.match(sql,/TG_RELID = 'public\.kinfolk_videos'::regclass[\s\S]*?TG_ARGV\[0\] = 'video'[\s\S]*?delete from public\.media_comments\s+where target_type = 'video' and target_id = OLD\.id/i);
});

test('photo deletion removes only comments attached to that exact photo',()=>{
  assert.match(sql,/TG_RELID = 'public\.album_photos'::regclass[\s\S]*?TG_ARGV\[0\] = 'photo'[\s\S]*?delete from public\.media_comments\s+where target_type = 'photo' and target_id = OLD\.id/i);
});

test('unexpected trigger attachments fail closed instead of broad deletion',()=>{
  assert.match(sql,/TG_NARGS = 1/g);
  assert.match(sql,/raise exception 'Unsupported Kinfolk media comment cleanup target'/);
  assert.doesNotMatch(sql,/delete from public\.media_comments\s*;/i);
});

test('cleanup has a fixed search path and is not callable by API roles',()=>{
  assert.match(sql,/returns trigger language plpgsql security definer set search_path = ''/i);
  assert.match(sql,/revoke all on function kinfolk_alpha_private\.cleanup_deleted_media_target_comments\(\)\s+from public, anon, authenticated/i);
  assert.doesNotMatch(sql,/grant execute[^;]*to (?:public|anon|authenticated)/i);
});

test('threaded replies are removed by existing parent cascade',()=>{
  assert.match(prior,/foreign key \(parent_id,target_type,target_id\)[\s\S]*?references public\.media_comments\(id,target_type,target_id\) on delete cascade/i);
});
