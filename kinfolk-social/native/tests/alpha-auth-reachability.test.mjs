import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { verifyIsolatedAuthReachability } from '../scripts/verify-isolated-auth.mjs';
import { ALPHA_REF } from '../scripts/alpha-backend-config.mjs';

const config={projectRef:ALPHA_REF,url:'https://'+ALPHA_REF+'.supabase.co',key:'sb_publishable_synthetic_alpha_test',offlineStub:false};
const json=(status=200,data={external:{email:true}},type='application/json')=>({status,headers:{get:()=>type},json:async()=>data});

test('read-only GET uses pinned isolated Auth settings endpoint',async()=>{
  let seen;
  const result=await verifyIsolatedAuthReachability(config,{fetchImpl:async(url,opts)=>{seen={url,opts};return json();}});
  assert.deepEqual(result,{projectRef:ALPHA_REF,reachable:true});
  assert.equal(seen.url,config.url+'/auth/v1/settings');
  assert.equal(seen.opts.method,'GET');
  assert.equal(seen.opts.redirect,'manual');
  assert.equal(seen.opts.headers.apikey,config.key);
  assert.equal(seen.opts.headers.accept,'application/json');
  assert.equal(seen.opts.body,undefined);
});
test('rejects live, foreign, and offline backend before any network request',async()=>{
  let calls=0;const fetchImpl=async()=>{calls++;return json();};
  for(const bad of [{...config,projectRef:'zojajuzmfjpvubzibzgg'}, {...config,url:'https://example.com'}, {...config,offlineStub:true}]){
    await assert.rejects(verifyIsolatedAuthReachability(bad,{fetchImpl}),/designated isolated/);
  }
  assert.equal(calls,0);
});
test('rejects unauthorized, missing, and redirected settings responses',async()=>{
  for(const status of [301,302,401,403,404,500]){
    await assert.rejects(verifyIsolatedAuthReachability(config,{fetchImpl:async()=>json(status)}),/HTTP 200/);
  }
});
test('rejects HTML and malformed Auth settings responses',async()=>{
  await assert.rejects(verifyIsolatedAuthReachability(config,{fetchImpl:async()=>json(200,{},'text/html')}),/return JSON/);
  for(const payload of [{},[],null,{external:[]},'ok']){
    await assert.rejects(verifyIsolatedAuthReachability(config,{fetchImpl:async()=>json(200,payload)}),/not recognized/);
  }
});
test('propagates aborted network failures without logging credentials',async()=>{
  await assert.rejects(verifyIsolatedAuthReachability(config,{fetchImpl:async(_url,opts)=>{
    return new Promise((_resolve,reject)=>opts.signal.addEventListener('abort',()=>reject(new Error('aborted'))));
  },timeoutMs:10}),/aborted/);
});
test('functional package verifier requires reachability after static checks',async()=>{
  const script=await readFile(new URL('../scripts/verify-functional-alpha.mjs',import.meta.url),'utf8');
  assert.match(script,/await import\('\.\/verify-alpha-package\.mjs'\)/);
  assert.match(script,/await verifyIsolatedAuthReachability\(config,\s*\{\s*requireEmailSignupReady:true\s*\}\)/);
  assert.ok(script.indexOf('await verifyIsolatedAuthReachability(config,')>script.indexOf("await import('./verify-alpha-package.mjs')"));
});
