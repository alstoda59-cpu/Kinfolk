import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Execute the effective Phase79 verifier with synthetic sessions and a fake
// 20-second browser timer. No real accounts, credentials or network requests.
const source=readFileSync(new URL('../kinfolk-phase79.js',import.meta.url),'utf8');
const start=source.indexOf('async function signupSessionIsCurrent(');
const end=source.indexOf('function signupSessionEmailConfirmed(',start);
assert.ok(start>=0&&end>start,'effective signup verifier found');
const helper=source.slice(start,end);
const email='deadline-test@example.invalid';
const user={id:'synthetic-deadline-member',email,email_confirmed_at:'2026-10-30T00:00:00Z'};
const signup={user,access_token:'synthetic-deadline-token'};
const session=()=>({data:{session:signup},error:null});
const confirmed=()=>({data:{user},error:null});
const never=()=>new Promise(()=>{});

function makeVerifier(auth){
  let next=0;
  const pending=new Map();
  const cancelled=[];
  const setTimeout=(callback,ms)=>{const id=++next;pending.set(id,{callback,ms});return id};
  const clearTimeout=id=>{cancelled.push(id);pending.delete(id)};
  const check=vm.runInNewContext('(()=>{'+helper+';return signupSessionIsCurrent})()',{
    sb:{auth},setTimeout,clearTimeout
  },{timeout:2000});
  const expire=()=>{
    assert.equal(pending.size,1,'one verification deadline is armed');
    const [id,entry]=[...pending.entries()][0];
    assert.equal(entry.ms,20000,'mobile deadline is 20 seconds');
    entry.callback();
    return id;
  };
  return {check,pending,cancelled,expire};
}

test('hung initial getSession fails closed after deadline and clears timer',async()=>{
  const h=makeVerifier({getSession:never,getUser:async()=>confirmed()});
  const attempt=h.check(signup,email);
  const failure=assert.rejects(attempt,/could not verify the signup session in time/i);
  const id=h.expire();
  await failure;
  assert.deepEqual(h.cancelled,[id]);
  assert.equal(h.pending.size,0);
});

test('hung remote getUser cannot leave the signup button waiting indefinitely',async()=>{
  let token;
  const h=makeVerifier({
    getSession:async()=>session(),
    getUser:value=>{token=value;return never()}
  });
  const attempt=h.check(signup,email);
  const failure=assert.rejects(attempt,/could not verify the signup session in time/i);
  // Drain the VM realm's async continuation before checking the remote call.
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(token,signup.access_token);
  h.expire();
  await failure;
  assert.equal(h.pending.size,0);
});

test('hung final session recheck fails closed instead of persisting stale preference',async()=>{
  let reads=0;
  const h=makeVerifier({
    getSession:()=>++reads===1?Promise.resolve(session()):never(),
    getUser:async()=>confirmed()
  });
  const attempt=h.check(signup,email);
  const failure=assert.rejects(attempt,/could not verify the signup session in time/i);
  // A Node event-loop turn flushes promises created in the isolated VM realm.
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(reads,2);
  h.expire();
  await failure;
});

test('successful authoritative verification cancels deadline',async()=>{
  let reads=0;
  const h=makeVerifier({
    getSession:async()=>{reads++;return session()},
    getUser:async()=>confirmed()
  });
  assert.equal(await h.check(signup,email),true);
  assert.equal(reads,2);
  assert.equal(h.pending.size,0);
  assert.equal(h.cancelled.length,1);
});

test('failed identity verification also cancels deadline',async()=>{
  const h=makeVerifier({
    getSession:async()=>session(),
    getUser:async()=>({data:{user:{...user,id:'wrong-synthetic-member'}},error:null})
  });
  assert.equal(await h.check(signup,email),false);
  assert.equal(h.pending.size,0);
  assert.equal(h.cancelled.length,1);
});

test('runtime still waits for verification before storing Stay Logged In',()=>{
  const handler=source.slice(source.indexOf('async function handleSignup('));
  assert.ok(handler.indexOf('const verifiedSignupSession=await signupSessionIsCurrent(data.session,email);')>=0);
  assert.ok(handler.indexOf('try{saveStay(stay)}')>handler.indexOf('const verifiedSignupSession=await signupSessionIsCurrent(data.session,email);'));
});
