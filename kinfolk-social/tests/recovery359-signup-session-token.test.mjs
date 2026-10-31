import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Execute the actual Phase79 helper with synthetic sessions only.
// Never connect to a live or test Supabase project in this suite.
const source=readFileSync(new URL('../kinfolk-phase79.js',import.meta.url),'utf8');
const start=source.indexOf('async function signupSessionIsCurrent(');
const end=source.indexOf('function updateSignupPrivacy(',start);
assert.ok(start>=0&&end>start,'effective signup session verifier exists');
const production=source.slice(start,end);
const email='member@example.invalid';
const signup={access_token:'synthetic-signup-token',user:{id:'synthetic-member',email}};
function verifier(getSession,getUser=async()=>({data:{user:{...signup.user,email_confirmed_at:'2026-10-30T18:00:00.000Z'}},error:null})){
  const sb={auth:{getSession,getUser}};
  return vm.runInNewContext('(()=>{'+production+';return signupSessionIsCurrent})()',{sb});
}
const current=()=>({data:{session:signup},error:null});

test('exact signup token, account ID and email permit preference persistence',async()=>{
  assert.equal(await verifier(async()=>current())(signup,email),true);
});
test('same account and email with a newer login token must not inherit signup persistence',async()=>{
  const later={...signup,access_token:'synthetic-later-login'};
  assert.equal(await verifier(async()=>({data:{session:later},error:null}))(signup,email),false);
});
test('same-account token rotation during asynchronous verification fails closed',async()=>{
  let release;
  const pending=new Promise(resolve=>{release=resolve});
  const check=verifier(()=>pending)(signup,email);
  release({data:{session:{...signup,access_token:'synthetic-rotated'}},error:null});
  assert.equal(await check,false);
});
test('missing signup token or active token never authorizes persistence or local sign-out',async()=>{
  const withoutSignupToken={user:signup.user};
  const withoutActiveToken={user:signup.user};
  assert.equal(await verifier(async()=>current())(withoutSignupToken,email),false);
  assert.equal(await verifier(async()=>({data:{session:withoutActiveToken},error:null}))(signup,email),false);
  assert.equal(await verifier(async()=>({data:{session:{...signup,access_token:'  '}},error:null}))(signup,email),false);
});
test('matching token does not override account or email mismatch',async()=>{
  const wrongUser={...signup,user:{id:'another-synthetic-member',email}};
  const wrongEmail={...signup,user:{id:signup.user.id,email:'different@example.invalid'}};
  assert.equal(await verifier(async()=>({data:{session:wrongUser},error:null}))(signup,email),false);
  assert.equal(await verifier(async()=>({data:{session:wrongEmail},error:null}))(signup,email),false);
});
test('case-insensitive email comparison still accepts the exact signup token',async()=>{
  const upper={...signup,user:{...signup.user,email:'MEMBER@EXAMPLE.INVALID'}};
  assert.equal(await verifier(async()=>({data:{session:upper},error:null}))(signup,email),true);
});
test('backend session retrieval errors never authorize preference persistence',async()=>{
  await assert.rejects(verifier(async()=>({data:null,error:new Error('synthetic auth failure')}))(signup,email),/synthetic auth failure/);
});
test('signup runtime verifies before saving preference and before cleanup sign-out',()=>{
  const handler=source.slice(source.indexOf('async function handleSignup('));
  const first=handler.indexOf('const verifiedSignupSession=await signupSessionIsCurrent(data.session,email);');
  const save=handler.indexOf('try{saveStay(stay)}',first);
  const recheck=handler.indexOf('sameAccount=await signupSessionIsCurrent(data.session,email)',save);
  const signout=handler.indexOf("sb.auth.signOut({scope:'local'})",recheck);
  assert.ok(first>=0&&save>first&&recheck>save&&signout>recheck,'token-bound helper gates both save and local cleanup');
});
