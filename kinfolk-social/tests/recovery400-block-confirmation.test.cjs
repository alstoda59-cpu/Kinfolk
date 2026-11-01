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

test('repeated block taps within one auth activation share a single insert',async()=>{
  const h=harness();
  const first=h.blockPeer('synthetic-peer-B');
  await h.blockPeer('synthetic-peer-B');
  assert.equal(h.writes.length,1);
  h.writes[0].resolve({error:null,count:1});await first;
  assert.equal(successes(h).length,2);
});
test('new same-account activation can block while old request is still pending',async()=>{
  const h=harness();
  const old=h.blockPeer('synthetic-peer-B');
  assert.equal(h.writes.length,1);
  h.ctx.kf129Epoch=2;
  const fresh=h.blockPeer('synthetic-peer-B');
  assert.equal(h.writes.length,2,'fresh session must not inherit old request lock');
  h.writes[0].resolve({error:null,count:1});await old;
  assert.equal(h.events.length,0,'old session cannot acknowledge privacy action');
  await h.blockPeer('synthetic-peer-B');
  assert.equal(h.writes.length,2,'old cleanup must not unlock pending fresh request');
  h.writes[1].resolve({error:null,count:1});await fresh;
  assert.equal(successes(h).length,2,'only fresh session may acknowledge success');
});


// Recovery403 DM privacy control: exercise the actual helper from Phase107.
// This button is a sibling of the form, so replacing that sibling must not
// permanently hide the safety action while the form itself stays mounted.
const privacyStart=source.indexOf('function addDmBlock(form){');
const privacyEnd=source.indexOf('function enforce(){',privacyStart);
assert.ok(privacyStart>=0&&privacyEnd>privacyStart,'effective DM privacy helper is present');
const privacyCode=source.slice(privacyStart,privacyEnd);
function privacyHarness(){
  const notes=[],calls=[];
  const form={
    dataset:{peer:'synthetic-peer-B'},
    previousElementSibling:null,
    insertAdjacentElement(position,note){
      assert.equal(position,'beforebegin');
      this.previousElementSibling=note;
      note.isConnected=true;
      notes.push(note);
    }
  };
  const document={createElement(tag){
    assert.equal(tag,'div');
    const button={onclick:null};
    const note={
      isConnected:false,
      button,
      querySelector(selector){return selector==='button'?this.button:null},
      remove(){
        this.isConnected=false;
        if(form.previousElementSibling===this)form.previousElementSibling=null;
      }
    };
    return note;
  }};
  const addDmBlock=vm.runInNewContext(privacyCode+'\naddDmBlock',{
    document,blockPeer:(peer,origin)=>{calls.push({peer,origin});return Promise.resolve()}
  },{timeout:1000});
  return {form,notes,calls,addDmBlock};
}
function clickPrivacy(note){
  let prevented=false,stopped=false;
  note.button.onclick({
    preventDefault(){prevented=true},
    stopImmediatePropagation(){stopped=true}
  });
  assert.ok(prevented&&stopped,'native click must be handled once');
}

test('Recovery403 DM privacy control stays single across repeated mobile enforcement',()=>{
  const h=privacyHarness();
  h.addDmBlock(h.form);
  h.addDmBlock(h.form);
  h.addDmBlock(h.form);
  assert.equal(h.notes.length,1);
  assert.equal(h.form.dataset.kf107Privacy,'1');
  clickPrivacy(h.notes[0]);
  assert.equal(h.calls.length,1);
  assert.equal(h.calls[0].peer,'synthetic-peer-B');
  assert.equal(h.calls[0].origin,h.form);
});

test('Recovery403 recreates Block Account after modal removes only its sibling',()=>{
  const h=privacyHarness();
  h.addDmBlock(h.form);
  const first=h.notes[0];
  first.remove();
  assert.equal(h.form.dataset.kf107Privacy,'1','legacy flag remains set');
  h.addDmBlock(h.form);
  assert.equal(h.notes.length,2);
  assert.equal(h.form.previousElementSibling,h.notes[1]);
  clickPrivacy(h.notes[1]);
  assert.equal(h.calls.length,1);
});

test('Recovery403 reparented DM form removes orphan privacy control and uses current peer',()=>{
  const h=privacyHarness();
  h.addDmBlock(h.form);
  const first=h.notes[0];
  h.form.previousElementSibling={otherModalElement:true};
  h.form.dataset.peer='synthetic-peer-C';
  h.addDmBlock(h.form);
  assert.equal(first.isConnected,false,'old button must not remain in previous modal');
  assert.equal(h.notes.length,2);
  clickPrivacy(h.notes[1]);
  assert.equal(h.calls[0].peer,'synthetic-peer-C');
  assert.equal(h.calls[0].origin,h.form);
});

test('Recovery403 missing privacy button is recreated without duplicate visible controls',()=>{
  const h=privacyHarness();
  h.addDmBlock(h.form);
  const first=h.notes[0];
  first.button=null;
  h.addDmBlock(h.form);
  assert.equal(first.isConnected,false);
  assert.equal(h.notes.length,2);
  assert.ok(h.notes[1].button.onclick);
});

test('Recovery403 never offers Block Account without a selected DM peer',()=>{
  const h=privacyHarness();
  delete h.form.dataset.peer;
  h.addDmBlock(h.form);
  assert.equal(h.notes.length,0);
});

test('Recovery403 rerendered privacy button with stripped handler becomes functional again',()=>{
  const h=privacyHarness();
  h.addDmBlock(h.form);
  const first=h.notes[0];
  first.button.onclick=null;
  h.addDmBlock(h.form);
  assert.equal(first.isConnected,false);
  assert.equal(h.notes.length,2);
  clickPrivacy(h.notes[1]);
  assert.equal(h.calls.length,1);
});
