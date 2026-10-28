import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const reelsSource=readFileSync(new URL('../kinfolk-reels159.js',import.meta.url),'utf8');
const safetySource=readFileSync(new URL('../kinfolk-phase82.js',import.meta.url),'utf8');
const start=safetySource.indexOf('  function addBar(');
const end=safetySource.indexOf('\n\n  function generalOnly(',start);
assert.ok(start>=0&&end>start,'Phase82 content-filter insertion helpers must exist');
const filterHelpers=safetySource.slice(start,end);

function safetyHarness(view='reels'){
 let top=100;
 const calls=[];
 const window={kf159FitViewport:()=>calls.push(top)};
 const state={view};
 const main={isConnected:true,querySelector:()=>null,insertAdjacentHTML:()=>{top+=60}};
 const old={replaceWith:()=>{top+=20}};
 const document={querySelectorAll:()=>[old],createElement:()=>({innerHTML:'',firstElementChild:{}})};
 const context={window,state,document,barHTML:()=>'<div>General</div>'};
 vm.runInNewContext(filterHelpers+';globalThis.add=addBar;globalThis.update=updateBars;',context);
 return {context,main,calls,get top(){return top}};
}
test('safety filter refits Reels after DOM insertion, but not Home',()=>{
 const reels=safetyHarness('reels');
 reels.context.add(reels.main,'reels');
 assert.deepEqual(reels.calls,[160]);
 const home=safetyHarness('home');
 home.context.add(home.main,'home');
 assert.deepEqual(home.calls,[]);
});
test('safety refresh refits the Reels viewport after filter replacement',()=>{
 const reels=safetyHarness('reels');
 reels.context.update();
 assert.deepEqual(reels.calls,[120]);
 const home=safetyHarness('home');
 home.context.update();
 assert.deepEqual(home.calls,[]);
});
function reelsHarness(){
 let top=100;
 const heights=[];
 const feed={
  isConnected:true,clientHeight:700,style:{setProperty:(_key,value)=>heights.push(value)},
  getBoundingClientRect:()=>({top,bottom:800,height:800-top}),
  querySelectorAll:()=>[],addEventListener:()=>{},removeEventListener:()=>{}
 };
 const main={isConnected:true,innerHTML:'',querySelector:()=>feed};
 const document={head:{appendChild:()=>{}},createElement:()=>({textContent:''}),
  addEventListener:()=>{},querySelectorAll:()=>[],getElementById:()=>null,hidden:false};
 const window={innerHeight:800,addEventListener:()=>{}};
 const state={user:{id:'synthetic-A'},view:'reels',channels:[],subscriptions:new Map(),profiles:new Map()};
 const context={window,document,state,console,loadVideoReactions:async()=>{},
  signed:async()=>'',videoReactionState:{rows:[],available:true},
  esc:x=>String(x),savedKinfolkVideoIds:()=>[],AbortController,
  getComputedStyle:()=>({position:'static'}),setTimeout,clearTimeout,renderApp:()=>{}};
 vm.runInNewContext(reelsSource,context);
 return {window,state,main,heights,setTop:value=>{top=value}};
}
test('immersive player refits after late filter and ignores callbacks after teardown',async()=>{
 const h=reelsHarness();
 await h.window.kf159RenderReels(h.main,[{id:'synthetic-video',kind:'reel',creator_id:'synthetic-A',video_url:'https://media.example/reel.mp4'}]);
 assert.equal(h.heights.at(-1),'700px');
 h.setTop(160);
 h.window.kf159FitViewport();
 assert.equal(h.heights.at(-1),'640px');
 h.state.user={id:'synthetic-B'};
 const count=h.heights.length;
 h.window.kf159FitViewport();
 assert.equal(h.heights.length,count,'old account cannot refit its feed');
 h.window.kf159StopReels();
 h.window.kf159FitViewport();
 assert.equal(h.heights.length,count,'stopped feed cannot refit');
});
