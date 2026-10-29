import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('// Recovery302: video uploads must belong');
const end=html.indexOf('async function renderChannels(main)',start);
assert.ok(start>=0&&end>start,'Committed uploadVideo handler must exist');
const actual=html.slice(start,end);
// Allow Node VM async continuations to reach the metadata-insert boundary.
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function deferred(){let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve}}
function harness({channel=null}={}){
 const uploads=[],inserts=[],removals=[],toasts=[];
 const state={user:{id:'A'},channels:[{id:'chan-A',owner_id:'A'},{id:'chan-B',owner_id:'B'}]};
 const button={disabled:false};
 const progress={textContent:''};
 const fields={
  '#videoFile':{files:[{name:'demo.mp4',type:'video/mp4',size:123}]},
  '#videoTitle':{value:'My reel'},
  '#videoKind':{value:'reel'},
  '#videoChannel':{value:channel||''},
  '#videoProgress':progress
 };
 const form={dataset:{},isConnected:true,querySelector:s=>s.startsWith('button')?button:fields[s]||null};
 let currentForm=form,closed=0,loaded=0,rendered=0;
 const ctx={
  state,kf129Epoch:1,
  document:{getElementById:id=>id==='videoForm'?currentForm:null},
  kfAlphaLoadCurrent:(epoch,uid)=>!!uid&&epoch===ctx.kf129Epoch&&state.user?.id===uid,
  kfAlphaComposerCurrent:(epoch,uid,f,id)=>!!uid&&epoch===ctx.kf129Epoch&&state.user?.id===uid&&f.isConnected!==false&&ctx.document.getElementById(id)===f,
  crypto:{randomUUID:()=> 'uuid'},
  safeName:n=>n,
  toast:(...a)=>toasts.push(a),
  closeModal:()=>{closed++},
  loadVideos:async()=>{loaded++},
  renderApp:async()=>{rendered++},
  sb:{
   storage:{from:bucket=>{assert.equal(bucket,'kinfolk-video');return {
    upload:(path,file,opts)=>{const d=deferred();uploads.push({...d,path,file,opts});return d.promise},
    remove:paths=>{removals.push([...paths]);return Promise.resolve({error:null})}
   }}},
   from:table=>{assert.equal(table,'kinfolk_videos');return {
    insert:payload=>{const d=deferred();inserts.push({...d,payload});return d.promise}
   }}
  }
 };
 vm.createContext(ctx);
 vm.runInContext(actual+'\nthis.uploadVideo=uploadVideo;',ctx,{timeout:1000});
 return {ctx,state,form,button,progress,fields,uploads,inserts,removals,toasts,
  get closed(){return closed},get loaded(){return loaded},get rendered(){return rendered},
  submit:()=>ctx.uploadVideo({preventDefault(){},currentTarget:form}),
  switchAccount:uid=>{state.user={id:uid};ctx.kf129Epoch++},
  replaceModal:()=>{currentForm={};form.isConnected=false}
 };
}
test('successful upload uses captured owner ID and owned storage path',async()=>{
 const h=harness({channel:'chan-A'}),pending=h.submit();
 assert.equal(h.uploads.length,1);
 assert.equal(h.uploads[0].path,'A/videos/uuid-demo.mp4');
 assert.equal(h.button.disabled,true);
 h.uploads[0].resolve({error:null});await settle();
 assert.equal(h.inserts.length,1);
 assert.deepEqual({...h.inserts[0].payload},{
  creator_id:'A',title:'My reel',kind:'reel',source_type:'upload',
  storage_path:'A/videos/uuid-demo.mp4',source_mime:'video/mp4',source_size:123,
  channel_id:'chan-A',visibility:'public',processing_status:'ready',transcode_status:'not_required'
 });
 h.inserts[0].resolve({error:null});await pending;
 assert.equal(h.closed,1);assert.equal(h.loaded,1);assert.equal(h.rendered,1);
 assert.equal(h.toasts.length,1);assert.equal(h.button.disabled,false);
});
test('account switch during storage upload never creates a cross-account video row',async()=>{
 const h=harness(),pending=h.submit();
 h.switchAccount('B');h.uploads[0].resolve({error:null});await pending;
 assert.equal(h.inserts.length,0);assert.equal(h.toasts.length,0);assert.equal(h.closed,0);
 assert.equal(h.button.disabled,false);
});
test('new login epoch for same account invalidates old upload',async()=>{
 const h=harness(),pending=h.submit();h.ctx.kf129Epoch++;
 h.uploads[0].resolve({error:null});await pending;
 assert.equal(h.inserts.length,0);assert.equal(h.toasts.length,0);
});
test('replaced video modal invalidates delayed upload',async()=>{
 const h=harness(),pending=h.submit();h.replaceModal();
 h.uploads[0].resolve({error:null});await pending;
 assert.equal(h.inserts.length,0);assert.equal(h.toasts.length,0);
});
test('double submit cannot start duplicate storage writes',async()=>{
 const h=harness(),first=h.submit(),second=h.submit();
 assert.equal(h.uploads.length,1);await second;
 h.uploads[0].resolve({error:null});await settle();
 h.inserts[0].resolve({error:null});await first;
 assert.equal(h.inserts.length,1);
});
test('cannot upload to another account channel',async()=>{
 const h=harness({channel:'chan-B'});await h.submit();
 assert.equal(h.uploads.length,0);assert.equal(h.inserts.length,0);
 assert.match(h.toasts[0][0],/channel you own/);
});
test('database insertion failure cleans up uploaded object while session remains current',async()=>{
 const h=harness(),pending=h.submit();
 h.uploads[0].resolve({error:null});await settle();
 h.inserts[0].resolve({error:new Error('write rejected')});await pending;
 assert.deepEqual(h.removals,[['A/videos/uuid-demo.mp4']]);
 assert.equal(h.toasts[0][0],'write rejected');
 assert.equal(h.closed,0);assert.equal(h.button.disabled,false);
});
test('account switch during database insert does not render or clean up with another account',async()=>{
 const h=harness(),pending=h.submit();
 h.uploads[0].resolve({error:null});await settle();
 assert.equal(h.inserts[0].payload.creator_id,'A');
 h.switchAccount('B');h.inserts[0].resolve({error:null});await pending;
 assert.equal(h.closed,0);assert.equal(h.loaded,0);assert.equal(h.toasts.length,0);
 assert.equal(h.removals.length,0);
});
test('storage failure never creates a video row',async()=>{
 const h=harness(),pending=h.submit();
 h.uploads[0].resolve({error:new Error('storage rejected')});await pending;
 assert.equal(h.inserts.length,0);assert.equal(h.toasts[0][0],'storage rejected');
 assert.equal(h.button.disabled,false);
});
