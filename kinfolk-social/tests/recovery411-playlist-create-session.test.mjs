import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Execute the real channel-playlist creation handler, not a recreated copy.
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('// Recovery411: playlist creation');
const end=html.indexOf('async function openPlaylist(id){',start);
assert.ok(start>=0&&end>start,'Recovery411 playlist creation source exists');
const source=html.slice(start,end);
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const CHANNEL='channel-synthetic-1';
function deferred(){
 let resolve,reject;
 const promise=new Promise((r,j)=>{resolve=r;reject=j});
 return {promise,resolve,reject};
}
function harness(){
 const writes=[],toasts=[],editors=[];
 const fields={
   '#playlistTitle':{value:'  My playlist  '},
   '#playlistDesc':{value:'  Synthetic videos  '},
   '#playlistVisibility':{value:'private'}
 };
 const button={disabled:false};
 const form={isConnected:true,dataset:{},
   querySelector:selector=>selector==='button.btn.primary'?button:fields[selector]||null
 };
 const ctx={
   kf129Epoch:1,kf300MessageRequest:1,
   state:{user:{id:A}},
   modal:()=>{ctx.kf300MessageRequest++},
   $:selector=>selector==='#playlistForm'?form:null,
   document:{getElementById:id=>id==='playlistForm'&&form.isConnected?form:null},
   toast:(...args)=>toasts.push(args),
   managePlaylist:async(id,guard)=>{editors.push({id,guardResult:guard()})},
   sb:{from(table){
     assert.equal(table,'kinfolk_playlists');
     return {insert(payload,opts){
       const d=deferred();
       writes.push({...d,payload,opts});
       return {select(columns){
         assert.equal(columns,'id,owner_id,channel_id');
         return {single:()=>d.promise};
       }};
     }};
   }}
 };
 vm.createContext(ctx);
 vm.runInContext(source,ctx,{timeout:1000});
 ctx.openPlaylistModal(CHANNEL);
 const event={preventDefault(){}};
 return {ctx,form,fields,button,writes,toasts,editors,
   submit:()=>form.onsubmit(event),
   switchUser:()=>{ctx.kf129Epoch++;ctx.state.user={id:B}},
   relogin:()=>{ctx.kf129Epoch++},
   replaceModal:()=>{ctx.kf300MessageRequest++;form.isConnected=false}
 };
}
const saved={data:{id:'playlist-1',owner_id:A,channel_id:CHANNEL},error:null,count:1};

test('creates only one playlist for the initiating account and confirms exactly one row',async()=>{
 const h=harness();
 const first=h.submit(),duplicate=h.submit();
 assert.equal(h.writes.length,1);
 assert.equal(h.writes[0].payload.owner_id,A);
 assert.equal(h.writes[0].payload.channel_id,CHANNEL);
 assert.equal(h.writes[0].payload.title,'My playlist');
 assert.equal(h.writes[0].payload.description,'Synthetic videos');
 assert.equal(h.writes[0].payload.visibility,'private');
 assert.equal(h.writes[0].opts.count,'exact');
 assert.equal(h.form.dataset.kfPlaylistCreatePending,'1');
 assert.equal(h.button.disabled,true);
 h.writes.shift().resolve(saved);
 await Promise.all([first,duplicate]);
 assert.equal(h.editors.length,1);
 assert.deepEqual(h.editors[0],{id:'playlist-1',guardResult:true});
});

test('same-user reauthentication invalidates a pending playlist creation response',async()=>{
 const h=harness(),task=h.submit();
 h.relogin();
 h.writes.shift().resolve(saved);
 await task;
 assert.equal(h.editors.length,0);
 assert.equal(h.toasts.length,0);
});

test('account switching cannot open the previous member playlist editor',async()=>{
 const h=harness(),task=h.submit();
 h.switchUser();
 h.writes.shift().resolve(saved);
 await task;
 assert.equal(h.editors.length,0);
 assert.equal(h.toasts.length,0);
});

test('replaced modal cannot be reopened by a stale playlist response',async()=>{
 const h=harness(),task=h.submit();
 h.replaceModal();
 h.writes.shift().resolve(saved);
 await task;
 assert.equal(h.editors.length,0);
 assert.equal(h.toasts.length,0);
});

test('zero-row and missing affected-row counts cannot claim a playlist was created',async()=>{
 for(const count of [0,null,undefined,2]){
   const h=harness(),task=h.submit();
   h.writes.shift().resolve({...saved,count});
   await task;
   assert.equal(h.editors.length,0);
   assert.equal(h.form.dataset.kfPlaylistCreatePending,'1');
   assert.equal(h.button.disabled,true);
   assert.match(h.toasts[0][0],/could not be confirmed/);
   await h.submit();
   assert.equal(h.writes.length,0);
 }
});

test('wrong owner, wrong channel or missing playlist ID cannot open editor',async()=>{
 for(const data of [
   {id:'playlist-1',owner_id:B,channel_id:CHANNEL},
   {id:'playlist-1',owner_id:A,channel_id:'other-channel'},
   {id:'',owner_id:A,channel_id:CHANNEL}
 ]){
   const h=harness(),task=h.submit();
   h.writes.shift().resolve({...saved,data});
   await task;
   assert.equal(h.editors.length,0);
   assert.match(h.toasts[0][0],/could not be confirmed/);
 }
});

test('network rejection remains locked because a write may have committed',async()=>{
 const h=harness(),task=h.submit();
 h.writes.shift().reject(new Error('connection reset'));
 await task;
 assert.equal(h.editors.length,0);
 assert.equal(h.button.disabled,true);
 assert.match(h.toasts[0][0],/could not be confirmed/);
 await h.submit();
 assert.equal(h.writes.length,0);
});

test('invalid playlist inputs are rejected before a database write',async()=>{
 for(const [selector,value] of [
   ['#playlistTitle',' '],
   ['#playlistTitle','x'.repeat(101)],
   ['#playlistDesc','x'.repeat(501)],
   ['#playlistVisibility','forged']
 ]){
   const h=harness();
   h.fields[selector].value=value;
   await h.submit();
   assert.equal(h.writes.length,0);
   assert.equal(h.button.disabled,false);
   assert.equal(h.form.dataset.kfPlaylistCreatePending,undefined);
   assert.match(h.toasts[0][0],/Check the playlist/);
 }
});

test('playlist editor reads recheck guard after each await',()=>{
 const start=html.indexOf('async function managePlaylist(id,guard=()=>true){');
 const end=html.indexOf('// Recovery406:',start);
 assert.ok(start>=0&&end>start);
 const manager=html.slice(start,end);
 assert.ok((manager.match(/if\(!guard\(\)\)return;/g)||[]).length>=2);
});
