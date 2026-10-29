import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const html=readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html'),'utf8');
const start=html.indexOf('async function saveProfile(e){');
const end=html.indexOf('function openCreateMenu(){',start);
assert.ok(start>=0&&end>start,'extract the actual legacy profile editor');
const source=html.slice(start,end);
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const defer=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve}};
async function waitFor(check){for(let i=0;i<50;i++){if(check())return;await new Promise(r=>setImmediate(r))}assert.fail('async stage not reached')}
function harness(options={}){
  const calls={uploads:[],writes:[],closed:0,hydrated:0,loaded:0,rendered:0,toasts:[]};
  const fields={
    '#editDisplay':{value:'Synthetic Name'},'#editUsername':{value:'synthetic_a'},'#editBio':{value:'Test'},
    '#editLocation':{value:''},'#editWebsite':{value:''},'#editMusic':{value:''},
    '#editGender':{value:''},'#editOrientation':{value:''},'#editRelationship':{value:''},'#editBirthday':{value:''},
    '#editAvatar':{files:options.avatar?[{name:'avatar.png'}]:[]},'#editWallpaper':{files:[]}
  };
  const button={disabled:false};
  const form={dataset:{},isConnected:true,querySelector(selector){return selector.startsWith('button[')?button:fields[selector]||null}};
  const ctx={
    form,kf129Epoch:1,
    state:{user:{id:A},profile:{id:A},profiles:new Map()},
    document:{getElementById(id){return id==='profileForm'?ctx.form:null}},
    crypto:{randomUUID:()=> '11111111-1111-4111-8111-111111111111'},
    safeName:name=>name,
    sb:{
      storage:{from(bucket){assert.equal(bucket,'kinfolk-media');return {upload(path,file){calls.uploads.push({path,file});return options.upload??{error:null}}}}},
      from(table){
        if(table==='profiles')return {update(row){calls.writes.push({table,row});return {eq(field,id){assert.equal(field,'id');assert.equal(id,A);return options.profileSave??{error:null}}}}};
        if(table==='kinfolk_profile_extras')return {upsert(row){calls.writes.push({table,row});return options.extrasSave??{error:null}}};
        throw Error('Unexpected table '+table);
      }
    },
    closeModal(){calls.closed++;form.isConnected=false},
    async hydrateUser(){calls.hydrated++;return true},
    async loadCore(){calls.loaded++},
    async renderApp(){calls.rendered++},
    toast(...args){calls.toasts.push(args)}
  };
  const save=vm.runInNewContext(source+';saveProfile',ctx);
  const event={currentTarget:form,preventDefault(){}};
  const switchUser=()=>{ctx.kf129Epoch++;ctx.state.user={id:B}};
  return {save,event,ctx,form,button,calls,switchUser};
}
test('normal profile save uses initiating user and refreshes UI',async()=>{
  const h=harness();await h.save(h.event);
  assert.equal(h.calls.writes.length,2);
  assert.equal(h.calls.writes[1].row.user_id,A);
  assert.equal(h.calls.closed,1);
  assert.equal(h.calls.hydrated,1);
  assert.equal(h.calls.rendered,1);
  assert.equal(h.calls.toasts[0][0],'Profile updated');
});
test('account switch during avatar upload blocks both database writes',async()=>{
  const gate=defer(),h=harness({avatar:true,upload:gate.promise});
  const task=h.save(h.event);await waitFor(()=>h.calls.uploads.length===1);
  assert.ok(h.calls.uploads[0].path.startsWith(A+'/avatars/'));
  h.switchUser();gate.resolve({error:null});await task;
  assert.equal(h.calls.writes.length,0);
  assert.equal(h.calls.closed,0);
  assert.equal(h.calls.toasts.length,0);
});
test('account switch during profile write does not close a new account modal',async()=>{
  const gate=defer(),h=harness({profileSave:gate.promise});
  const task=h.save(h.event);await waitFor(()=>h.calls.writes.length===2);
  h.switchUser();gate.resolve({error:null});await task;
  assert.equal(h.calls.closed,0);
  assert.equal(h.calls.hydrated,0);
  assert.equal(h.calls.toasts.length,0);
});
test('repeated submits while upload is pending cannot duplicate writes',async()=>{
  const gate=defer(),h=harness({avatar:true,upload:gate.promise});
  const first=h.save(h.event);await waitFor(()=>h.calls.uploads.length===1);
  await h.save(h.event);assert.equal(h.calls.uploads.length,1);
  gate.resolve({error:null});await first;
  assert.equal(h.calls.writes.length,2);
});
test('replaced profile editor cannot complete a stale save',async()=>{
  const gate=defer(),h=harness({avatar:true,upload:gate.promise});
  const task=h.save(h.event);await waitFor(()=>h.calls.uploads.length===1);
  h.ctx.form=null;h.form.isConnected=false;gate.resolve({error:null});await task;
  assert.equal(h.calls.writes.length,0);
  assert.equal(h.calls.toasts.length,0);
});
