import test from 'node:test';
import assert from 'node:assert/strict';
import { ALPHA_REF, CI_REF, CI_KEY, LIVE_REF, LIVE_KEY, alphaBackendConfig, isolateNativeAsset } from '../scripts/alpha-backend-config.mjs';

const url = ref => `https://${ref}.supabase.co`;
const syntheticKey = 'sb_publishable_synthetic_test_key_only';
const env = (ref=ALPHA_REF,key=syntheticKey,more={}) => ({
  KINFOLK_ALPHA_SUPABASE_URL:url(ref),
  KINFOLK_ALPHA_SUPABASE_PUBLISHABLE_KEY:key,
  ...more
});

test('functional native alpha accepts only the designated isolated project',()=>{
  const config=alphaBackendConfig(env());
  assert.equal(config.projectRef,ALPHA_REF);
  assert.equal(config.offlineStub,false);
});
test('rejects a different otherwise-valid Supabase project',()=>{
  assert.throws(()=>alphaBackendConfig(env('bbbbbbbbbbbbbbbbbbbb')),/unapproved Supabase project/);
});
test('rejects the shared live project and key',()=>{
  assert.throws(()=>alphaBackendConfig(env(LIVE_REF)),/shared live/);
  assert.throws(()=>alphaBackendConfig(env(ALPHA_REF,LIVE_KEY)),/separate Supabase publishable key/);
});
test('rejects invalid URL and secret/service-role credentials',()=>{
  assert.throws(()=>alphaBackendConfig({...env(),KINFOLK_ALPHA_SUPABASE_URL:'http://'+ALPHA_REF+'.supabase.co'}),/canonical HTTPS/);
  assert.throws(()=>alphaBackendConfig(env(ALPHA_REF,'sb_secret_not_for_client')),/publishable key/);
});
test('offline CI stub is allowed only for explicit packaging checks',()=>{
  assert.throws(()=>alphaBackendConfig(env(CI_REF,CI_KEY)),/packaging checks/);
  const config=alphaBackendConfig(env(CI_REF,CI_KEY,{KINFOLK_ALPHA_PACKAGING_ONLY:'1'}));
  assert.equal(config.offlineStub,true);
});
test('mixed CI markers cannot be used for a functional build',()=>{
  assert.throws(()=>alphaBackendConfig(env(CI_REF,syntheticKey)),/Offline CI backend markers/);
  assert.throws(()=>alphaBackendConfig(env(ALPHA_REF,CI_KEY)),/Offline CI backend markers/);
});
test('native asset replacement preserves non-backend application code',()=>{
  const config=alphaBackendConfig(env());
  const source=`const endpoint="https://${LIVE_REF}.supabase.co";const key="${LIVE_KEY}";const title="Kinfolk";`;
  const result=isolateNativeAsset(source,config);
  assert.ok(result.includes(url(ALPHA_REF)));
  assert.ok(result.includes(syntheticKey));
  assert.ok(result.includes('const title="Kinfolk"'));
  assert.ok(!result.includes(LIVE_REF));
  assert.ok(!result.includes(LIVE_KEY));
});
