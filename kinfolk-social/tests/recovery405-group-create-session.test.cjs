'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
const start=source.indexOf('async function openGroupCreate()');
const end=source.indexOf('// Recovery343:',start);
assert.ok(start>=0&&end>start,'effective Create Group handler exists');
const code=source.slice(start,end);

function deferred(){
  let resolve;
  const promise=new Promise(r=>{resolve=r});
  return {promise,resolve};
}
function harness(options={}){
  const writes=[],opened=[],messages=[];
  const state={
    user:{id:'owner'},
    friendRequests:[{sender_id:'owner',receiver_id:'friend',status:'accepted'}],
    profiles:new Map([['friend',{display_name:'Friend'}]])
  };
  let form=null,modalCount=0;
  const ctx={
    state,kf129Epoch:3,kf300MessageRequest:8,
    esc:s=>String(s),
    toast:(message,kind)=>messages.push({message,kind}),
    loadProfiles:options.loadProfiles|| (async()=>{}),
    modal:()=>{modalCount++;ctx.kf300MessageRequest++;
      form={isConnected:true,dataset:{},title:'Friends',members:['friend'],
        button:{disabled:false},
        querySelector(sel){
          if(sel==='#groupTitle')return {value:this.title};
          if(sel==='button.btn.primary')return this.button;
          throw Error('Unexpected selector '+sel);
        },
        querySelectorAll(sel){
          if(sel!=='input[name=member]:checked')throw Error('Unexpected selector '+sel);
          return this.members.map(value=>({value}));
        }};
    },
    document:{getElementById:id=>id==='groupCreateForm'?form:null},
    $:selector=>selector==='#groupCreateForm'?form:null,
    openGroup:async id=>{opened.push(id)},
    sb:{from(table){
      if(table==='group_conversations')return {
        insert(payload){writes.push({table,payload});
          return {select(cols){
            assert.equal(cols,'id,owner_id');
            return {single:()=>options.groupResponse?
              options.groupResponse(payload):Promise.resolve({data:{id:'group-1',owner_id:payload.owner_id},error:null})};
          }};
        }};
      if(table==='group_members')return {insert:(payload,opts)=>{
        writes.push({table,payload,opts});
        return options.membersResponse?options.membersResponse(payload):
          Promise.resolve({error:null,count:payload.length});
      }};
      throw Error('Unexpected table '+table);
    }}
  };
  const openGroupCreate=vm.runInNewContext(code+'\nopenGroupCreate',ctx,{timeout:1000});
  const submit=()=>form.onsubmit({preventDefault(){}});
  return {ctx,state,writes,opened,messages,openGroupCreate,submit,get form(){return form},get modalCount(){return modalCount}};
}

test('Recovery405 account change during friend lookup cannot open stale group modal',async()=>{
  const gate=deferred();
  const h=harness({loadProfiles:()=>gate.promise});
  const pending=h.openGroupCreate();
  h.state.user={id:'other'};
  gate.resolve();
  await pending;
  assert.equal(h.modalCount,0);
});

test('Recovery405 invalid title is retryable without a database write',async()=>{
  const h=harness();
  await h.openGroupCreate();
  h.form.title=' ';
  await h.submit();
  assert.equal(h.writes.length,0);
  assert.equal(h.form.dataset.kfGroupCreatePending,undefined);
  h.form.title='Valid group';
  await h.submit();
  assert.equal(h.writes.length,2);
  assert.equal(h.opened[0],'group-1');
});

test('Recovery405 confirmed group and exact member acknowledgments open the new group',async()=>{
  const h=harness();
  await h.openGroupCreate();
  await h.submit();
  assert.equal(h.writes[0].payload.owner_id,'owner');
  assert.equal(h.writes[0].payload.title,'Friends');
  assert.equal(h.writes[1].opts.count,'exact');
  assert.equal(h.writes[1].payload[0].conversation_id,'group-1');
  assert.deepEqual(h.opened,['group-1']);
});

test('Recovery405 pending creation ignores duplicate mobile submit taps',async()=>{
  const gate=deferred();
  const h=harness({groupResponse:()=>gate.promise});
  await h.openGroupCreate();
  const first=h.submit();
  await h.submit();
  assert.equal(h.writes.filter(x=>x.table==='group_conversations').length,1);
  gate.resolve({data:{id:'group-1',owner_id:'owner'},error:null});
  await first;
  await h.submit();
  assert.equal(h.writes.filter(x=>x.table==='group_conversations').length,1);
});

test('Recovery405 uncertain group acknowledgment blocks duplicate inserts',async()=>{
  const h=harness({groupResponse:async()=>({data:null,error:{message:'connection lost'}})});
  await h.openGroupCreate();
  await h.submit();
  await h.submit();
  assert.equal(h.writes.length,1);
  assert.equal(h.opened.length,0);
  assert.match(h.messages[0].message,/Check Group Chats/);
  assert.equal(h.form.button.disabled,true);
});

test('Recovery405 wrong-owner acknowledgment cannot open or invite members',async()=>{
  const h=harness({groupResponse:async()=>({data:{id:'group-1',owner_id:'stranger'},error:null})});
  await h.openGroupCreate();
  await h.submit();
  assert.equal(h.writes.length,1);
  assert.equal(h.opened.length,0);
});

test('Recovery405 account switch during group insert cannot invite or open group',async()=>{
  const gate=deferred();
  const h=harness({groupResponse:()=>gate.promise});
  await h.openGroupCreate();
  const pending=h.submit();
  h.state.user={id:'other'};
  h.ctx.kf129Epoch++;
  gate.resolve({data:{id:'group-1',owner_id:'owner'},error:null});
  await pending;
  assert.equal(h.writes.length,1);
  assert.equal(h.opened.length,0);
});

test('Recovery405 uncertain invitations do not cause duplicate group creation',async()=>{
  const h=harness({membersResponse:async()=>({error:null,count:0})});
  await h.openGroupCreate();
  await h.submit();
  await h.submit();
  assert.equal(h.writes.filter(x=>x.table==='group_conversations').length,1);
  assert.equal(h.opened.length,0);
  assert.match(h.messages[0].message,/invitations could not be confirmed/);
});

test('Recovery405 modal replacement invalidates old Create Group form',async()=>{
  const h=harness();
  await h.openGroupCreate();
  h.ctx.kf300MessageRequest++;
  await h.submit();
  assert.equal(h.writes.length,0);
});
