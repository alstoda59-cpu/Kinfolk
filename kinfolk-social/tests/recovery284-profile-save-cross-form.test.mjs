import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(path.join(root,'kinfolk-phase100.js'),'utf8');
const begin=source.indexOf('let activeProfileSaveAccount=null;');
const end=source.indexOf('function form()',begin);
assert.ok(begin>=0&&end>begin,'cross-form save gate present in actual Phase100');
const gate=vm.runInNewContext(source.slice(begin,end)+';({claimProfileSave,releaseProfileSave})');

test('first profile save claims gate, second form for same account cannot overlap',()=>{
  assert.equal(gate.claimProfileSave('account-a'),true);
  assert.equal(gate.claimProfileSave('account-a'),false);
  gate.releaseProfileSave('account-a');
});
test('another account cannot write while previous save is pending',()=>{
  assert.equal(gate.claimProfileSave('account-a'),true);
  assert.equal(gate.claimProfileSave('account-b'),false);
  gate.releaseProfileSave('account-a');
  assert.equal(gate.claimProfileSave('account-b'),true);
  gate.releaseProfileSave('account-b');
});
test('wrong-account release cannot unlock an active save',()=>{
  assert.equal(gate.claimProfileSave('account-a'),true);
  gate.releaseProfileSave('account-b');
  assert.equal(gate.claimProfileSave('account-b'),false);
  gate.releaseProfileSave('account-a');
});
test('release is idempotent and permits a later save',()=>{
  assert.equal(gate.claimProfileSave('account-a'),true);
  gate.releaseProfileSave('account-a');
  gate.releaseProfileSave('account-a');
  assert.equal(gate.claimProfileSave('account-a'),true);
  gate.releaseProfileSave('account-a');
});
test('save claims before async work and releases in finally',()=>{
  const save=source.slice(source.indexOf('async function save(e){'));
  const claim=save.indexOf('if(!claimProfileSave(accountId))');
  const firstAwait=save.indexOf('const avatar=await prepare(avatarFile');
  assert.ok(claim>0&&firstAwait>claim);
  assert.match(save,/}finally\{\s*restoreEditorFields\(\);\s*f\.dataset\.kf100Busy='0';\s*releaseProfileSave\(accountId\);/);
});
