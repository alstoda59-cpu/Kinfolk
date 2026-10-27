'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function section(a,b){
 const i=html.indexOf(a),j=html.indexOf(b,i+1);
 assert.ok(i>=0&&j>i,'Missing '+a);
 return html.slice(i,j);
}
const guard=section('function kfAlphaLoadCurrent(','async function loadProfiles(');
const composer=section('function kfAlphaComposerCurrent(','async function viewStory(');
function deferred(){
 let resolve;
 return {promise:new Promise(r=>{resolve=r}),finish(v={error:null}){assert.ok(resolve);resolve(v)}};
}
function makeForm(kind,body='Hello',file={name:'sample.png'}){
 const fields={
  ['#'+kind+'Body']:{value:body},
  ['#'+kind+'File']:{files:file?[file]:[]},
  '#postProgress':{textContent:''},
  'button[type="submit"],button:not([type])':{disabled:false}
 };
 return {isConnected:true,dataset:{},fields,querySelector(s){return fields[s]||null}};
}
function setup(kind='post',opts={}){
 const state={user:{id:'account-a'}},form=makeForm(kind,opts.body??'Hello',opts.file===undefined?{name:'sample.png'}:opts.file);
 const formId=kind+'Form',uploads=[],inserts=[],toasts=[];
 const uploadPending=opts.uploadPending||null,insertPending=opts.insertPending||null;
 let closes=0,loads=0,renders=0;
 const document={getElementById(id){return id===formId?opts.activeForm?.()||form:null}};
 const sb={
  storage:{from(bucket){assert.equal(bucket,'kinfolk-media');return {upload(p,f){uploads.push({p,f});return uploadPending?uploadPending.promise:Promise.resolve({error:null})}}}},
  from(table){return {insert(row){inserts.push({table,row});return insertPending?insertPending.promise:Promise.resolve({error:null})}}}
 };
 const factory=new Function('state','sb','document','crypto','safeName','toast','closeModal','loadFeed','loadStories','renderApp',
  'let kf129Epoch=1;'+guard+composer+';return {createPost,createStory,setEpoch(n){kf129Epoch=n}};');
 const app=factory(state,sb,document,{randomUUID:()=> 'uuid'},n=>n.replace(/[^a-zA-Z0-9.]/g,'_'),
  (...args)=>toasts.push(args),()=>{closes++},async()=>{loads++},async()=>{loads++},async()=>{renders++});
 const submit=()=>app[kind==='post'?'createPost':'createStory']({preventDefault(){},currentTarget:form});
 return {state,form,app,uploads,inserts,toasts,submit,get closes(){return closes},get loads(){return loads},get renders(){return renders}};
}
test('post upload from a signed-out account cannot create a post',async()=>{
 const pending=deferred(),x=setup('post',{uploadPending:pending});
 const p=x.submit();x.state.user=null;x.app.setEpoch(2);pending.finish();await p;
 assert.equal(x.inserts.length,0);assert.equal(x.closes,0);assert.equal(x.toasts.length,0);
});
test('post upload from an earlier session of the same user is discarded',async()=>{
 const pending=deferred(),x=setup('post',{uploadPending:pending});
 const p=x.submit();x.app.setEpoch(2);pending.finish();await p;
 assert.equal(x.inserts.length,0);
});
test('replacing the post modal prevents old upload from posting',async()=>{
 const pending=deferred();let active;
 const x=setup('post',{uploadPending:pending,activeForm:()=>active});
 const p=x.submit();active=makeForm('post');pending.finish();await p;
 assert.equal(x.inserts.length,0);assert.equal(x.closes,0);
});
test('double submit cannot upload or insert twice',async()=>{
 const pending=deferred(),x=setup('post',{uploadPending:pending});
 const first=x.submit(),second=x.submit();
 assert.equal(x.uploads.length,1);assert.equal(x.form.fields['button[type="submit"],button:not([type])'].disabled,true);
 pending.finish();await Promise.all([first,second]);
 assert.equal(x.inserts.length,1);assert.equal(x.inserts[0].row.author_id,'account-a');
 assert.equal(x.form.fields['button[type="submit"],button:not([type])'].disabled,false);
});
test('late post insert cannot render a previous account success',async()=>{
 const pending=deferred(),x=setup('post',{insertPending:pending,file:null});
 const p=x.submit();assert.equal(x.inserts.length,1);
 x.state.user={id:'account-b'};x.app.setEpoch(2);pending.finish();await p;
 assert.equal(x.closes,0);assert.equal(x.loads,0);assert.equal(x.renders,0);assert.equal(x.toasts.length,0);
});
test('story upload from another login cannot insert or close the current modal',async()=>{
 const pending=deferred(),x=setup('story',{uploadPending:pending});
 const p=x.submit();x.state.user={id:'account-b'};x.app.setEpoch(2);pending.finish();await p;
 assert.equal(x.inserts.length,0);assert.equal(x.closes,0);
});
test('successful post and story use captured authors and render once',async()=>{
 for(const kind of ['post','story']){
  const x=setup(kind);await x.submit();
  assert.equal(x.inserts.length,1);
  assert.equal(x.inserts[0].row[kind==='post'?'author_id':'owner_id'],'account-a');
  assert.equal(x.closes,1);assert.equal(x.loads,1);assert.equal(x.renders,1);
  assert.equal(x.toasts.length,1);
 }
});
test('upload error re-enables the composer and allows another attempt',async()=>{
 const pending=deferred(),x=setup('post',{uploadPending:pending});
 const button=x.form.fields['button[type="submit"],button:not([type])'];
 const first=x.submit();pending.finish({error:new Error('Network unavailable')});await first;
 assert.equal(x.inserts.length,0);assert.equal(x.uploads.length,1);
 assert.equal(button.disabled,false);assert.equal(x.form.dataset.kfAlphaSending,undefined);
 assert.equal(x.toasts.length,1);
 await x.submit();assert.equal(x.uploads.length,2);assert.equal(x.inserts.length,0);
});
