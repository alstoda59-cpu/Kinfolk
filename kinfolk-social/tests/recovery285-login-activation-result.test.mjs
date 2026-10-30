import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(path.join(root,'kinfolk-phase95.js'),'utf8');
const begin=source.indexOf('async function activateLoginSession(session){');
const end=source.indexOf(' let loginBusy=false',begin);
assert.ok(begin>=0&&end>begin,'Phase95 activation helper exists in actual app source');
const helperSource=source.slice(begin,end);
const session={user:{id:'synthetic-user-a',email:'alpha@example.invalid'}};
const helper=activate=>vm.runInNewContext(helperSource+';activateLoginSession',{
  window:activate===undefined?{}:{kf129ActivateSession:activate}
});

test('successful account activation resolves without error',async()=>{
  await assert.doesNotReject(helper(async()=>true)(session));
});
test('startup returning false must not be reported as a successful login',async()=>{
  await assert.rejects(helper(async()=>false)(session),/could not finish opening/);
});
test('startup returning undefined must not be reported as a successful login',async()=>{
  await assert.rejects(helper(async()=>undefined)(session),/could not finish opening/);
});
test('missing startup callback is a login failure',async()=>{
  await assert.rejects(helper()(session),/could not open your account/);
});
test('startup errors propagate into the existing login rollback path',async()=>{
  await assert.rejects(helper(async()=>{throw new Error('synthetic profile load failed')})(session),/synthetic profile load failed/);
});
test('activation receives the same verified session object',async()=>{
  let received;
  await helper(async s=>{received=s;return true})(session);
  assert.equal(received,session);
});
test('login handler awaits verified activation and preserves rollback on failure',()=>{
  const handler=source.slice(end);
  const activate=handler.indexOf('await activateLoginSession(session);');
  const recheck=handler.indexOf('if(await currentAccountId()!==session?.user?.id)',activate);
  assert.ok(activate>=0&&recheck>activate,'activation result checked before final account verification');
  assert.match(handler,/catch\(activationError\)\{try\{restoreStay\(\)\}/);
  assert.match(handler,/await clearFailedLoginSession\(session\?\.user\?\.id,startingAccount,session\?\.access_token\)/);
});
