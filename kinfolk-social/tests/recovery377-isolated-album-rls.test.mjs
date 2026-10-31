import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Static migration contract tests. These do NOT simulate authenticated JWTs
// or prove deployed Supabase RLS. Run real two-account tests before launch.
const sql=readFileSync(new URL('../migrations/ALPHA_only_photo_albums_rls.sql',import.meta.url),'utf8');
test('album migration is isolated and does not alter shared live project',()=>{
  assert.match(sql,/viantpfagtbgyyzavmtv/);
  assert.match(sql,/NEVER run on shared\/live zojajuzmfjpvubzibzgg/);
  assert.doesNotMatch(sql,/\bdrop\s+(?:table|schema|policy)\b/i);
  assert.doesNotMatch(sql,/\b(?:alter|update)\s+auth\.users\b/i);
});
test('both album tables require RLS and authenticated access',()=>{
  for(const table of ['photo_albums','album_photos']){
    assert.match(sql,new RegExp('create table public\\.'+table+'\\s*\\('));
    assert.match(sql,new RegExp('alter table public\\.'+table+' enable row level security'));
  }
  assert.match(sql,/revoke all on public\.photo_albums, public\.album_photos from public, anon, authenticated/);
  assert.match(sql,/grant select,insert,delete on public\.photo_albums,public\.album_photos to authenticated/);
  assert.doesNotMatch(sql,/grant\s+[^;]+\s+to\s+anon\s*;/i);
});
test('owner-only album writes and private-by-default visibility',()=>{
  assert.match(sql,/visibility text not null default 'private'/);
  for(const action of ['insert','update','delete'])
    assert.match(sql,new RegExp('create policy alpha_album_'+action+' on public\\.photo_albums'));
  assert.match(sql,/with check \(owner_id=\(select auth\.uid\(\)\)\)/);
  assert.match(sql,/char_length\(btrim\(title\)\) between 1 and 80/);
});
test('public reads require visibility, unblocked viewer and public owner profile',()=>{
  assert.match(sql,/visibility='public'/);
  assert.match(sql,/kinfolk_alpha_private\.not_blocked\(owner_id\)/);
  assert.match(sql,/p\.id=owner_id and p\.is_private=false/);
  assert.match(sql,/owner_id=\(select auth\.uid\(\)\)/);
});
test('photo rows are tied to parent owner and owner-prefixed storage path',()=>{
  assert.match(sql,/foreign key\(album_id,owner_id\)/);
  assert.match(sql,/references public\.photo_albums\(id,owner_id\) on delete cascade/);
  assert.match(sql,/album_photos_owner_path_check/);
  assert.match(sql,/owner_id::text\|\|\s*'\/albums\/'\|\|album_id::text/);
  assert.match(sql,/a\.id=album_photos\.album_id and a\.owner_id=album_photos\.owner_id/);
  assert.match(sql,/create policy alpha_album_photo_insert/);
});
test('signed album media reads require a linked public album, not a public bucket',()=>{
  assert.match(sql,/on storage\.objects for select to authenticated/);
  assert.match(sql,/ph\.storage_path=storage\.objects\.name/);
  assert.match(sql,/a\.visibility='public'/);
  assert.match(sql,/p\.is_private=false/);
  assert.match(sql,/kinfolk_alpha_private\.not_blocked\(a\.owner_id\)/);
  assert.doesNotMatch(sql,/\bpublic\s*=\s*true\b/i);
});
