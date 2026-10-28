import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(path.join(root,'index.html'),'utf8');
const start=html.indexOf('const pendingVideoReactionIds=new Set();');
const end=html.indexOf('window.toggleVideoReaction=toggleVideoReaction;',start);
assert.ok(start>=0&&end>start,'actual video reaction mutation must be present');
const source=html.slice(start,end);

function harness(){
 const requests=[],writes=[],events=[],toasts=[],state={user:{id:'synthetic-A'},videos:[{id:'synthetic-video'}]};
 const videoReactionState={available:true,rows:[]};
 let loads=0;
 const context={
  state,videoReactionState,
  sb:{from(table){
   assert.equal(table,'kinfolk_video_reactions');
   return {upsert(row,options){
    assert.equal(options.onConflict,'video_id,user_id');
    writes.push(row);
    return new Promise(resolve=>requests.push(resolve));
   }};
  }},
  document:{querySelectorAll(){return []},dispatchEvent(e){events.push(e.type)}},
  CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}},
  toast(...args){toasts.push(args)},
  async loadVideoReactions(){loads++},
  videoReactionControls(){return ''},
  window:{}
 };
 vm.runInNewContext('let kf129Epoch=1;'+source+
  ';globalThis.toggle=toggleVideoReaction;globalThis.setEpoch=n=>{kf129Epoch=n};',context);
 return {context,requests,writes,events,toasts,state,loads:()=>loads,
  toggle:(id='synthetic-video',reaction='like')=>context.toggle(id,reaction),
  setEpoch:n=>context.setEpoch(n)};
}

test('successful synthetic reaction uses initiating account and updates controls',async()=>{
 const h=harness(),operation=h.toggle();
 assert.equal(h.writes[0].user_id,'synthetic-A');
 h.requests[0]({error:null});
 await operation;
 assert.equal(h.loads(),1);
 assert.deepEqual(h.events,['kinfolk:video-reaction']);
});

test('old account completion cannot refresh new account reactions',async()=>{
 const h=harness(),old=h.toggle();
 h.state.user={id:'synthetic-B'};
 h.setEpoch(2);
 h.requests[0]({error:null});
 await old;
 assert.equal(h.loads(),0);
 assert.deepEqual(h.events,[]);
 assert.deepEqual(h.toasts,[]);
});

test('new account can react while previous account mutation remains pending',async()=>{
 const h=harness(),old=h.toggle();
 h.state.user={id:'synthetic-B'};
 h.setEpoch(2);
 const current=h.toggle('synthetic-video','dislike');
 assert.equal(h.writes.length,2);
 assert.equal(h.writes[1].user_id,'synthetic-B');
 h.requests[1]({error:null});
 await current;
 h.requests[0]({error:null});
 await old;
 assert.equal(h.loads(),1);
 assert.deepEqual(h.events,['kinfolk:video-reaction']);
});

test('same user after logout and login does not receive stale failure toast',async()=>{
 const h=harness(),old=h.toggle();
 h.setEpoch(3);
 h.requests[0]({error:{message:'stale synthetic outage'}});
 await old;
 assert.equal(h.loads(),0);
 assert.deepEqual(h.events,[]);
 assert.deepEqual(h.toasts,[]);
});

test('same session prevents overlapping reaction mutations for a video',async()=>{
 const h=harness(),first=h.toggle();
 await h.toggle('synthetic-video','dislike');
 assert.equal(h.writes.length,1);
 h.requests[0]({error:null});
 await first;
 assert.equal(h.loads(),1);
});
