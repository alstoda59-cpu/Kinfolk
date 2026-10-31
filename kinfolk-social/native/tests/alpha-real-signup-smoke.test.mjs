import test from 'node:test';
import assert from 'node:assert/strict';
import {ALPHA_REF} from '../scripts/alpha-backend-config.mjs';
import {verifyIsolatedRealSignup} from '../scripts/verify-real-signup-smoke.mjs';

const config={projectRef:ALPHA_REF,url:'https://'+ALPHA_REF+'.supabase.co',key:'sb_publishable_synthetic_only_test_key',offlineStub:false};
const email='synthetic@kinfolk-alpha-fixture.dev';
const password='synthetic-only-password-for-offline-test';
const userId='11111111-1111-4111-8111-111111111111';
const settings={disable_signup:false,external:{email:true},mailer_autoconfirm:false};
const response=(status,data)=>({status,headers:{get:()=> 'application/json'},json:async()=>data});
function mockFetch({settingsData=settings,signupData={user:{id:userId,email,email_confirmed_at:null,identities:[{provider:'email',user_id:userId,identity_data:{email}}]},session:null},loginStatus=400,loginData={error_code:'email_not_confirmed'}}={}){
  const calls=[];
  const fetchImpl=async(url,options)=>{
    calls.push({url,method:options.method,body:options.body&&JSON.parse(options.body)});
    if(url.endsWith('/settings'))return response(200,settingsData);
    if(url.endsWith('/signup'))return response(200,signupData);
    if(url.includes('/token?'))return response(loginStatus,loginData);
    throw Error('Unexpected request');
  };
  return {fetchImpl,calls};
}
test('synthetic isolated signup verifies confirmation gate without leaking credentials',async()=>{
  const m=mockFetch();
  const result=await verifyIsolatedRealSignup(config,{fetchImpl:m.fetchImpl,email,password});
  assert.deepEqual([result.signupAccepted,result.confirmationRequired,result.unconfirmedLoginBlocked,result.emailDelivered],[true,true,true,false]);
  assert.deepEqual(m.calls.map(x=>x.method),['GET','POST','POST']);
  assert.ok(m.calls.every(x=>x.url.startsWith(config.url+'/auth/v1/')));
  assert.equal(m.calls[1].body.email,email);
  assert.equal(m.calls[1].body.data.signup_birthdate,'2000-01-01');
  assert.match(m.calls[1].body.data.username,/^[a-zA-Z0-9_]{3,24}$/);
  assert.equal(m.calls[1].body.data.profile_private,'true');
});
test('shared live project and reserved email domains are refused before network',async()=>{
  const m=mockFetch();
  await assert.rejects(verifyIsolatedRealSignup({...config,projectRef:'zojajuzmfjpvubzibzgg'},{fetchImpl:m.fetchImpl,email,password}),/isolated/);
  await assert.rejects(verifyIsolatedRealSignup(config,{fetchImpl:m.fetchImpl,email:'kinfolkalpha@sample.invalid',password}),/approved test inbox/);
  await assert.rejects(verifyIsolatedRealSignup(config,{fetchImpl:m.fetchImpl,email:'alpha@example.com',password}),/approved test inbox/);
  await assert.rejects(verifyIsolatedRealSignup(config,{fetchImpl:m.fetchImpl,email,password:'short'}),/password/);
  assert.equal(m.calls.length,0);
});
test('missing email confirmation settings prevent account creation',async()=>{
  const m=mockFetch({settingsData:{...settings,mailer_autoconfirm:true}});
  await assert.rejects(verifyIsolatedRealSignup(config,{fetchImpl:m.fetchImpl,email,password}),/email confirmation/);
  assert.deepEqual(m.calls.map(c=>c.method),['GET']);
});
test('unconfirmed signup may not return a session or confirmed identity',async()=>{
  const m=mockFetch({signupData:{user:{id:userId,email,email_confirmed_at:'2026-10-31T00:00:00Z',identities:[{provider:'email',user_id:userId,identity_data:{email}}]},session:{access_token:'no'}}});
  await assert.rejects(verifyIsolatedRealSignup(config,{fetchImpl:m.fetchImpl,email,password}),/confirmed user or session/);
  assert.equal(m.calls.length,2);
});
test('unconfirmed user receiving password session is a hard failure',async()=>{
  const m=mockFetch({loginStatus:200,loginData:{access_token:'should-not-exist'}});
  await assert.rejects(verifyIsolatedRealSignup(config,{fetchImpl:m.fetchImpl,email,password}),/allowed to sign in/);
});
test('other denied login errors cannot be misreported as email confirmation',async()=>{
  const m=mockFetch({loginStatus:429,loginData:{error_code:'over_email_send_rate_limit'}});
  await assert.rejects(verifyIsolatedRealSignup(config,{fetchImpl:m.fetchImpl,email,password}),/did not prove/);
});

test('signup proof refuses missing or mismatched returned email before password login',async()=>{
  for(const returnedEmail of [undefined,null,'','other@kinfolk-alpha-fixture.dev',42]){
    const m=mockFetch({signupData:{user:{id:userId,email:returnedEmail,identities:[{provider:'email',user_id:userId,identity_data:{email}}]},session:null}});
    await assert.rejects(verifyIsolatedRealSignup(config,{fetchImpl:m.fetchImpl,email,password}),/requested email identity/);
    assert.deepEqual(m.calls.map(c=>c.method),['GET','POST']);
  }
});
test('obfuscated existing-user and malformed email identities never prove fresh signup',async()=>{
  const valid={provider:'email',user_id:userId,identity_data:{email}};
  for(const identities of [
    undefined,null,[],{},
    [{...valid,provider:'google'}],
    [{...valid,user_id:'22222222-2222-4222-8222-222222222222'}],
    [{...valid,identity_data:{email:'other@kinfolk-alpha-fixture.dev'}}],
    [{...valid,identity_data:null}]
  ]){
    const m=mockFetch({signupData:{user:{id:userId,email,identities},session:null}});
    await assert.rejects(verifyIsolatedRealSignup(config,{fetchImpl:m.fetchImpl,email,password}),/new email identity/);
    assert.deepEqual(m.calls.map(c=>c.method),['GET','POST']);
  }
});
test('matching email identities tolerate harmless case and whitespace',async()=>{
  const upper=email.toUpperCase();
  const m=mockFetch({signupData:{user:{id:userId,email:' '+upper+' ',identities:[{provider:'email',user_id:userId,identity_data:{email:upper}}]},session:null}});
  const result=await verifyIsolatedRealSignup(config,{fetchImpl:m.fetchImpl,email,password});
  assert.equal(result.signupAccepted,true);
  assert.equal(m.calls.length,3);
});
