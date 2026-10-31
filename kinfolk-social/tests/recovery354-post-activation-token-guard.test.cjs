'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'..','kinfolk-phase95.js'),'utf8');
const start=source.indexOf('async function verifyActiveLoginToken(');
const end=source.indexOf('async function activateLoginSession(',start);
assert.ok(start>=0&&end>start,'effective Phase95 token identity verifier exists');
const helperSource=source.slice(start,end)+';globalThis.__verify=verifyActiveLoginToken;';
const expected={user:{id:'synthetic-user-a'},access_token:'synthetic-adopted-token'};

function harness({id=expected.user.id,token=expected.access_token,error=null,missingAuth=false}={}){
  let reads=0;
  const auth={async getSession(){reads++;return {data:{session:{user:{id},access_token:token}},error};}};
  const ctx=missingAuth?{}:{sb:{auth}};
  vm.runInNewContext(helperSource,ctx,{timeout:1000});
  return {verify:ctx.__verify,get reads(){return reads}};
}

test('the exact adopted account and access token are accepted',async()=>{
  const h=harness();
  await assert.doesNotReject(h.verify(expected));
  assert.equal(h.reads,1);
});

test('a newer same-user login token is rejected rather than activated',async()=>{
  const h=harness({token:'synthetic-newer-token'});
  await assert.rejects(h.verify(expected),/active session changed/i);
});

test('another account cannot pass adopted session verification',async()=>{
  const h=harness({id:'synthetic-user-b'});
  await assert.rejects(h.verify(expected),/active session changed/i);
});

test('missing active access token is rejected',async()=>{
  const h=harness({token:null});
  await assert.rejects(h.verify(expected),/active session changed/i);
});

test('missing expected token fails closed without querying auth',async()=>{
  const h=harness();
  await assert.rejects(h.verify({user:{id:expected.user.id}}),/could not verify/i);
  assert.equal(h.reads,0);
});

test('Supabase getSession error is propagated and not treated as verified',async()=>{
  const h=harness({error:new Error('Synthetic auth read failed')});
  await assert.rejects(h.verify(expected),/Synthetic auth read failed/);
});

test('unavailable auth client fails closed',async()=>{
  const h=harness({missingAuth:true});
  await assert.rejects(h.verify(expected),/could not verify/i);
});

test('the effective login handler verifies token both before and after activation',()=>{
  const handler=source.slice(source.indexOf('let loginBusy=false,activeLoginTitle=null;'));
  const calls=[...handler.matchAll(/await verifyActiveLoginToken\(session\);/g)].map(m=>m.index);
  const activation=handler.indexOf('await activateLoginSession(session);');
  assert.equal(calls.length,2);
  assert.ok(calls[0]<activation&&calls[1]>activation);
  assert.match(handler,/clearFailedLoginSession\(session\?\.user\?\.id,startingAccount,session\?\.access_token\)/);
});
