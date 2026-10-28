import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(path.join(root,'index.html'),'utf8');
const start=html.indexOf('async function downloadKinfolkVideo(id){');
const end=html.indexOf('window.saveKinfolkVideo=saveKinfolkVideo;',start);
assert.ok(start>=0&&end>start,'actual video download handler must exist');
const source=html.slice(start,end);
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return {promise,resolve,reject}};

function harness({sign,fetchImpl,visibility='private',creator='synthetic-A'}={}){
 const state={user:{id:'synthetic-A'},videos:[{id:'synthetic-video',visibility,creator_id:creator,source_type:'upload',storage_path:'synthetic.mp4'}]};
 const calls={sign:0,fetch:0,blob:0,click:0,objectUrl:0,toasts:[],timeouts:[]};
 const response={ok:true,blob:async()=>{calls.blob++;return {type:'video/mp4'}}};
 const context={
  state,
  signed:async(...args)=>{calls.sign++;return sign?sign(...args):'https://isolated.invalid/synthetic.mp4'},
  fetch:async(...args)=>{calls.fetch++;return fetchImpl?fetchImpl(...args):response},
  toast:(...args)=>calls.toasts.push(args),
  URL:{createObjectURL:()=>{calls.objectUrl++;return 'blob:synthetic'},revokeObjectURL:()=>{}},
  document:{createElement:()=>({click(){calls.click++},remove(){}}),body:{appendChild(){}}},
  setTimeout:(fn,delay)=>calls.timeouts.push(delay)
 };
 vm.runInNewContext('let kf129Epoch=1;'+source+
  ';globalThis.download=downloadKinfolkVideo;globalThis.setEpoch=n=>{kf129Epoch=n};',context);
 return {state,calls,download:()=>context.download('synthetic-video'),setEpoch:n=>context.setEpoch(n)};
}

test('normal synthetic uploaded video download completes',async()=>{
 const h=harness();
 await h.download();
 assert.equal(h.calls.sign,1);
 assert.equal(h.calls.fetch,1);
 assert.equal(h.calls.blob,1);
 assert.equal(h.calls.click,1);
 assert.equal(h.calls.objectUrl,1);
 assert.deepEqual(h.calls.timeouts,[30000]);
 assert.equal(h.calls.toasts.length,0);
});

test('account switch while signing suppresses stale fetch and download',async()=>{
 const pending=deferred(),h=harness({sign:()=>pending.promise});
 const op=h.download();
 h.state.user={id:'synthetic-B'};h.setEpoch(2);
 pending.resolve('https://isolated.invalid/synthetic.mp4');
 await op;
 assert.equal(h.calls.fetch,0);assert.equal(h.calls.click,0);
 assert.equal(h.calls.toasts.length,0);
});

test('logout during fetch suppresses stale blob and download',async()=>{
 const pending=deferred(),h=harness({fetchImpl:()=>pending.promise});
 const op=h.download();
 await Promise.resolve();await Promise.resolve();
 h.state.user=null;h.setEpoch(2);
 pending.resolve({ok:true,blob:async()=>{h.calls.blob++;return {}}});
 await op;
 assert.equal(h.calls.blob,0);assert.equal(h.calls.click,0);
 assert.equal(h.calls.toasts.length,0);
});

test('same-user new session during blob read suppresses stale download',async()=>{
 const pending=deferred(),h=harness({fetchImpl:async()=>({ok:true,blob:()=>{h.calls.blob++;return pending.promise}})});
 const op=h.download();
 await Promise.resolve();await Promise.resolve();await Promise.resolve();
 h.setEpoch(3);
 pending.resolve({type:'video/mp4'});
 await op;
 assert.equal(h.calls.click,0);assert.equal(h.calls.objectUrl,0);
 assert.equal(h.calls.toasts.length,0);
});

test('stale signing failure never displays an error on new account',async()=>{
 const pending=deferred(),h=harness({sign:()=>pending.promise});
 const op=h.download();
 h.state.user={id:'synthetic-B'};h.setEpoch(2);
 pending.reject(Error('synthetic failure'));
 await op;
 assert.equal(h.calls.click,0);assert.equal(h.calls.toasts.length,0);
});

test('current-session signing failure reports an actionable error',async()=>{
 const h=harness({sign:async()=>{throw Error('synthetic failure')}});
 await h.download();
 assert.equal(h.calls.click,0);
 assert.equal(h.calls.toasts.length,1);
 assert.match(h.calls.toasts[0][0],/Download blocked/);
});

test('private video owned by another user is rejected before signing',async()=>{
 const h=harness({creator:'synthetic-B'});
 await h.download();
 assert.equal(h.calls.sign,0);assert.equal(h.calls.click,0);
 assert.match(h.calls.toasts[0][0],/not available/);
});
