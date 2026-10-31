import test from 'node:test';
import assert from 'node:assert/strict';
import {ALPHA_REF} from '../scripts/alpha-backend-config.mjs';
import {verifyIsolatedRealSignup} from '../scripts/verify-real-signup-smoke.mjs';

const config={projectRef:ALPHA_REF,url:'https://'+ALPHA_REF+'.supabase.co',key:'sb_publishable_synthetic_only_test_key',offlineStub:false};
const email='kinfolkalpha+0123456789abcdef01234567@example.com';
const password='wRfXpt7Z0H!2';
const userId='11111111-1111-4111-8111-111111111111';
const settings={disable_signup:false,external:{email:true},mailer_autoconfirm:false};
const response=(status,data)=>({status,headers:{get:()=> 'application/json'},json:async()=>data});
function mockFetch({settingsData=settings,signupData={user:{id:userId,email_confirmed_at:null},session:null},loginStatus=400,loginData={error_code:'email_not_confirmed'}}={}){
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
test('shared live project and non-synthetic emails are refused before network',async()=>{
  const m=mockFetch();
  await assert.rejects(verifyIsolatedRealSignup({...config,projectRef:'zojajuzmfjpvubzibzgg'},{fetchImpl:m.fetchImpl,email,password}),/isolated/);
  await assert.rejects(verifyIsolatedRealSignup(config,{fetchImpl:m.fetchImpl,email:'someone@gmail.com',password}),/synthetic/);
  await assert.rejects(verifyIsolatedRealSignup(config,{fetchImpl:m.fetchImpl,email,password:'short'}),/password/);
  assert.equal(m.calls.length,0);
});
test('missing email confirmation settings prevent account creation',async()=>{
  const m=mockFetch({settingsData:{...settings,mailer_autoconfirm:true}});
  await assert.rejects(verifyIsolatedRealSignup(config,{fetchImpl:m.fetchImpl,email,password}),/email confirmation/);
  assert.deepEqual(m.calls.map(c=>c.method),['GET']);
});
test('unconfirmed signup may not return a session or confirmed identity',async()=>{
  const m=mockFetch({signupData:{user:{id:userId,email_confirmed_at:'2026-10-31T00:00:00Z'},session:{access_token:'no'}}});
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
