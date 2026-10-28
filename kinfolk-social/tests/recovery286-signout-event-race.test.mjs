import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(path.join(root,'index.html'),'utf8');
const start=source.indexOf('async function kf286HandleSignedOutEvent(){');
const end=source.indexOf('async function boot(){',start);
assert.ok(start>=0&&end>start,'signed-out event helper found in real application HTML');
const helperSource=source.slice(start,end);
const createHarness=(getSession,timeout=async task=>task)=>{
  const activations=[];
  const warnings=[];
  const context={
    sb:{auth:{getSession}},
    kf129Timeout:timeout,
    kf129ActivateSession:async session=>{activations.push(session);return true},
    console:{warn:(...args)=>warnings.push(args)}
  };
  const handle=vm.runInNewContext(helperSource+';kf286HandleSignedOutEvent',context);
  return {handle,activations,warnings};
};

test('SIGNED_OUT with no active session clears private UI',async()=>{
  const h=createHarness(async()=>({data:{session:null},error:null}));
  assert.equal(await h.handle(),true);
  assert.deepEqual(h.activations,[null]);
});
test('late SIGNED_OUT event does not clear a newly authenticated account',async()=>{
  const h=createHarness(async()=>({data:{session:{user:{id:'synthetic-new-user'}}},error:null}));
  assert.equal(await h.handle(),false);
  assert.deepEqual(h.activations,[]);
});
test('session read error fails closed and clears private UI',async()=>{
  const h=createHarness(async()=>({data:null,error:new Error('synthetic auth read error')}));
  assert.equal(await h.handle(),true);
  assert.deepEqual(h.activations,[null]);
  assert.equal(h.warnings.length,1);
});
test('session read rejection fails closed',async()=>{
  const h=createHarness(async()=>{throw new Error('synthetic auth rejection')});
  assert.equal(await h.handle(),true);
  assert.deepEqual(h.activations,[null]);
});
test('stalled session check fails closed after timeout',async()=>{
  const h=createHarness(()=>new Promise(()=>{}),async()=>{throw new Error('synthetic timeout')});
  assert.equal(await h.handle(),true);
  assert.deepEqual(h.activations,[null]);
});
test('auth event defers session read outside callback lock',()=>{
  assert.match(source,/if\(event==='SIGNED_OUT'\)\{setTimeout\(\(\)=>\{void kf286HandleSignedOutEvent\(\)/);
  assert.ok(source.indexOf('async function kf286HandleSignedOutEvent()')<source.indexOf('async function boot()'));
});
