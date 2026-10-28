import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../kinfolk-reels159.js',import.meta.url),'utf8');
const A='synthetic-A',B='synthetic-B';
const reels=[
 {id:'r1',kind:'reel',channel_id:'followed',creator_id:A,source_type:'upload',storage_path:'r1.mp4'},
 {id:'r2',kind:'short',channel_id:'unfollowed',creator_id:B,source_type:'upload',storage_path:'r2.mp4'},
 {id:'r3',kind:'reel',channel_id:null,creator_id:B,source_type:'upload',storage_path:'r3.mp4'}
];
function harness(){
 const state={user:{id:A},view:'reels',channels:[{id:'followed',is_subscribed:false},{id:'unfollowed',is_subscribed:false}],subscriptions:new Map([['followed',[{user_id:A}]]]),profiles:new Map()};
 const mediaSigned=[],rerenders=[];
 const feed={isConnected:true,clientHeight:600,style:{setProperty(){}},getBoundingClientRect(){return {top:100,bottom:700,height:600}},querySelectorAll(){return []},addEventListener(){},removeEventListener(){}};
 const main={isConnected:true,innerHTML:'',querySelector(){return feed}};
 const document={head:{appendChild(){}},createElement(){return {textContent:''}},addEventListener(){},querySelectorAll(){return []},getElementById(){return null},hidden:false};
 const window={innerHeight:800,addEventListener(){}};
 const context={state,window,document,console,renderApp:()=>{rerenders.push(state.user?.id)},
  loadVideoReactions:async()=>{},signed:async(_bucket,path)=>{mediaSigned.push(path);return 'https://media.example/'+path},
  videoReactionState:{rows:[],available:true},esc:x=>String(x),savedKinfolkVideoIds:()=>[],
  AbortController,getComputedStyle:()=>({position:'static'}),setTimeout,clearTimeout};
 vm.runInNewContext(source,context);
 return {state,window,main,mediaSigned,rerenders,render:()=>window.kf159RenderReels(main,reels)};
}

test('subscription filter includes only channels subscribed by the active account',()=>{
 const h=harness();
 assert.deepEqual(Array.from(h.window.kf296SubscribedReels(reels,h.state.channels,h.state.subscriptions,A),v=>v.id),['r1']);
 assert.deepEqual(Array.from(h.window.kf296SubscribedReels(reels,h.state.channels,h.state.subscriptions,B),v=>v.id),[]);
 assert.deepEqual(Array.from(h.window.kf296SubscribedReels(reels,h.state.channels,h.state.subscriptions,null),v=>v.id),[]);
});
test('For You signs all permitted media and shows accessible selected tab',async()=>{
 const h=harness();await h.render();
 assert.deepEqual(h.mediaSigned,['r1.mp4','r2.mp4','r3.mp4']);
 assert.match(h.main.innerHTML,/aria-pressed="true" onclick="kf296SelectReelMode\('for_you'\)"/);
});
test('Subscriptions signs only followed-channel media and stays immersive',async()=>{
 const h=harness();await h.render();
 h.window.kf296SelectReelMode('subscriptions');
 assert.equal(h.rerenders.length,1);
 h.mediaSigned.length=0;
 await h.render();
 assert.deepEqual(h.mediaSigned,['r1.mp4']);
 assert.match(h.main.innerHTML,/kf159-feed/);
 assert.match(h.main.innerHTML,/aria-pressed="true" onclick="kf296SelectReelMode\('subscriptions'\)"/);
 assert.doesNotMatch(h.main.innerHTML,/r2\.mp4|r3\.mp4/);
});
test('empty subscriptions retain tabs and do not expose For You media',async()=>{
 const h=harness();await h.render();
 h.window.kf296SelectReelMode('subscriptions');
 h.state.subscriptions.clear();h.mediaSigned.length=0;
 await h.render();
 assert.match(h.main.innerHTML,/No reels from your subscribed channels yet/);
 assert.match(h.main.innerHTML,/For You/);
 assert.deepEqual(h.mediaSigned,[]);
});
test('account switching resets subscription selection before rendering',async()=>{
 const h=harness();await h.render();
 h.window.kf296SelectReelMode('subscriptions');
 h.state.user={id:B};h.mediaSigned.length=0;
 await h.render();
 assert.match(h.main.innerHTML,/aria-pressed="true" onclick="kf296SelectReelMode\('for_you'\)"/);
 assert.deepEqual(h.mediaSigned,['r1.mp4','r2.mp4','r3.mp4']);
});
test('invalid or inactive tab requests do not trigger navigation',async()=>{
 const h=harness();await h.render();
 h.window.kf296SelectReelMode('bogus');
 h.state.view='profile';h.window.kf296SelectReelMode('subscriptions');
 assert.deepEqual(h.rerenders,[]);
});
