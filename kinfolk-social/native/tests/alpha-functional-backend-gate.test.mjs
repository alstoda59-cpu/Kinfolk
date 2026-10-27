import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ALPHA_REF, CI_REF, CI_KEY, LIVE_REF, LIVE_KEY, requireFunctionalAlphaBackend } from '../scripts/alpha-backend-config.mjs';

const key='sb_publishable_synthetic_functional_gate';
const env=(ref=ALPHA_REF,publishableKey=key,extra={})=>({
  KINFOLK_ALPHA_SUPABASE_URL:`https://${ref}.supabase.co`,
  KINFOLK_ALPHA_SUPABASE_PUBLISHABLE_KEY:publishableKey,
  ...extra
});

test('accepts designated isolated backend for functional packaging configuration',()=>{
  const config=requireFunctionalAlphaBackend(env());
  assert.equal(config.projectRef,ALPHA_REF);
  assert.equal(config.offlineStub,false);
});
test('rejects offline CI stub even with explicit packaging-only permission',()=>{
  assert.throws(()=>requireFunctionalAlphaBackend(env(CI_REF,CI_KEY,{KINFOLK_ALPHA_PACKAGING_ONLY:'1'})),/offline CI packaging is not a functional build/);
});
test('rejects shared live project or live publishable key',()=>{
  assert.throws(()=>requireFunctionalAlphaBackend(env(LIVE_REF)),/shared live/);
  assert.throws(()=>requireFunctionalAlphaBackend(env(ALPHA_REF,LIVE_KEY)),/separate Supabase publishable key/);
});
test('rejects arbitrary project and service-role key',()=>{
  assert.throws(()=>requireFunctionalAlphaBackend(env('bbbbbbbbbbbbbbbbbbbb')),/unapproved Supabase project/);
  assert.throws(()=>requireFunctionalAlphaBackend(env(ALPHA_REF,'sb_secret_not_a_client_key')),/publishable key/);
});
test('functional verifier checks generated package after backend gate',async()=>{
  const script=await readFile(new URL('../scripts/verify-functional-alpha.mjs',import.meta.url),'utf8');
  const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
  assert.match(script,/requireFunctionalAlphaBackend\(\)/);
  assert.match(script,/import\('\.\/verify-alpha-package\.mjs'\)/);
  assert.equal(pkg.scripts['alpha:verify:functional'],'node scripts/verify-functional-alpha.mjs');
  assert.match(pkg.scripts['alpha:verify'],/alpha-functional-backend-gate\.test\.mjs/);
});
