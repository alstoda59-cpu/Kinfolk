import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ALPHA_REF } from '../scripts/alpha-backend-config.mjs';
import { assertEmailSignupReady, verifyIsolatedAuthReachability } from '../scripts/verify-isolated-auth.mjs';

const settings={disable_signup:false,external:{email:true},mailer_autoconfirm:false};
const config={projectRef:ALPHA_REF,url:`https://${ALPHA_REF}.supabase.co`,key:'sb_publishable_synthetic_alpha_test',offlineStub:false};
const fetchFor=data=>async()=>({status:200,headers:{get:()=> 'application/json'},json:async()=>data});

test('functional gate accepts explicit email signup and confirmation settings',async()=>{
  assert.doesNotThrow(()=>assertEmailSignupReady(settings));
  assert.deepEqual(await verifyIsolatedAuthReachability(config,{fetchImpl:fetchFor(settings),requireEmailSignupReady:true}),{projectRef:ALPHA_REF,reachable:true});
});
test('functional gate refuses globally disabled signup',async()=>{
  await assert.rejects(verifyIsolatedAuthReachability(config,{fetchImpl:fetchFor({...settings,disable_signup:true}),requireEmailSignupReady:true}),/signup is disabled/);
});
test('functional gate refuses disabled email/password provider',async()=>{
  await assert.rejects(verifyIsolatedAuthReachability(config,{fetchImpl:fetchFor({...settings,external:{email:false}}),requireEmailSignupReady:true}),/email\/password provider/);
});
test('functional gate refuses email autoconfirm that bypasses verification',async()=>{
  await assert.rejects(verifyIsolatedAuthReachability(config,{fetchImpl:fetchFor({...settings,mailer_autoconfirm:true}),requireEmailSignupReady:true}),/email confirmation/);
});
test('functional gate fails closed when any required setting is missing or malformed',async()=>{
  for(const data of [{...settings,disable_signup:undefined},{...settings,external:{}},{...settings,mailer_autoconfirm:undefined},{...settings,external:{email:'true'}},{...settings,mailer_autoconfirm:0}]){
    await assert.rejects(verifyIsolatedAuthReachability(config,{fetchImpl:fetchFor(data),requireEmailSignupReady:true}));
  }
});
test('nonfunctional reachability probe remains backward compatible',async()=>{
  assert.deepEqual(await verifyIsolatedAuthReachability(config,{fetchImpl:fetchFor({external:{email:true}})}),{projectRef:ALPHA_REF,reachable:true});
});
test('functional native entrypoint explicitly opts into strict signup readiness',async()=>{
  const source=await readFile(new URL('../scripts/verify-functional-alpha.mjs',import.meta.url),'utf8');
  assert.match(source,/verifyIsolatedAuthReachability\(config,\s*\{\s*requireEmailSignupReady:true\s*\}\)/);
});
