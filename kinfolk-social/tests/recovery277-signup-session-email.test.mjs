import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

// Exercise the exact committed Phase79 helper, not a rewritten test copy.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(path.join(root,'kinfolk-phase79.js'),'utf8');
const start=source.indexOf('async function signupSessionIsCurrent(');
const end=source.indexOf('function updateSignupPrivacy(',start);
assert.ok(start>=0&&end>start,'Phase79 signup session helper found');
const snippet=source.slice(start,end);
const email='test.account@example.invalid';
const session={user:{id:'synthetic-user-a',email}};
function helper(active,{error=null,available=true}={}){
  const sb=available?{auth:{getSession:async()=>({data:{session:active},error})}}:undefined;
  return vm.runInNewContext('(()=>{'+snippet+';return signupSessionIsCurrent})()', {sb});
}
test('matching signup account ID and email can retain session choice',async()=>{
  assert.equal(await helper(session)(session,email),true);
});
test('case differences in confirmed email are accepted',async()=>{
  assert.equal(await helper({user:{id:'synthetic-user-a',email:'TEST.ACCOUNT@example.invalid'}})(session,email),true);
});
test('same ID with a changed active email is rejected',async()=>{
  assert.equal(await helper({user:{id:'synthetic-user-a',email:'other@example.invalid'}})(session,email),false);
});
test('different active account ID is rejected',async()=>{
  assert.equal(await helper({user:{id:'synthetic-user-b',email}})(session,email),false);
});
test('missing active or returned signup email is rejected',async()=>{
  assert.equal(await helper({user:{id:'synthetic-user-a'}})(session,email),false);
  assert.equal(await helper(session)({user:{id:'synthetic-user-a'}},email),false);
});
test('wrong submitted email or missing submitted email is rejected',async()=>{
  assert.equal(await helper(session)(session,'other@example.invalid'),false);
  assert.equal(await helper(session)(session,''),false);
});
test('session retrieval failure and missing auth are not treated as success',async()=>{
  await assert.rejects(helper(null,{error:new Error('auth unavailable')})(session,email),/auth unavailable/);
  await assert.rejects(helper(null,{available:false})(session,email),/could not verify/);
});
