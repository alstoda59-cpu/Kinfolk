import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(path.join(root,'index.html'),'utf8');
const start=html.indexOf('const videoReactionState={rows:[],available:false};');
const end=html.indexOf('function videoReactionControls(',start);
assert.ok(start>=0&&end>start,'actual video reactions loader must be present');
const loaderSource=html.slice(start,end);

function harness(){
 const requests=[];
 const state={user:{id:'synthetic-A'},videos:[{id:'synthetic-video'}]};
 const ctx={
  state,kf129Epoch:1,console:{warn(){}},
  sb:{from(table){
   assert.equal(table,'kinfolk_video_reactions');
   return {select(columns){
    assert.equal(columns,'video_id,user_id,reaction');
    return {in(field,ids){
     assert.equal(field,'video_id');
     assert.deepEqual(Array.from(ids),['synthetic-video']);
     return new Promise(resolve=>requests.push(resolve));
    }};
   }};
  }}
 };
 vm.runInNewContext(loaderSource+';globalThis.loadReactions=loadVideoReactions;globalThis.reactionState=videoReactionState;',ctx);
 return {ctx,requests,load:()=>ctx.loadReactions(),rows:()=>JSON.parse(JSON.stringify(ctx.reactionState.rows)),available:()=>ctx.reactionState.available};
}
const row=(user_id,reaction='like')=>({video_id:'synthetic-video',user_id,reaction});

test('normal synthetic account reaction query becomes available',async()=>{
 const h=harness();
 const loading=h.load();
 h.requests[0]({data:[row('synthetic-A')],error:null});
 await loading;
 assert.deepEqual(h.rows(),[row('synthetic-A')]);
 assert.equal(h.available(),true);
});

test('old account response cannot populate new account reaction state',async()=>{
 const h=harness();
 const old=h.load();
 h.ctx.state.user={id:'synthetic-B'};
 h.ctx.kf129Epoch++;
 h.requests[0]({data:[row('synthetic-A')],error:null});
 await old;
 assert.deepEqual(h.rows(),[]);
 assert.equal(h.available(),false);
});

test('logout and login to same user cannot revive an earlier session response',async()=>{
 const h=harness();
 const old=h.load();
 h.ctx.kf129Epoch+=2;
 h.requests[0]({data:[row('synthetic-A')],error:null});
 await old;
 assert.deepEqual(h.rows(),[]);
 assert.equal(h.available(),false);
});

test('slow earlier request cannot overwrite newer reactions',async()=>{
 const h=harness();
 const first=h.load(),second=h.load();
 h.requests[1]({data:[row('synthetic-A','dislike')],error:null});
 await second;
 h.requests[0]({data:[row('synthetic-A','like')],error:null});
 await first;
 assert.deepEqual(h.rows(),[row('synthetic-A','dislike')]);
 assert.equal(h.available(),true);
});

test('stale backend failure cannot reset or overwrite newer success',async()=>{
 const h=harness();
 const first=h.load(),second=h.load();
 h.requests[1]({data:[row('synthetic-A')],error:null});
 await second;
 h.requests[0]({data:null,error:{message:'synthetic stale outage'}});
 await first;
 assert.deepEqual(h.rows(),[row('synthetic-A')]);
 assert.equal(h.available(),true);
});
