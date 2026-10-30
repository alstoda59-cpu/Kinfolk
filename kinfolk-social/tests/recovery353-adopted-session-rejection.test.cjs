'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'..','kinfolk-phase95.js'),'utf8');
const start=source.indexOf('async function clearFailedLoginSession(');
const end=source.indexOf('async function activateLoginSession(',start);
assert.ok(start>=0&&end>start,'effective Phase95 adoption and cleanup functions exist');
const helpers=source.slice(start,end)+';globalThis.__helpers={adopt,clearFailedLoginSession};';
const ID='synthetic-adult-a';
const EMAIL='alpha-a@example.invalid';
const TOKEN='synthetic-adopted-token';
const CONFIRMED='2026-10-30T00:00:00Z';
const tokens={access_token:'synthetic-password-token',refresh_token:'synthetic-refresh',user:{id:ID,email:EMAIL}};

function harness({adoptedEmail=EMAIL,adoptedConfirmed=CONFIRMED,activeEmail,activeConfirmed,activeToken=TOKEN,activeId=ID}={}){
  const adopted={user:{id:ID,email:adoptedEmail,email_confirmed_at:adoptedConfirmed},access_token:TOKEN};
  let active={user:{id:activeId,email:activeEmail===undefined?adoptedEmail:activeEmail,email_confirmed_at:activeConfirmed===undefined?adoptedConfirmed:activeConfirmed},access_token:activeToken};
  let reads=0,signouts=0;
  const auth={
    async setSession(){return {data:{session:adopted},error:null};},
    async getSession(){reads++;return {data:{session:active},error:null};},
    async signOut({scope}={}){assert.equal(scope,'local');signouts++;active=null;return {error:null};}
  };
  const context={sb:{auth},setTimeout,console:{warn(){}}};
  vm.runInNewContext(helpers,context,{timeout:1000});
  return {adopt:()=>context.__helpers.adopt(tokens),rollback:context.__helpers.clearFailedLoginSession,
    get active(){return active;},set active(value){active=value;},get reads(){return reads;},get signouts(){return signouts;}};
}
async function rejection(h,pattern){
  let failure;
  try{await h.adopt()}catch(error){failure=error}
  assert.ok(failure,'adoption must reject');
  assert.match(failure.message,pattern);
  return failure;
}

test('adopted wrong email is tagged with the actual adopted token for local cleanup',async()=>{
  const h=harness({adoptedEmail:'different@example.invalid'});
  const failure=await rejection(h,/authenticated email does not match/i);
  assert.equal(failure.adoptedSessionId,ID);
  assert.equal(failure.adoptedSessionToken,TOKEN);
  await h.rollback(failure.adoptedSessionId,null,failure.adoptedSessionToken);
  assert.equal(h.signouts,1);
  assert.equal(h.active,null);
});

test('unconfirmed adopted session is tagged and cleaned without opening a private account',async()=>{
  const h=harness({adoptedConfirmed:null});
  const failure=await rejection(h,/email still needs to be confirmed/i);
  assert.equal(failure.adoptedSessionToken,TOKEN);
  assert.equal(h.reads,0);
  await h.rollback(failure.adoptedSessionId,null,failure.adoptedSessionToken);
  assert.equal(h.signouts,1);
});

test('wrong active email after adoption tags only the original adopted token',async()=>{
  const h=harness({activeEmail:'switched@example.invalid'});
  const failure=await rejection(h,/active email changed/i);
  assert.equal(failure.adoptedSessionToken,TOKEN);
  await h.rollback(failure.adoptedSessionId,null,failure.adoptedSessionToken);
  assert.equal(h.signouts,1);
});

test('unconfirmed active session after confirmed adoption tags the adopted token',async()=>{
  const h=harness({activeConfirmed:null});
  const failure=await rejection(h,/email still needs to be confirmed/i);
  assert.equal(failure.adoptedSessionToken,TOKEN);
  await h.rollback(failure.adoptedSessionId,null,failure.adoptedSessionToken);
  assert.equal(h.signouts,1);
});

test('a newer same-user token is never returned as the session adopted by an older login',async()=>{
  const h=harness({activeToken:'synthetic-newer-token'});
  const failure=await rejection(h,/active session changed/i);
  assert.equal(failure.adoptedSessionToken,undefined,'do not tag newer session for cleanup');
  assert.equal(h.active.access_token,'synthetic-newer-token');
  assert.equal(h.signouts,0);
});

test('a newer same-user login survives rejected adopted-email cleanup',async()=>{
  const h=harness({adoptedEmail:'different@example.invalid'});
  const failure=await rejection(h,/authenticated email does not match/i);
  h.active={user:{id:ID,email:EMAIL,email_confirmed_at:CONFIRMED},access_token:'synthetic-newer-token'};
  await h.rollback(failure.adoptedSessionId,null,failure.adoptedSessionToken);
  assert.equal(h.signouts,0);
  assert.equal(h.active.access_token,'synthetic-newer-token');
});

test('a confirmed matching adopted session still completes normally',async()=>{
  const h=harness();
  const session=await h.adopt();
  assert.equal(session.user.id,ID);
  assert.equal(session.access_token,TOKEN);
  assert.equal(h.signouts,0);
});
