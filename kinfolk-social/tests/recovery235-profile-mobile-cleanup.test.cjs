'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

// Exercise the real Phase100 helper, not a reimplementation. No backend calls.
const source=fs.readFileSync('kinfolk-social/kinfolk-phase100.js','utf8');
const start=source.indexOf('async function removeUploaded(');
const end=source.indexOf('function sameEditor(',start);
assert.ok(start>=0&&end>start,'profile media cleanup helper must exist');
const cleanupSource=source.slice(start,end);
function cleanupHarness(behavior){
  const calls=[],warnings=[];
  const sb={storage:{from:bucket=>{
    assert.equal(bucket,'kinfolk-media');
    return {remove:async paths=>{
      calls.push([...paths]);
      return behavior(paths);
    }};
  }}};
  const cleanup=vm.runInNewContext(cleanupSource+'\nremoveUploaded',{
    sb,BUCKET:'kinfolk-media',console:{warn:(...args)=>warnings.push(args)}
  });
  return {cleanup,calls,warnings};
}
test('successful profile-media cleanup remains quiet',async()=>{
  const h=cleanupHarness(()=>({error:null}));
  await h.cleanup(['account-A/avatars/image.jpg']);
  assert.equal(h.calls.length,1);
  assert.equal(h.warnings.length,0);
});
test('Supabase returned storage removal error is logged, not silently ignored',async()=>{
  const h=cleanupHarness(()=>({error:new Error('synthetic storage RLS denial')}));
  await h.cleanup(['account-A/avatars/image.jpg']);
  assert.equal(h.calls.length,1);
  assert.equal(h.warnings.length,1);
  assert.match(h.warnings[0][0],/could not clean up/);
  assert.match(h.warnings[0][1].message,/synthetic storage RLS denial/);
});
test('thrown storage removal failure is logged without replacing the original save error',async()=>{
  const h=cleanupHarness(()=>{throw new Error('synthetic network outage')});
  await h.cleanup(['account-A/avatars/image.jpg']);
  assert.equal(h.warnings.length,1);
  assert.match(h.warnings[0][1].message,/synthetic network outage/);
});
test('no uploaded paths means no storage call',async()=>{
  const h=cleanupHarness(()=>({error:null}));
  await h.cleanup([]);
  assert.equal(h.calls.length,0);
});
test('profile editor fallback polling is infrequent and pauses in hidden mobile WebViews',()=>{
  const match=source.match(/setInterval\((\(\)=>\{if\(document\.visibilityState!=='hidden'\)patch\(\)\}),2000\)/);
  assert.ok(match,'two-second visible-only editor fallback must be present');
  let visibilityState='hidden',patches=0;
  const document={get visibilityState(){return visibilityState}};
  const callback=vm.runInNewContext(match[1],{document,patch:()=>{patches++}});
  callback();
  assert.equal(patches,0,'background app should not poll profile editor');
  visibilityState='visible';
  callback();
  assert.equal(patches,1,'foreground app still repairs replaced profile forms');
});
