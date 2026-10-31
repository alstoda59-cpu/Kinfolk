import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Exercise the effective Phase95 login preflight with synthetic Auth results.
// No real credentials, accounts, backend writes or device access.
const source=readFileSync(new URL('../kinfolk-phase95.js',import.meta.url),'utf8');
const start=source.indexOf('async function currentAccountId(){');
const end=source.indexOf('async function clearFailedLoginSession(',start);
assert.ok(start>=0&&end>start,'effective Phase95 login preflight found');
const helper=source.slice(start,end);
const never=()=>new Promise(()=>{});

function harness(auth,{timers=true}={}){
  let next=0;
  const pending=new Map(),cleared=[];
  const setTimeout=(fn,ms)=>{const id=++next;pending.set(id,{fn,ms});return id};
  const clearTimeout=id=>{cleared.push(id);pending.delete(id)};
  const context={sb:{auth}};
  if(timers)Object.assign(context,{setTimeout,clearTimeout});
  const check=vm.runInNewContext('(()=>{'+helper+';return currentAccountId})()',context,{timeout:2000});
  const expire=()=>{
    assert.equal(pending.size,1,'one login preflight deadline is armed');
    const [id,entry]=[...pending.entries()][0];
    assert.equal(entry.ms,15000,'login preflight deadline is 15 seconds');
    entry.fn();
    return id;
  };
  return {check,pending,cleared,expire};
}

test('hung login preflight rejects after 15 seconds and releases its deadline',async()=>{
  const h=harness({getSession:never});
  const attempt=h.check();
  const rejected=assert.rejects(attempt,/could not check the current login in time/i);
  const id=h.expire();
  await rejected;
  assert.deepEqual(h.cleared,[id]);
  assert.equal(h.pending.size,0);
});

test('late empty-session response cannot authorize a timed-out login',async()=>{
  let resolveSession;
  const h=harness({getSession:()=>new Promise(resolve=>{resolveSession=resolve})});
  const attempt=h.check();
  const rejected=assert.rejects(attempt,/could not check the current login in time/i);
  h.expire();
  await rejected;
  resolveSession({data:{session:null},error:null});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.pending.size,0);
});

test('no active account permits login and cancels the deadline',async()=>{
  const h=harness({getSession:async()=>({data:{session:null},error:null})});
  assert.equal(await h.check(),null);
  assert.equal(h.pending.size,0);
  assert.equal(h.cleared.length,1);
});

test('active account identity remains visible to the login account-switch guard',async()=>{
  const h=harness({getSession:async()=>({data:{session:{user:{id:'synthetic-active-member'}}},error:null})});
  assert.equal(await h.check(),'synthetic-active-member');
  assert.equal(h.pending.size,0);
});

test('missing session property fails closed instead of treating it as logged out',async()=>{
  const h=harness({getSession:async()=>({data:{},error:null})});
  await assert.rejects(h.check(),/could not verify the current login/i);
  assert.equal(h.pending.size,0);
});

test('malformed active account fails closed',async()=>{
  const h=harness({getSession:async()=>({data:{session:{user:{}}},error:null})});
  await assert.rejects(h.check(),/incomplete active session/i);
  assert.equal(h.pending.size,0);
});

test('Auth errors and absent responses cannot authorize login',async()=>{
  const errored=harness({getSession:async()=>({data:null,error:new Error('synthetic Auth unavailable')})});
  await assert.rejects(errored.check(),/synthetic Auth unavailable/);
  assert.equal(errored.pending.size,0);
  const missing=harness({getSession:async()=>undefined});
  await assert.rejects(missing.check(),/could not verify the current login/i);
  assert.equal(missing.pending.size,0);
});

test('timerless offline VM fixtures retain strict session validation',async()=>{
  const valid=harness({getSession:async()=>({data:{session:null},error:null})},{timers:false});
  assert.equal(await valid.check(),null);
  const invalid=harness({getSession:async()=>({data:{},error:null})},{timers:false});
  await assert.rejects(invalid.check(),/could not verify the current login/i);
});

test('login waits for preflight before sending credentials and rechecks before adoption',()=>{
  const handler=source.slice(end);
  const initial=handler.indexOf('const startingAccount=await currentAccountId();');
  const token=handler.indexOf('const tokens=await tokenLogin(email,password);');
  const recheck=handler.indexOf('if(await currentAccountId()!==startingAccount)');
  assert.ok(initial>=0&&token>initial&&recheck>token);
  assert.match(helper,/if\(result===timedOut\)throw new Error/);
});
