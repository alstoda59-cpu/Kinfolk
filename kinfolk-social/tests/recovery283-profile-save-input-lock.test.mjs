import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(path.join(root,'kinfolk-phase100.js'),'utf8');
const begin=source.indexOf('function lockEditorFields(');
const end=source.indexOf('function form()',begin);
assert.ok(begin>=0&&end>begin,'actual profile field-lock helper is present');
const lock=vm.runInNewContext(source.slice(begin,end)+';lockEditorFields');

test('profile fields are locked for the duration of an asynchronous save',()=>{
  const fields=[{disabled:false},{disabled:false},{disabled:false}];
  const restore=lock({querySelectorAll:selector=>{
    assert.equal(selector,'input,textarea,select');
    return fields;
  }});
  assert.ok(fields.every(f=>f.disabled));
  restore();
  assert.ok(fields.every(f=>!f.disabled));
});
test('existing disabled profile controls remain disabled after save',()=>{
  const fields=[{disabled:true},{disabled:false},{disabled:true}];
  const restore=lock({querySelectorAll:()=>fields});
  assert.ok(fields.every(f=>f.disabled));
  restore();
  assert.deepEqual(fields.map(f=>f.disabled),[true,false,true]);
});
test('field state is restored even if the original form was detached',()=>{
  const fields=[{disabled:false}];
  const form={isConnected:true,querySelectorAll:()=>fields};
  const restore=lock(form);
  form.isConnected=false;
  restore();
  assert.equal(fields[0].disabled,false);
});
test('save captures profile values and files before locking and awaiting media work',()=>{
  const capture=source.indexOf('const avatarFile=f.querySelector');
  const snapshot=source.indexOf('const ex={user_id:accountId');
  const freeze=source.indexOf('restoreEditorFields=lockEditorFields(f)');
  const firstAwait=source.indexOf("const avatar=await prepare(avatarFile,'Profile photo')");
  assert.ok(capture>0&&snapshot>capture&&freeze>snapshot&&firstAwait>freeze);
});
test('profile save always restores controls in finally',()=>{
  assert.match(source,/let restoreEditorFields=\(\)=>\{\};/);
  assert.match(source,/\}finally\{\s*restoreEditorFields\(\);\s*f\.dataset\.kf100Busy='0';/);
});
