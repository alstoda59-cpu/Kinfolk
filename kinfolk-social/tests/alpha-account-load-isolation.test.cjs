'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const begin=html.indexOf('async function loadCore()');
const end=html.indexOf('function renderAuth(',begin);
assert.ok(begin>=0&&end>begin,'Active account-scoped loaders exist');
const install=new Function('state','sb',`let kf129Epoch=1;${html.slice(begin,end)};return {loadCore,loadFeed,setEpoch(n){kf129Epoch=n}};`);

function harness(){
 const state={user:{id:'account-a'},profile:null,profiles:new Map(),feed:[],stories:[],channels:[],videos:[],friendRequests:[],notifications:[],likes:new Map(),comments:new Map(),subscriptions:new Map()};
 const pending=[];
 const sb={from(table){
   const query={select(){return query},eq(){return query},gt(){return query},order(){return query},limit(){return query},in(){return query},then(resolve){pending.push({table,resolve})}};
   return query;
 }};
 const app=install(state,sb);
 const settle=(table,data=[],error=null)=>{
   const i=pending.findIndex(x=>x.table===table);
   assert.notEqual(i,-1,'Expected pending '+table);
   pending.splice(i,1)[0].resolve({data,error});
 };
 const tick=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve()};
 const switchAccount=()=>{state.user={id:'account-b'};app.setEpoch(2);state.feed=[];state.stories=[];state.channels=[];state.videos=[];state.friendRequests=[];state.notifications=[];state.likes.clear();state.comments.clear();state.subscriptions.clear();state.profiles.clear()};
 return {state,pending,app,settle,tick,switchAccount};
}

test('all six pending Home/media/social fetches are discarded after account switch',async()=>{
 const h=harness();const task=h.app.loadCore();await h.tick();
 assert.equal(h.pending.length,6);
 h.switchAccount();
 for(const item of h.pending.splice(0))item.resolve({data:[{id:'stale',owner_id:'stale',creator_id:'stale',actor_id:'stale',sender_id:'stale',receiver_id:'stale'}],error:null});
 await task;
 for(const key of ['feed','stories','channels','videos','friendRequests','notifications'])assert.deepEqual(h.state[key],[],key);
 assert.equal(h.state.profiles.size,0);
});

test('late profile fetch cannot repopulate a different account',async()=>{
 const h=harness();const task=h.app.loadFeed();await h.tick();
 h.settle('posts',[{id:'old-post',author_id:'old-author'}]);await h.tick();
 assert.ok(h.pending.some(x=>x.table==='profiles'));
 h.switchAccount();h.settle('profiles',[{id:'old-author',username:'old'}]);
 await task;
 assert.equal(h.state.profiles.size,0);
 assert.deepEqual(h.state.feed,[]);
 assert.ok(!h.pending.some(x=>x.table==='post_likes'));
});

test('late likes and comments cannot cross accounts',async()=>{
 const h=harness();const task=h.app.loadFeed();await h.tick();
 h.settle('posts',[{id:'old-post'}]);await h.tick();
 assert.ok(h.pending.some(x=>x.table==='post_likes'));
 assert.ok(h.pending.some(x=>x.table==='comments'));
 h.switchAccount();
 h.settle('post_likes',[{post_id:'old-post',user_id:'old'}]);
 h.settle('comments',[{post_id:'old-post',author_id:'old'}]);
 await task;
 assert.equal(h.state.likes.size,0);
 assert.equal(h.state.comments.size,0);
});

test('an empty feed clears obsolete likes and comments for current account',async()=>{
 const h=harness();
 h.state.likes.set('old-post',[{}]);h.state.comments.set('old-post',[{}]);
 const task=h.app.loadFeed();await h.tick();h.settle('posts',[]);await task;
 assert.deepEqual(h.state.feed,[]);
 assert.equal(h.state.likes.size,0);
 assert.equal(h.state.comments.size,0);
});
