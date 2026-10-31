import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Execute the effective mobile helper with synthetic Auth responses.
// No credentials, real accounts, email delivery or network calls.
const source=readFileSync(new URL('../kinfolk-phase79.js',import.meta.url),'utf8');
const start=source.indexOf('async function signupSessionIsCurrent(');
const end=source.indexOf('function signupSessionEmailConfirmed(',start);
assert.ok(start>=0&&end>start,'effective signup helper found');
const helper=source.slice(start,end);
const email='synthetic@example.invalid';
const user={id:'synthetic-user',email,email_confirmed_at:'2026-10-30T18:00:00.000Z'};
const signup={access_token:'synthetic-signup-token',user};
const okSession=()=>({data:{session:signup},error:null});
const okUser=()=>({data:{user},error:null});

function run({getSession=async()=>okSession(),getUser=async()=>okUser()}={},session=signup){
  const sb={auth:{getSession,getUser}};
  const check=vm.runInNewContext('(()=>{'+helper+';return signupSessionIsCurrent})()', {sb},{timeout:2000});
  return check(session,email);
}

test('confirmed exact token requires authoritative Auth user and two local session reads',async()=>{
  let reads=0,verifiedToken;
  const passed=await run({
    getSession:async()=>{reads++;return okSession()},
    getUser:async token=>{verifiedToken=token;return okUser()}
  });
  assert.equal(passed,true);
  assert.equal(reads,2);
  assert.equal(verifiedToken,signup.access_token);
});

test('locally cached session is rejected when Auth has no matching user',async()=>{
  for(const response of [
    {data:{user:null},error:null},
    {data:{user:{...user,id:'other-user'}},error:null},
    {data:{user:{...user,email:'other@example.invalid'}},error:null},
    {data:{user:{...user,email:null}},error:null},
    {data:{user:{...user,email_confirmed_at:null}},error:null},
    {data:{user:{...user,email_confirmed_at:'  '}},error:null},
    {data:null,error:null}
  ]){
    assert.equal(await run({getUser:async()=>response}),false);
  }
});

test('Auth network failure does not authorize a persistent session',async()=>{
  await assert.rejects(run({getUser:async()=>({data:null,error:new Error('synthetic Auth unavailable')})}),/synthetic Auth unavailable/);
});

test('missing Auth getUser API fails closed',async()=>{
  const sb={auth:{getSession:async()=>okSession()}};
  const check=vm.runInNewContext('(()=>{'+helper+';return signupSessionIsCurrent})()', {sb});
  await assert.rejects(check(signup,email),/could not verify the signup session/i);
});

test('token rotation during remote Auth verification prevents preference persistence',async()=>{
  let release;
  const waiting=new Promise(resolve=>{release=resolve});
  let reads=0;
  const attempt=run({
    getSession:async()=>({data:{session:++reads===1?signup:{...signup,access_token:'newer-login-token'}},error:null}),
    getUser:()=>waiting
  });
  await Promise.resolve();
  release(okUser());
  assert.equal(await attempt,false);
  assert.equal(reads,2);
});

test('logout during remote Auth verification prevents persistence',async()=>{
  let reads=0;
  assert.equal(await run({
    getSession:async()=>({data:{session:++reads===1?signup:null},error:null})
  }),false);
});

test('mismatched initial token never makes a remote Auth request',async()=>{
  let called=0;
  assert.equal(await run({
    getSession:async()=>({data:{session:{...signup,access_token:'newer-login-token'}},error:null}),
    getUser:async()=>{called++;return okUser()}
  }),false);
  assert.equal(called,0);
});

test('second local session lookup error fails closed after remote verification',async()=>{
  let reads=0;
  await assert.rejects(run({
    getSession:async()=>++reads===1?okSession():{data:null,error:new Error('synthetic second read failed')}
  }),/synthetic second read failed/);
});

test('signup runtime uses the authoritative verifier before persistence and cleanup',()=>{
  const handler=source.slice(source.indexOf('async function handleSignup('));
  const first=handler.indexOf('const verifiedSignupSession=await signupSessionIsCurrent(data.session,email);');
  const persist=handler.indexOf('try{saveStay(stay)}',first);
  const cleanup=handler.indexOf('sameAccount=await signupSessionIsCurrent(data.session,email)',persist);
  assert.ok(first>=0&&persist>first&&cleanup>persist);
  assert.match(helper,/sb\.auth\.getUser\(expectedToken\)/);
  assert.match(helper,/const last=await sb\.auth\.getSession\(\)/);
});
