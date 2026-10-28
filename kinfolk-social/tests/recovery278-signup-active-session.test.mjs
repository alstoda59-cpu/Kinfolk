import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

// Run the exact Phase79 preflight helper, not a test-only reimplementation.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(path.join(root,'kinfolk-phase79.js'),'utf8');
const start=source.indexOf('async function requireNoActiveSignupAccount(){');
const end=source.indexOf('async function handleSignup(',start);
assert.ok(start>=0&&end>start,'Phase79 preflight helper exists');
const helperSource=source.slice(start,end);
function guard(auth){
  const sb=auth===undefined?undefined:{auth};
  return vm.runInNewContext('(()=>{'+helperSource+';return requireNoActiveSignupAccount})()', {sb});
}
test('unauthenticated synthetic account may begin signup',async()=>{
  assert.equal(await guard({getSession:async()=>({data:{session:null},error:null})})(),true);
});
test('signed-in account cannot be replaced through signup',async()=>{
  await assert.rejects(guard({getSession:async()=>({data:{session:{user:{id:'synthetic-user-a'}}},error:null})})(),/already signed in/);
});
test('malformed non-null session fails closed',async()=>{
  await assert.rejects(guard({getSession:async()=>({data:{session:{}},error:null})})(),/already signed in/);
});
test('missing session result fails closed',async()=>{
  await assert.rejects(guard({getSession:async()=>({data:{},error:null})})(),/cannot verify/);
});
test('unavailable auth fails closed',async()=>{
  await assert.rejects(guard()(),/cannot verify/);
  await assert.rejects(guard({})(),/cannot verify/);
});
test('auth lookup errors propagate and never approve signup',async()=>{
  await assert.rejects(guard({getSession:async()=>({data:null,error:new Error('synthetic auth outage')})})(),/synthetic auth outage/);
});
test('preflight and edited-form checks run before network signup',()=>{
  const handler=source.slice(end);
  const guardAt=handler.indexOf('await requireNoActiveSignupAccount();');
  const unchangedAt=handler.indexOf('if(!signupInputsUnchanged(form,signupSnapshot))throw');
  const requestAt=handler.indexOf('sb.auth.signUp({');
  assert.ok(guardAt>=0&&unchangedAt>guardAt&&requestAt>unchangedAt,'preflight and unchanged form required before signUp');
});
