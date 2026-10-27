'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const modulePromise=import(pathToFileURL(path.resolve(__dirname,'../native/scripts/alpha-backend-config.mjs')).href);
// The security gate now permits only the designated owner-isolated test project.
const REF='viantpfagtbgyyzavmtv',KEY='sb_publishable_synthetic_alpha_testing_key';
const env=(overrides={})=>({KINFOLK_ALPHA_SUPABASE_URL:'https://'+REF+'.supabase.co',KINFOLK_ALPHA_SUPABASE_PUBLISHABLE_KEY:KEY,...overrides});
test('native backend config requires explicit isolated project and publishable key',async()=>{
 const {alphaBackendConfig,ALPHA_REF}=await modulePromise;
 assert.equal(REF,ALPHA_REF,'test fixture must track the designated isolated project');
 assert.throws(()=>alphaBackendConfig({}),/requires KINFOLK_ALPHA_SUPABASE_URL/);
 assert.throws(()=>alphaBackendConfig(env({KINFOLK_ALPHA_SUPABASE_URL:'http://'+REF+'.supabase.co'})),/canonical HTTPS/);
 assert.throws(()=>alphaBackendConfig(env({KINFOLK_ALPHA_SUPABASE_URL:'https://'+REF+'.supabase.co/path'})),/canonical HTTPS/);
 assert.throws(()=>alphaBackendConfig(env({KINFOLK_ALPHA_SUPABASE_PUBLISHABLE_KEY:'service_role_not_allowed'})),/separate Supabase publishable key/);
 assert.equal(alphaBackendConfig(env()).projectRef,REF);
});
test('native build rejects the existing shared live project and key',async()=>{
 const {alphaBackendConfig,LIVE_REF,LIVE_KEY}=await modulePromise;
 assert.throws(()=>alphaBackendConfig(env({KINFOLK_ALPHA_SUPABASE_URL:'https://'+LIVE_REF+'.supabase.co'})),/refuses the shared live/);
 assert.throws(()=>alphaBackendConfig(env({KINFOLK_ALPHA_SUPABASE_PUBLISHABLE_KEY:LIVE_KEY})),/separate Supabase publishable key/);
});
test('offline CI placeholder cannot be packaged as a functional alpha',async()=>{
 const {alphaBackendConfig,CI_REF,CI_KEY}=await modulePromise;
 const config=env({KINFOLK_ALPHA_SUPABASE_URL:'https://'+CI_REF+'.supabase.co',KINFOLK_ALPHA_SUPABASE_PUBLISHABLE_KEY:CI_KEY});
 assert.throws(()=>alphaBackendConfig(config),/packaging checks/);
 assert.equal(alphaBackendConfig({...config,KINFOLK_ALPHA_PACKAGING_ONLY:'1'}).offlineStub,true);
 assert.throws(()=>alphaBackendConfig(env({KINFOLK_ALPHA_SUPABASE_URL:'https://'+CI_REF+'.supabase.co'})),/used together/);
});
test('native asset isolation changes project ref, storage key and publishable key without changing UI',async()=>{
 const {alphaBackendConfig,isolateNativeAsset,LIVE_REF,LIVE_KEY}=await modulePromise;
 const config=alphaBackendConfig(env());
 const source='const url="https://'+LIVE_REF+'.supabase.co";const storage="sb-'+LIVE_REF+'-auth-token";const key="'+LIVE_KEY+'";const brand="Kinfolk Social"';
 const result=isolateNativeAsset(source,config);
 assert.ok(result.includes(config.url));
 assert.ok(result.includes('sb-'+REF+'-auth-token'));
 assert.ok(result.includes(KEY));
 assert.ok(result.includes('Kinfolk Social'));
 assert.ok(!result.includes(LIVE_REF)&&!result.includes(LIVE_KEY));
});

test('native alpha rejects other valid-looking nonproduction projects',async()=>{
 const {alphaBackendConfig}=await modulePromise;
 assert.throws(()=>alphaBackendConfig(env({KINFOLK_ALPHA_SUPABASE_URL:'https://bbbbbbbbbbbbbbbbbbbb.supabase.co'})),/unapproved Supabase project/);
});
