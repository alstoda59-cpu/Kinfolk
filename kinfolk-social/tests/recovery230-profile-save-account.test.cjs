'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('kinfolk-social/kinfolk-phase100.js','utf8');
assert.match(source,/function requireEditor\(accountId,editor\)/);
assert.match(source,/eq\('id',accountId\)/);
assert.doesNotMatch(source,/eq\('id',state\.user\.id\)/);

function deferred(){
  let resolve;
  const promise=new Promise(r=>{resolve=r});
  return {promise,resolve};
}
async function until(predicate){
  for(let i=0;i<25&&!predicate();i++)await new Promise(r=>setImmediate(r));
  assert.ok(predicate(),'expected async checkpoint to be reached');
}
function harness(hooks={}){
  const calls={uploads:[],removed:[],extras:[],profiles:[],notices:[],closed:0,rendered:0};
  const button={textContent:'Save profile',disabled:false};
  const values={
    editDisplay:'Original Name',editUsername:'original_user',editBio:'A bio',
    editLocation:'Somewhere',editWebsite:'',editMusic:'',editGender:'',
    editOrientation:'',editRelationship:'',editBirthday:''
  };
  const fields={};
  for(const [id,value] of Object.entries(values))fields['#'+id]={value};
  fields['#editAvatar']={files:[{name:'avatar.png',type:'image/png',size:120}]};
  fields['#editWallpaper']={files:[]};
  const editor={dataset:{},isConnected:true,querySelector:sel=>fields[sel]||null,querySelectorAll:()=>[button]};
  let currentEditor=editor;
  const state={user:{id:'account-A'},profile:{id:'account-A'},profiles:new Map()};
  const document={
    getElementById:id=>id==='profileForm'?currentEditor:null,
    contains:el=>el===button,
    addEventListener(){}
  };
  const sb={
    storage:{from:()=>({
      upload:async(path)=>{calls.uploads.push(path);if(hooks.upload)await hooks.upload();return {error:null}},
      remove:async(paths)=>{calls.removed.push(...paths);return {error:null}}
    })},
    from:table=>{
      if(table==='kinfolk_profile_extras')return {upsert:async row=>{calls.extras.push({...row});if(hooks.extras)await hooks.extras();return {error:null}}};
      if(table==='profiles')return {update:row=>({eq:async(key,id)=>{calls.profiles.push({key,id,row:{...row}});return {error:null,count:hooks.profileCount??1}}})};
      throw new Error('Unexpected table '+table);
    }
  };
  const window={};
  const context={
    window,document,state,sb,
    toast:(message,type)=>calls.notices.push({message,type}),
    crypto:{randomUUID:()=> 'synthetic-uuid'},
    closeModal:()=>{calls.closed++},
    hydrateUser:async()=>{},loadCore:async()=>{},
    renderApp:async()=>{calls.rendered++},
    MutationObserver:class{observe(){}},
    setTimeout:()=>0,setInterval:()=>0,
    URL:{},Image:class{}
  };
  const instrumented=source.replace("document.addEventListener('click'","window.__kf230Save=save;document.addEventListener('click'");
  assert.notEqual(instrumented,source,'save hook must be injected into original source');
  vm.runInNewContext(instrumented,context,{timeout:2000});
  return {calls,state,fields,editor,button,
    save:()=>window.__kf230Save(),
    switchAccount:id=>{state.user={id}},
    replaceEditor:()=>{currentEditor={...editor,dataset:{}}}
  };
}

test('successful save pins media path and both database writes to one account',async()=>{
  const h=harness();
  await h.save();
  assert.equal(h.calls.uploads.length,1);
  assert.match(h.calls.uploads[0],/^account-A\/avatars\//);
  assert.equal(h.calls.extras[0].user_id,'account-A');
  assert.equal(h.calls.profiles[0].id,'account-A');
  assert.equal(h.calls.profiles[0].row.display_name,'Original Name');
  assert.equal(h.calls.rendered,1);
  assert.equal(h.calls.notices.at(-1).type,'good');
});

test('account switch during media upload prevents both database writes and cleans media',async()=>{
  const gate=deferred(),h=harness({upload:()=>gate.promise});
  const running=h.save();
  await until(()=>h.calls.uploads.length===1);
  h.switchAccount('account-B');
  gate.resolve();
  await running;
  assert.equal(h.calls.extras.length,0);
  assert.equal(h.calls.profiles.length,0);
  assert.deepEqual(h.calls.removed,h.calls.uploads);
  assert.ok(h.calls.uploads.every(path=>path.startsWith('account-A/')));
  assert.equal(h.calls.rendered,0);
  assert.equal(h.calls.notices.length,0);
});

test('account switch after extras write prevents profile update and stale refresh',async()=>{
  const gate=deferred(),h=harness({extras:()=>gate.promise});
  const running=h.save();
  await until(()=>h.calls.extras.length===1);
  h.switchAccount('account-B');
  gate.resolve();
  await running;
  assert.equal(h.calls.extras[0].user_id,'account-A');
  assert.equal(h.calls.profiles.length,0);
  assert.equal(h.calls.rendered,0);
  assert.equal(h.calls.notices.length,0);
});

test('editor replacement cancels pending upload without modifying replacement editor',async()=>{
  const gate=deferred(),h=harness({upload:()=>gate.promise});
  const running=h.save();
  await until(()=>h.calls.uploads.length===1);
  h.replaceEditor();
  gate.resolve();
  await running;
  assert.equal(h.calls.extras.length,0);
  assert.equal(h.calls.profiles.length,0);
  assert.deepEqual(h.calls.removed,h.calls.uploads);
  assert.equal(h.calls.notices.length,0);
});

test('fields are snapshotted before upload and do not drift during async save',async()=>{
  const gate=deferred(),h=harness({upload:()=>gate.promise});
  const running=h.save();
  await until(()=>h.calls.uploads.length===1);
  h.fields['#editDisplay'].value='Changed mid-upload';
  gate.resolve();
  await running;
  assert.equal(h.calls.profiles[0].row.display_name,'Original Name');
});


test('RLS-filtered zero-row profile update cannot announce success and attempts media cleanup',async()=>{
  const h=harness({profileCount:0});
  await h.save();
  assert.equal(h.calls.profiles.length,1);
  assert.equal(h.calls.rendered,0);
  assert.equal(h.calls.closed,0);
  assert.deepEqual(h.calls.removed,h.calls.uploads);
  assert.match(h.calls.notices.at(-1).message,/Profile could not be updated/);
  assert.notEqual(h.calls.notices.at(-1).type,'good');
});
