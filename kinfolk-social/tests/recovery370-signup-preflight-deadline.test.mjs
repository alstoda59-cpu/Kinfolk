import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Execute the effective mobile preflight with fake timers and synthetic sessions.
// No Supabase requests, account creation, email delivery or physical devices.
const source=readFileSync(new URL('../kinfolk-phase79.js',import.meta.url),'utf8');
const start=source.indexOf('async function requireNoActiveSignupAccount(){');
const end=source.indexOf('async function handleSignup(',start);
assert.ok(start>=0&&end>start,'effective Phase79 preflight found');
const helper=source.slice(start,end);
const never=()=>new Promise(()=>{});

function harness(auth){
  let next=0;
  const pending=new Map(),cleared=[];
  const setTimeout=(fn,ms)=>{const id=++next;pending.set(id,{fn,ms});return id};
  const clearTimeout=id=>{cleared.push(id);pending.delete(id)};
  const check=vm.runInNewContext('(()=>{'+helper+';return requireNoActiveSignupAccount})()',{
    sb:{auth},setTimeout,clearTimeout
  },{timeout:2000});
  const expire=()=>{
    assert.equal(pending.size,1,'one preflight deadline is armed');
    const [id,entry]=[...pending.entries()][0];
    assert.equal(entry.ms,15000,'mobile preflight deadline is 15 seconds');
    entry.fn();
    return id;
  };
  return {check,pending,cleared,expire};
}

test('hung getSession rejects at 15 seconds and releases the timer',async()=>{
  const h=harness({getSession:never});
  const attempt=h.check();
  const rejected=assert.rejects(attempt,/could not check the current login in time/i);
  const id=h.expire();
  await rejected;
  assert.deepEqual(h.cleared,[id]);
  assert.equal(h.pending.size,0);
});

test('late unauthenticated preflight response cannot turn a timeout into approval',async()=>{
  let resolveSession;
  const h=harness({getSession:()=>new Promise(resolve=>{resolveSession=resolve})});
  const attempt=h.check();
  const rejected=assert.rejects(attempt,/could not check the current login in time/i);
  h.expire();
  await rejected;
  resolveSession({data:{session:null},error:null});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.pending.size,0,'no later preflight timer or retry');
});

test('unauthenticated account passes preflight and cancels deadline',async()=>{
  const h=harness({getSession:async()=>({data:{session:null},error:null})});
  assert.equal(await h.check(),true);
  assert.equal(h.pending.size,0);
  assert.equal(h.cleared.length,1);
});

test('signed-in account fails closed before signup and cancels deadline',async()=>{
  const h=harness({getSession:async()=>({data:{session:{user:{id:'synthetic-a'}}},error:null})});
  await assert.rejects(h.check(),/already signed in/i);
  assert.equal(h.pending.size,0);
  assert.equal(h.cleared.length,1);
});

test('malformed response without session field is rejected',async()=>{
  const h=harness({getSession:async()=>({data:{},error:null})});
  await assert.rejects(h.check(),/cannot verify the current account/i);
  assert.equal(h.pending.size,0);
});

test('Auth lookup errors reject without leaking a timer',async()=>{
  const h=harness({getSession:async()=>({data:null,error:new Error('synthetic auth unavailable')})});
  await assert.rejects(h.check(),/synthetic auth unavailable/i);
  assert.equal(h.pending.size,0);
  assert.equal(h.cleared.length,1);
});

test('preflight completes before credentials are sent, with no timed-out fallback',()=>{
  const handler=source.slice(end);
  const preflight=handler.indexOf('await requireNoActiveSignupAccount();');
  const unchanged=handler.indexOf('if(!signupInputsUnchanged(form,signupSnapshot))throw');
  const signUp=handler.indexOf('sb.auth.signUp({');
  assert.ok(preflight>=0&&unchanged>preflight&&signUp>unchanged);
  assert.match(helper,/if\(result===timedOut\)throw new Error/);
  assert.doesNotMatch(helper,/signUp\s*\(/);
});
