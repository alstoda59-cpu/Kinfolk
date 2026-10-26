'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('kinfolk-social/kinfolk-phase107.js','utf8');
const blockStart=source.indexOf('const pendingBlocks=');
const blockEnd=source.indexOf('window.blockKinfolk=blockPeer;',blockStart);
const dmStart=source.indexOf('function addDmBlock(');
const dmEnd=source.indexOf('function enforce()',dmStart);
assert.ok(blockStart>=0&&blockEnd>blockStart,'block helper must exist');
assert.ok(dmStart>=0&&dmEnd>dmStart,'DM privacy binding must exist');
const blockCode=source.slice(blockStart,blockEnd);
const dmCode=source.slice(dmStart,dmEnd);

function blockHarness(){
  const state={user:{id:'account-A'}},events=[];
  let settle;
  const sb={from:table=>{
    assert.equal(table,'blocks');
    return {insert:row=>{
      events.push(['insert',row.blocker_id,row.blocked_id]);
      return new Promise(resolve=>{settle=resolve});
    }};
  }};
  const blockPeer=vm.runInNewContext(blockCode+'\nblockPeer',{
    window:{state},sb,
    toast:(...args)=>events.push(['toast',...args]),
    closeModal:()=>events.push(['close']),
    console:{warn:(...args)=>events.push(['warn',...args])}
  });
  return {state,events,blockPeer,finish:error=>{assert.equal(typeof settle,'function');settle({error:error||null})}};
}

test('block request preserves originating account and confirms success',async()=>{
  const h=blockHarness(),pending=h.blockPeer('peer-B');
  assert.deepEqual(h.events[0],['insert','account-A','peer-B']);
  h.finish();
  await pending;
  assert.ok(h.events.some(e=>e[0]==='close'));
  assert.ok(h.events.some(e=>e[0]==='toast'&&e[2]==='good'));
});

test('account switch during block request suppresses stale success UI',async()=>{
  const h=blockHarness(),pending=h.blockPeer('peer-B');
  h.state.user.id='account-C';
  h.finish();
  await pending;
  assert.equal(h.events.filter(e=>e[0]==='close'||e[0]==='toast').length,0);
  assert.deepEqual(h.events[0],['insert','account-A','peer-B']);
});

test('account switch during rejected block request suppresses stale error UI',async()=>{
  const h=blockHarness(),pending=h.blockPeer('peer-B');
  h.state.user.id='account-C';
  h.finish(new Error('permission denied'));
  await pending;
  assert.equal(h.events.filter(e=>e[0]==='toast'||e[0]==='close').length,0);
});

test('rejected block insert reports error to the originating account',async()=>{
  const h=blockHarness(),pending=h.blockPeer('peer-B');
  h.finish(new Error('permission denied'));
  await pending;
  assert.ok(h.events.some(e=>e[0]==='toast'&&/permission denied/.test(e[1])&&e[2]==='danger'));
  assert.equal(h.events.some(e=>e[0]==='close'),false);
});

test('existing duplicate block is treated as blocked, without a second insert',async()=>{
  const h=blockHarness(),pending=h.blockPeer('peer-B');
  h.finish(new Error('duplicate key value violates unique constraint'));
  await pending;
  assert.equal(h.events.filter(e=>e[0]==='insert').length,1);
  assert.ok(h.events.some(e=>e[0]==='toast'&&e[2]==='good'));
});

test('cannot block the currently signed-in account',async()=>{
  const h=blockHarness();
  await h.blockPeer('account-A');
  assert.equal(h.events.filter(e=>e[0]==='insert').length,0);
  assert.ok(h.events.some(e=>e[0]==='toast'&&e[2]==='danger'));
});

test('reused DM form blocks the currently selected peer, not a stale peer',()=>{
  const selected=[],button={},note={querySelector:()=>button};
  const document={createElement:()=>note};
  const addDmBlock=vm.runInNewContext(dmCode+'\naddDmBlock',{
    document,blockPeer:peer=>selected.push(peer)
  });
  const form={dataset:{peer:'peer-1'},insertAdjacentElement(){}};
  addDmBlock(form);
  form.dataset.peer='peer-2';
  addDmBlock(form);
  button.onclick({preventDefault(){},stopImmediatePropagation(){}});
  assert.deepEqual(selected,['peer-2']);
  form.dataset.peer='';
  button.onclick({preventDefault(){},stopImmediatePropagation(){}});
  assert.deepEqual(selected,['peer-2'],'missing peer must not block old account');
});

test('messaging fallback polling pauses in background and runs every two seconds',()=>{
  assert.match(source,/setInterval\(\(\)=>\{if\(document\.visibilityState!=='hidden'\)enforce\(\)\},2000\)/);
  assert.match(source,/new MutationObserver\(/,'immediate DOM rebinding is preserved');
});

test('a mobile block button has one click path for touch, pointer and keyboard',()=>{
  const button={},note={querySelector:()=>button};
  const addDmBlock=vm.runInNewContext(dmCode+'\naddDmBlock',{
    document:{createElement:()=>note},blockPeer:()=>{}
  });
  addDmBlock({dataset:{peer:'peer-B'},insertAdjacentElement(){}});
  assert.equal(typeof button.onclick,'function');
  assert.equal(button.onpointerup,undefined);
  assert.equal(button.ontouchend,undefined);
  assert.equal(button.onkeydown,undefined);
});

test('pending block for a previous DM cannot close a newly selected conversation',async()=>{
  const h=blockHarness(),form={isConnected:true,dataset:{peer:'peer-B'}};
  const pending=h.blockPeer('peer-B',form);
  form.dataset.peer='peer-C';
  h.finish();
  await pending;
  assert.equal(h.events.filter(e=>e[0]==='toast'||e[0]==='close').length,0);
  assert.deepEqual(h.events[0],['insert','account-A','peer-B']);
});

test('repeated block actions while a request is pending send only one insert',async()=>{
  const h=blockHarness();
  const pending=h.blockPeer('peer-B');
  await h.blockPeer('peer-B');
  assert.equal(h.events.filter(e=>e[0]==='insert').length,1);
  h.finish();
  await pending;
  const retry=h.blockPeer('peer-B');
  assert.equal(h.events.filter(e=>e[0]==='insert').length,2,'lock must release after completion');
  h.finish();
  await retry;
});
