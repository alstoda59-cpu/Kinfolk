import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Source-executed synthetic Story viewer checks, not real Supabase or device QA.
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('let kf416StoryViewRequest=0;');
const end=html.indexOf('// Recovery295:',start);
assert.ok(start>=0&&end>start,'Recovery416 effective Story viewer is present');
const source=html.slice(start,end);
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}};
const tick=()=>new Promise(resolve=>setImmediate(resolve));

function harness(options={}){
 const owner='synthetic-owner';
 const story={
  id:'story-one',owner_id:owner,body:'A private story',
  media_url:options.textOnly?null:owner+'/stories/photo.png',
  created_at:new Date(Date.now()-60000).toISOString(),
  expires_at:new Date(Date.now()+(options.expired?-60000:3600000)).toISOString()
 };
 const state={user:{id:'synthetic-viewer'},view:'home',stories:[story],profiles:new Map([[owner,{display_name:'Creator'}]])};
 const calls=[],notices=[],gates=[];
 const ctx={
  state,Date,kf129Epoch:1,kf300MessageRequest:0,
  kfAlphaLoadCurrent:(epoch,uid)=>!!uid&&epoch===ctx.kf129Epoch&&uid===state.user?.id,
  signed:async(bucket,path)=>{
   calls.push({type:'signed',bucket,path});
   if(options.delayed){const gate=deferred();gates.push(gate);return gate.promise}
   if(options.reject)throw Error('synthetic signing failure');
   return 'https://alpha.invalid/signed-story.png';
  },
  modal:(title,body)=>{calls.push({type:'modal',title,body});ctx.kf300MessageRequest++},
  toast:(message,kind)=>notices.push({message,kind}),
  esc:x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;'),
  fmt:()=> '1m'
 };
 const viewStory=vm.runInNewContext(source+';viewStory',ctx,{timeout:2000});
 return {ctx,state,story,calls,notices,gates,view:id=>viewStory(id||story.id)};
}
const count=(h,type)=>h.calls.filter(x=>x.type===type).length;

test('Story viewer displays an unexpired signed photo for the active account',async()=>{
 const h=harness();await h.view();
 assert.equal(count(h,'signed'),1);assert.equal(count(h,'modal'),1);
 assert.match(h.calls.at(-1).body,/signed-story.png/);
 assert.equal(h.calls.at(-1).title,'Creator');
});
test('text-only Story opens without signing media',async()=>{
 const h=harness({textOnly:true});await h.view();
 assert.equal(count(h,'signed'),0);assert.equal(count(h,'modal'),1);
 assert.match(h.calls.at(-1).body,/A private story/);
});
test('expired cached Story never signs or opens',async()=>{
 const h=harness({expired:true});await h.view();
 assert.equal(count(h,'signed'),0);assert.equal(count(h,'modal'),0);
});
test('account switch during signing never opens previous account Story',async()=>{
 const h=harness({delayed:true}),pending=h.view();
 await tick();h.state.user={id:'other'};h.ctx.kf129Epoch++;
 h.gates[0].resolve('https://alpha.invalid/old-account.png');await pending;
 assert.equal(count(h,'modal'),0);
});
test('same-account reauthentication invalidates the previous signing request',async()=>{
 const h=harness({delayed:true}),pending=h.view();
 await tick();h.ctx.kf129Epoch++;
 h.gates[0].resolve('https://alpha.invalid/old-token.png');await pending;
 assert.equal(count(h,'modal'),0);
});
test('navigation away from Home cancels delayed Story display',async()=>{
 const h=harness({delayed:true}),pending=h.view();
 await tick();h.state.view='channels';
 h.gates[0].resolve('https://alpha.invalid/old-view.png');await pending;
 assert.equal(count(h,'modal'),0);
});
test('opening or closing another modal cancels delayed Story display',async()=>{
 const h=harness({delayed:true}),pending=h.view();
 await tick();h.ctx.kf300MessageRequest++;
 h.gates[0].resolve('https://alpha.invalid/old-modal.png');await pending;
 assert.equal(count(h,'modal'),0);
});
test('a newer Story tap wins even if the older signed URL resolves last',async()=>{
 const h=harness({delayed:true}),first=h.view();
 await tick();const second=h.view();await tick();
 assert.equal(h.gates.length,2);
 h.gates[1].resolve('https://alpha.invalid/new-tap.png');await second;
 h.gates[0].resolve('https://alpha.invalid/old-tap.png');await first;
 assert.equal(count(h,'modal'),1);
 assert.match(h.calls.at(-1).body,/new-tap.png/);
});
test('Story removal or feed replacement while signing cancels stale display',async()=>{
 const h=harness({delayed:true}),pending=h.view();
 await tick();h.state.stories=[{...h.story}];
 h.gates[0].resolve('https://alpha.invalid/removed.png');await pending;
 assert.equal(count(h,'modal'),0);
});
test('Story expiry while signing prevents stale modal',async()=>{
 const h=harness({delayed:true}),pending=h.view();
 await tick();h.story.expires_at=new Date(Date.now()-1000).toISOString();
 h.gates[0].resolve('https://alpha.invalid/expired.png');await pending;
 assert.equal(count(h,'modal'),0);
});
test('signing failure does not open modal and reports a safe error',async()=>{
 const h=harness({reject:true});await h.view();
 assert.equal(count(h,'modal'),0);assert.equal(h.notices.length,1);
 assert.match(h.notices[0].message,/could not be loaded/);
});
