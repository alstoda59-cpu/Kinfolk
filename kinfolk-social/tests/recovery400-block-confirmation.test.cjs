'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../kinfolk-phase107.js'),'utf8');
const start=source.indexOf('const pendingBlocks=');
const end=source.indexOf('window.blockKinfolk=blockPeer;',start);
assert.ok(start>=0&&end>start,'effective DM block handler is present');
const blockCode=source.slice(start,end);

function harness(lookup={data:[{blocker_id:'synthetic-adult-A',blocked_id:'synthetic-peer-B'}],error:null}){
  const events=[],writes=[],reads=[];
  const ctx={
    window:{state:{user:{id:'synthetic-adult-A'}}},
    kf129Epoch:1,
    console:{warn(){}},
    toast:(...args)=>events.push(['toast',...args]),
    closeModal:()=>events.push(['close']),
    sb:{from(table){
      assert.equal(table,'blocks');
      return {insert(row,options){
        assert.equal(options.count,'exact');
        let resolve;
        const promise=new Promise(r=>{resolve=r});
        writes.push({row,options,resolve});
        return promise;
      },select(columns){
        assert.equal(columns,'blocker_id,blocked_id');
        const filters=[];
        return {eq(key,value){filters.push([key,value]);return this},
          limit(n){assert.equal(n,1);reads.push(filters);return Promise.resolve(lookup)}};
      }};
    }}
  };
  const blockPeer=vm.runInNewContext(blockCode+'\nblockPeer',ctx,{timeout:1000});
  return {ctx,events,writes,reads,blockPeer,resolve(result){writes.at(-1).resolve(result)}};
}
function successes(h){return h.events.filter(e=>e[0]==='close'||(e[0]==='toast'&&e[2]==='good'))}

test('one confirmed blocked row closes the original DM and acknowledges privacy action',async()=>{
  const h=harness(),p=h.blockPeer('synthetic-peer-B');
  assert.equal(h.writes.length,1);
  assert.equal(h.writes[0].row.blocker_id,'synthetic-adult-A');
  assert.equal(h.writes[0].row.blocked_id,'synthetic-peer-B');
  h.resolve({error:null,count:1});await p;
  assert.equal(successes(h).length,2);
});
test('zero, missing and multiple affected rows never claim a block',async()=>{
  for(const count of [0,null,undefined,2]){
    const h=harness(),p=h.blockPeer('synthetic-peer-B');
    h.resolve({error:null,count});await p;
    assert.equal(successes(h).length,0);
    assert.match(h.events.at(-1)[1],/could not be confirmed/);
    assert.equal(h.events.at(-1)[2],'danger');
  }
});
test('RLS denial does not close DM or claim blocked status',async()=>{
  const h=harness(),p=h.blockPeer('synthetic-peer-B');
  h.resolve({error:{message:'RLS denied',code:'42501'},count:null});await p;
  assert.equal(successes(h).length,0);
  assert.equal(h.events.at(-1)[1],'RLS denied');
});
test('unique duplicate response retains existing-block behavior without a second insert',async()=>{
  const h=harness(),p=h.blockPeer('synthetic-peer-B');
  h.resolve({error:{message:'duplicate key value violates unique constraint',code:'23505'},count:null});
  await p;
  assert.equal(h.writes.length,1);
  assert.equal(h.reads.length,1);
  assert.deepEqual(Array.from(h.reads[0],pair=>Array.from(pair)),[
    ['blocker_id','synthetic-adult-A'],['blocked_id','synthetic-peer-B']
  ]);
  assert.equal(successes(h).length,2);
});
test('duplicate error without a visible exact owner-peer row never claims privacy success',async()=>{
  const lookups=[
    {data:[],error:null},
    {data:null,error:null},
    {data:[{blocker_id:'synthetic-adult-A',blocked_id:'other-peer'}],error:null},
    {data:[{blocker_id:'other-account',blocked_id:'synthetic-peer-B'}],error:null},
    {data:null,error:{message:'RLS denied'}}
  ];
  for(const lookup of lookups){
    const h=harness(lookup),p=h.blockPeer('synthetic-peer-B');
    h.resolve({error:{code:'23505',message:'duplicate key'},count:null});
    await p;
    assert.equal(h.reads.length,1);
    assert.equal(successes(h).length,0);
    assert.match(h.events.at(-1)[1],/could not be verified/);
  }
});
test('duplicate insert from an old activation never reads or toasts in the new session',async()=>{
  const h=harness(),p=h.blockPeer('synthetic-peer-B');
  h.ctx.kf129Epoch=2;
  h.resolve({error:{code:'23505',message:'duplicate key'},count:null});
  await p;
  assert.equal(h.reads.length,0);
  assert.equal(h.events.length,0);
});
test('same-account reauthentication suppresses stale block success UI',async()=>{
  const h=harness(),p=h.blockPeer('synthetic-peer-B');
  h.ctx.kf129Epoch=2;
  h.resolve({error:null,count:1});await p;
  assert.equal(successes(h).length,0);
  assert.equal(h.events.length,0);
});
test('same-account reauthentication suppresses stale RLS failure UI',async()=>{
  const h=harness(),p=h.blockPeer('synthetic-peer-B');
  h.ctx.kf129Epoch=2;
  h.resolve({error:{message:'RLS denied'},count:null});await p;
  assert.equal(h.events.length,0);
});
test('pending block cannot close a DM reused for a different peer',async()=>{
  const h=harness(),form={isConnected:true,dataset:{peer:'synthetic-peer-B'}};
  const p=h.blockPeer('synthetic-peer-B',form);
  form.dataset.peer='synthetic-peer-C';
  h.resolve({error:null,count:1});await p;
  assert.equal(h.events.length,0);
});
