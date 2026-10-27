import test from 'node:test';
import assert from 'node:assert/strict';
import { nativeStartupScripts, verifyNativeStartupScripts } from '../scripts/native-startup-scripts.mjs';

const html='<script>const inline=true</script><script defer src="/kinfolk-phase79.js"></script><script src=\'/kinfolk-reels159.js\'></script>';

test('discovers every quoted local startup script and ignores inline code',async()=>{
  assert.deepEqual(nativeStartupScripts(html),['/kinfolk-phase79.js','/kinfolk-reels159.js']);
  const seen=[];
  const scripts=await verifyNativeStartupScripts(html,async path=>{seen.push(path);return true});
  assert.equal(scripts.length,2);
  assert.deepEqual(seen,['kinfolk-phase79.js','kinfolk-reels159.js']);
});

test('rejects remote and protocol-relative JavaScript dependencies',async()=>{
  for(const src of ['https://cdn.example.invalid/sdk.js','//cdn.example.invalid/sdk.js','http://cdn.example.invalid/sdk.js']){
    await assert.rejects(verifyNativeStartupScripts('<script src="'+src+'"></script>',async()=>true),/plain bundled JavaScript path/);
  }
});

test('rejects missing assets, traversal, query, fragment and encoded paths',async()=>{
  await assert.rejects(verifyNativeStartupScripts('<script src="/missing.js"></script>',async()=>false),/asset missing/);
  for(const src of ['/../secret.js','/kinfolk-phase79.js?v=1','/kinfolk-phase79.js#x','/%2e%2e/secret.js']){
    await assert.rejects(verifyNativeStartupScripts('<script src="'+src+'"></script>',async()=>true),/plain bundled JavaScript path/);
  }
});

test('fails closed on unquoted script src',async()=>{
  await assert.rejects(verifyNativeStartupScripts('<script src=/kinfolk-phase79.js></script>',async()=>true),/must be quoted/);
});

test('supports a future local nested JavaScript module',async()=>{
  assert.deepEqual(await verifyNativeStartupScripts('<script src="/modules/kinfolk-chat.js"></script>',async()=>true),['/modules/kinfolk-chat.js']);
});
