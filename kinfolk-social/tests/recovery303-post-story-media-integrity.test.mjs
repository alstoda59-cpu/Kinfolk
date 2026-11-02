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
function deferred(){let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j});return {resolve,reject,promise}}
function harness(kind,{file=true,mediaFile=null,failInsert=false,failRefresh=false,deferUpload=false,deferInsert=false,rejectInsert=false,insertResult=null}={}){
 const isPost=kind==='post',id=isPost?'postForm':'storyForm',table=isPost?'posts':'kinfolk_stories',owner=isPost?'author_id':'owner_id';
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
   from:name=>{
    assert.equal(name,table);
    return {
     insert:(payload,opts)=>{
      const entry={payload,opts};
      inserts.push(entry);
      return {
       select:columns=>{
        assert.equal(columns,`id,${owner},media_url`);
        return {
         single:()=>{
          if(deferInsert){entry.deferred=deferred();return entry.deferred.promise}
          if(rejectInsert)return Promise.reject(new Error('network acknowledgment lost'));
          return Promise.resolve(insertResult??{
           error:failInsert?new Error('write rejected'):null,
           count:1,data:{id:'saved-row',[owner]:'A',media_url:payload.media_url}
          });
         }
        };
       }
      };
     }
    };
   }
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
 test(kind+': failed database acknowledgment preserves potentially referenced media and locks retry',async()=>{
  const h=harness(kind,{failInsert:true});await h.submit();
  assert.equal(h.uploads.length,1);assert.equal(h.inserts.length,1);
  assert.deepEqual(h.removals,[]);
  assert.equal(h.closed,0);assert.equal(h.submitButton.disabled,true);
  assert.equal(h.form.dataset.kfAlphaSending,'1');
  assert.match(h.toasts[0][0],/could not be confirmed/);
  await h.submit();assert.equal(h.uploads.length,1);assert.equal(h.inserts.length,1);
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


for(const kind of ['post','story']){
 const owner=kind==='post'?'author_id':'owner_id';
 test(kind+': Recovery414 requires exact one-row owned insert acknowledgment',async()=>{
  const good={id:'row-1',[owner]:'A',media_url:'A/'+(kind==='post'?'posts':'stories')+'/uuid-image.png'};
  for(const count of [undefined,null,0,2]){
   const h=harness(kind,{insertResult:{error:null,count,data:good}});
   await h.submit();
   assert.equal(h.closed,0);assert.equal(h.refreshed,0);
   assert.equal(h.submitButton.disabled,true);assert.deepEqual(h.removals,[]);
   assert.equal(h.inserts[0].opts.count,'exact');
  }
 });
 test(kind+': Recovery414 rejects mismatched owner, path and missing row',async()=>{
  const path='A/'+(kind==='post'?'posts':'stories')+'/uuid-image.png';
  for(const data of [
   {id:'row', [owner]:'B',media_url:path},
   {id:'row', [owner]:'A',media_url:'B/foreign.png'},
   {id:'', [owner]:'A',media_url:path},
   null
  ]){
   const h=harness(kind,{insertResult:{error:null,count:1,data}});
   await h.submit();
   assert.equal(h.closed,0);assert.equal(h.submitButton.disabled,true);
   assert.deepEqual(h.removals,[]);
  }
 });
 test(kind+': Recovery414 lost acknowledgment rejects and blocks duplicate retry',async()=>{
  const h=harness(kind,{rejectInsert:true});await h.submit();
  assert.equal(h.closed,0);assert.equal(h.submitButton.disabled,true);
  assert.deepEqual(h.removals,[]);
  await h.submit();assert.equal(h.uploads.length,1);assert.equal(h.inserts.length,1);
 });
 test(kind+': Recovery414 in-flight metadata write cannot submit twice',async()=>{
  const h=harness(kind,{deferInsert:true}),pending=h.submit();
  for(let i=0;i<30&&!h.inserts[0]?.deferred;i++)await new Promise(r=>setTimeout(r,1));
  assert.ok(h.inserts[0]?.deferred);
  await h.submit();assert.equal(h.inserts.length,1);
  h.inserts[0].deferred.resolve({error:null,count:1,data:{id:'row',[owner]:'A',media_url:h.uploads[0].path}});
  await pending;
  assert.equal(h.closed,1);assert.equal(h.submitButton.disabled,false);
 });
 test(kind+': Recovery414 stale account never renders after delayed metadata response',async()=>{
  const h=harness(kind,{deferInsert:true}),pending=h.submit();
  for(let i=0;i<30&&!h.inserts[0]?.deferred;i++)await new Promise(r=>setTimeout(r,1));
  assert.ok(h.inserts[0]?.deferred);
  h.switchAccount();
  h.inserts[0].deferred.resolve({error:null,count:1,data:{id:'row',[owner]:'A',media_url:h.uploads[0].path}});
  await pending;
  assert.equal(h.closed,0);assert.equal(h.refreshed,0);
  assert.deepEqual(h.removals,[]);assert.equal(h.toasts.length,0);
 });
 test(kind+': Recovery414 text-only uncertain metadata write also locks original composer',async()=>{
  const h=harness(kind,{file:false,rejectInsert:true});await h.submit();
  assert.equal(h.uploads.length,0);assert.equal(h.inserts.length,1);
  assert.equal(h.submitButton.disabled,true);
  await h.submit();assert.equal(h.inserts.length,1);
 });
}
