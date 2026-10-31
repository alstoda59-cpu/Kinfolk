import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Execute the effective Phase95 password-token request with synthetic responses.
// No real credentials, accounts, Supabase writes, or physical devices.
const source=readFileSync(new URL('../kinfolk-phase95.js',import.meta.url),'utf8');
const start=source.indexOf('async function tokenLogin(email,password){');
const end=source.indexOf('async function currentAccountId(){',start);
assert.ok(start>=0&&end>start,'effective Phase95 token login found');
const helper=source.slice(start,end);
const email='recovery372@example.invalid';
const valid={
  access_token:'synthetic-access-token',
  refresh_token:'synthetic-refresh-token',
  user:{id:'synthetic-372-account',email,email_confirmed_at:'2026-10-31T00:00:00Z'}
};
const never=()=>new Promise(()=>{});
const deferred=()=>{
  let resolve,reject;
  const promise=new Promise((yes,no)=>{resolve=yes;reject=no});
  return {promise,resolve,reject};
};
const response=(data,status=200)=>({
  ok:status>=200&&status<300,status,json:async()=>data
});

function harness(fetchImpl){
  let next=0;
  const pending=new Map(),cleared=[],requests=[];
  const setTimeout=(callback,ms)=>{
    const id=++next;pending.set(id,{callback,ms});return id;
  };
  const clearTimeout=id=>{cleared.push(id);pending.delete(id)};
  const fetch=(url,init)=>{requests.push({url,init});return fetchImpl(url,init)};
  const login=vm.runInNewContext('(()=>{'+helper+';return tokenLogin})()',{
    SUPABASE_URL:'https://synthetic-alpha.invalid',
    ANON_KEY:'synthetic-publishable-key',
    friendly:raw=>'Friendly login error: '+raw,
    AbortController,Promise,setTimeout,clearTimeout,fetch
  },{timeout:2000});
  const expire=()=>{
    assert.equal(pending.size,1,'one hard deadline must be armed');
    const [id,timer]=[...pending.entries()][0];
    assert.equal(timer.ms,15000,'password request has 15-second deadline');
    timer.callback();
    return id;
  };
  return {login,pending,cleared,requests,expire};
}

test('hung password fetch fails after 15 seconds even when fetch ignores AbortSignal',async()=>{
  const h=harness(never);
  const attempt=h.login(email,'synthetic-password-123');
  const failure=assert.rejects(attempt,/login timed out/i);
  const id=h.expire();
  await failure;
  assert.equal(h.requests.length,1);
  assert.equal(h.requests[0].init.signal.aborted,true);
  assert.equal(h.requests[0].init.method,'POST');
  assert.equal(h.requests[0].init.cache,'no-store');
  assert.deepEqual(h.cleared,[id]);
  assert.equal(h.pending.size,0);
});

test('hung response body is also bounded by the same deadline',async()=>{
  const h=harness(async()=>({ok:true,status:200,json:never}));
  const attempt=h.login(email,'synthetic-password-123');
  const failure=assert.rejects(attempt,/login timed out/i);
  await new Promise(resolve=>setImmediate(resolve));
  h.expire();
  await failure;
  assert.equal(h.requests[0].init.signal.aborted,true);
  assert.equal(h.pending.size,0);
});

test('late successful fetch cannot authorize a timed-out login',async()=>{
  const request=deferred(),h=harness(()=>request.promise);
  const attempt=h.login(email,'synthetic-password-123');
  const failure=assert.rejects(attempt,/login timed out/i);
  h.expire();
  await failure;
  request.resolve(response(valid));
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.pending.size,0);
});

test('late successful JSON body cannot authorize a timed-out login',async()=>{
  const body=deferred();
  const h=harness(async()=>({ok:true,status:200,json:()=>body.promise}));
  const attempt=h.login(email,'synthetic-password-123');
  const failure=assert.rejects(attempt,/login timed out/i);
  await new Promise(resolve=>setImmediate(resolve));
  h.expire();
  await failure;
  body.resolve(valid);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.pending.size,0);
});

test('valid confirmed synthetic token returns unchanged and clears the deadline',async()=>{
  const h=harness(async()=>response(valid));
  const result=await h.login(email,'synthetic-password-123');
  assert.equal(result.access_token,valid.access_token);
  assert.equal(result.user.email,email);
  assert.equal(h.pending.size,0);
  assert.equal(h.cleared.length,1);
  assert.equal(h.requests.length,1);
  assert.equal(JSON.parse(h.requests[0].init.body).email,email);
});

test('invalid credentials still produce a friendly error and clear the timer',async()=>{
  const h=harness(async()=>response({error_description:'Invalid login credentials'},400));
  await assert.rejects(h.login(email,'synthetic-wrong-password'),/Friendly login error: Invalid login credentials/);
  assert.equal(h.pending.size,0);
  assert.equal(h.cleared.length,1);
});

test('wrong email and unconfirmed user remain rejected after a timely response',async()=>{
  for(const bad of [
    {...valid,user:{...valid.user,email:'other@example.invalid'}},
    {...valid,user:{...valid.user,email_confirmed_at:null}}
  ]){
    const h=harness(async()=>response(bad));
    await assert.rejects(h.login(email,'synthetic-password-123'),/different email|email still needs to be confirmed/i);
    assert.equal(h.pending.size,0);
  }
});

test('network errors fail promptly and cancel the deadline',async()=>{
  const h=harness(async()=>{throw Error('synthetic network unavailable')});
  await assert.rejects(h.login(email,'synthetic-password-123'),/synthetic network unavailable/);
  assert.equal(h.pending.size,0);
  assert.equal(h.cleared.length,1);
});

test('malformed successful response cannot create an authenticated session',async()=>{
  const h=harness(async()=>({ok:true,status:200,json:async()=>{throw Error('invalid JSON')}}));
  await assert.rejects(h.login(email,'synthetic-password-123'),/incomplete login session/i);
  assert.equal(h.pending.size,0);
});

test('effective handler saves Stay Logged In only after bounded password request and account recheck',()=>{
  const handler=source.slice(end);
  const token=handler.indexOf('const tokens=await tokenLogin(email,password);');
  const recheck=handler.indexOf('if(await currentAccountId()!==startingAccount)');
  const save=handler.indexOf('const restoreStay=saveStay(stay);');
  assert.ok(token>=0&&recheck>token&&save>recheck);
  assert.match(helper,/Promise\.race\(\[request,deadline\]\)/);
  assert.match(helper,/controller\.abort\(\)/);
});
