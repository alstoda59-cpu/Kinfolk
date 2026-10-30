import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function extract(start,end){
 const a=html.indexOf(start),b=html.indexOf(end,a);
 assert.ok(a>=0&&b>a,'Expected committed '+start+' handler');
 return html.slice(a,b);
}
const handlers=extract('async function createPost(e){','function openStoryModal()')+'\n'+extract('async function createStory(e){','async function viewStory(id)');
function deferred(){let resolve;const promise=new Promise(r=>{resolve=r});return {resolve,promise}}
function harness(kind,{file=true,mediaFile=null,failInsert=false,failRefresh=false,deferUpload=false}={}){
 const isPost=kind==='post',id=isPost?'postForm':'storyForm',table=isPost?'posts':'kinfolk_stories';
 const uploads=[],removals=[],inserts=[],toasts=[];
 const state={user:{id:'A'}};
 const submitButton={disabled:false},progress={textContent:''};
 const fields=isPost?{
  '#postBody':{value:'hello'},'#postFile':{files:file?[mediaFile||{name:'image.png',type:'image/png',size:123}]:[]},'#postProgress':progress
 }:{
  '#storyBody':{value:'hello'},'#storyFile':{files:file?[mediaFile||{name:'image.png',type:'image/png',size:123}]:[]}
 };
 const form={dataset:{},isConnected:true,querySelector:s=>s.startsWith('button')?submitButton:fields[s]||null};
 let closed=0,refreshed=0,rendered=0;
 const ctx={
  state,kf129Epoch:1,
  document:{getElementById:key=>key===id?form:null},
  kfAlphaLoadCurrent:(epoch,uid)=>epoch===ctx.kf129Epoch&&uid===state.user?.id,
  kfAlphaComposerCurrent:(epoch,uid,f,key)=>epoch===ctx.kf129Epoch&&uid===state.user?.id&&f.isConnected!==false&&ctx.document.getElementById(key)===f,
  crypto:{randomUUID:()=> 'uuid'},safeName:n=>n,
  toast:(...a)=>toasts.push(a),closeModal:()=>{closed++},
  loadFeed:async()=>{refreshed++;if(failRefresh)throw new Error('feed unavailable')},
  loadStories:async()=>{refreshed++;if(failRefresh)throw new Error('feed unavailable')},
  renderApp:async()=>{rendered++},
  sb:{
   storage:{from:bucket=>{assert.equal(bucket,'kinfolk-media');return {
    upload:(path,blob,opts)=>{uploads.push({path,blob,opts});if(deferUpload){const d=deferred();uploads.at(-1).deferred=d;return d.promise}return Promise.resolve({error:null})},
    remove:paths=>{removals.push([...paths]);return Promise.resolve({error:null})}
   }}},
   from:name=>{assert.equal(name,table);return {insert:payload=>{inserts.push(payload);return Promise.resolve({error:failInsert?new Error('write rejected'):null})}}}
  }
 };
 vm.createContext(ctx);
 vm.runInContext(handlers+'\nthis.createPost=createPost;this.createStory=createStory;',ctx,{timeout:1000});
 return {ctx,uploads,removals,inserts,toasts,form,submitButton,
  get closed(){return closed},get refreshed(){return refreshed},get rendered(){return rendered},
  submit:()=>ctx[isPost?'createPost':'createStory']({preventDefault(){},currentTarget:form}),
  switchAccount:()=>{state.user={id:'B'};ctx.kf129Epoch++}
 };
}
for(const kind of ['post','story']){
 test(kind+': failed database insert removes uploaded orphan media',async()=>{
  const h=harness(kind,{failInsert:true});await h.submit();
  assert.equal(h.uploads.length,1);assert.equal(h.inserts.length,1);
  assert.deepEqual(h.removals,[[h.uploads[0].path]]);
  assert.equal(h.closed,0);assert.equal(h.submitButton.disabled,false);
  assert.match(h.toasts[0][0],/write rejected/);
 });
 test(kind+': successful insert never deletes media if subsequent refresh fails',async()=>{
  const h=harness(kind,{failRefresh:true});await h.submit();
  assert.equal(h.inserts.length,1);assert.deepEqual(h.removals,[]);
  assert.equal(h.closed,1);assert.equal(h.refreshed,1);
  assert.match(h.toasts[0][0],/feed unavailable/);
 });
 test(kind+': account switch during upload never inserts for another account',async()=>{
  const h=harness(kind,{deferUpload:true}),pending=h.submit();
  assert.equal(h.uploads.length,1);
  h.switchAccount();h.uploads[0].deferred.resolve({error:null});await pending;
  assert.equal(h.inserts.length,0);assert.equal(h.toasts.length,0);
  assert.deepEqual(h.removals,[]);
 });
 test(kind+': text-only posts do not invoke storage cleanup',async()=>{
  const h=harness(kind,{file:false,failInsert:true});await h.submit();
  assert.equal(h.uploads.length,0);assert.equal(h.inserts.length,1);
  assert.deepEqual(h.removals,[]);
 });
}

for(const kind of ['post','story']){
 test(kind+': Recovery345 rejects oversized alpha images without storage or metadata writes',async()=>{
  const h=harness(kind,{mediaFile:{name:'large.png',type:'image/png',size:50*1024*1024+1}});
  await h.submit();
  assert.equal(h.uploads.length,0);assert.equal(h.inserts.length,0);
  assert.equal(h.submitButton.disabled,false);assert.match(h.toasts[0][0],/50 MiB/);
 });
 test(kind+': Recovery345 rejects empty and invalid-size images',async()=>{
  for(const size of [0,NaN,Infinity,-1]){
   const h=harness(kind,{mediaFile:{name:'empty.png',type:'image/png',size}});
   await h.submit();
   assert.equal(h.uploads.length,0);assert.equal(h.inserts.length,0);
   assert.match(h.toasts[0][0],/larger than 0 bytes/);
  }
 });
 test(kind+': Recovery345 rejects unsupported and absent image MIME types',async()=>{
  for(const type of ['video/quicktime','application/octet-stream','']){
   const h=harness(kind,{mediaFile:{name:'invalid.mov',type,size:120}});
   await h.submit();
   assert.equal(h.uploads.length,0);assert.equal(h.inserts.length,0);
   assert.match(h.toasts[0][0],/JPG, PNG, WebP or GIF/);
  }
 });
 test(kind+': Recovery345 permits a supported image at exactly 50 MiB',async()=>{
  const h=harness(kind,{mediaFile:{name:'boundary.webp',type:'image/webp',size:50*1024*1024}});
  await h.submit();
  assert.equal(h.uploads.length,1);assert.equal(h.inserts.length,1);
  assert.equal(h.closed,1);assert.equal(h.submitButton.disabled,false);
 });
 test(kind+': Recovery345 preserves text-only composer without media upload',async()=>{
  const h=harness(kind,{file:false});
  await h.submit();
  assert.equal(h.uploads.length,0);assert.equal(h.inserts.length,1);
  assert.equal(h.closed,1);
 });
}
test('Recovery345 post and story forms explain the isolated alpha image limit',()=>{
 assert.match(html,/JPG, PNG, WebP or GIF, up to 50 MiB on the alpha backend/g);
 assert.match(html,/accept="image\/jpeg,image\/png,image\/webp,image\/gif"/g);
});
