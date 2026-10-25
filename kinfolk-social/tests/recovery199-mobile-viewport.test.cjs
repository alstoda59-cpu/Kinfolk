'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('kinfolk-social/kinfolk-reels159.js','utf8');

// Synthetic mobile viewport regression only. This is not physical-device QA.
function fixture(withVisualViewport){
  const writes=[],listeners=[];
  let navTop=710;
  const nav={isConnected:true,getBoundingClientRect(){return {top:navTop,height:70}}};
  const feed={
    isConnected:true,
    style:{setProperty(key,value){assert.equal(key,'--kf159-viewport-height');writes.push(value)}},
    getBoundingClientRect(){return {top:120,bottom:710,height:590}},
    querySelectorAll(){return []},
    addEventListener(){},removeEventListener(){},
    tabIndex:0
  };
  const main={
    isConnected:true,innerHTML:'',
    querySelector(selector){assert.equal(selector,'#kf159-feed');return feed}
  };
  const add=(scope)=>(name,fn,options)=>listeners.push({scope,name,fn,signal:options?.signal});
  const window={innerHeight:780,addEventListener:add('window')};
  if(withVisualViewport){
    window.visualViewport={height:740,offsetTop:0,addEventListener:add('visualViewport')};
  }
  const document={
    head:{appendChild(){}},createElement(){return {textContent:''}},
    addEventListener(){},querySelectorAll(){return [nav]},hidden:false
  };
  const state={
    view:'reels',user:{id:'synthetic-account'},
    profiles:new Map([['synthetic-account',{display_name:'Test creator'}]])
  };
  const context={
    window,document,state,console,AbortController,
    IntersectionObserver:class{observe(){}disconnect(){}},
    getComputedStyle:()=>({position:'fixed'}),
    videoReactionState:{rows:[],available:true},
    savedKinfolkVideoIds:()=>[],
    loadVideoReactions:async()=>{},
    signed:async()=>null,
    esc:value=>String(value)
  };
  vm.runInNewContext(source,context,{filename:'kinfolk-reels159.js'});
  return {
    window,writes,main,
    setNavTop(top){navTop=top},
    emit(scope,name){
      for(const entry of listeners){
        if(entry.scope===scope&&entry.name===name&&!entry.signal?.aborted)entry.fn();
      }
    },
    async render(){
      await window.kf159RenderReels(main,[{
        id:'synthetic-video',creator_id:'synthetic-account',title:'Synthetic mobile test',
        source_type:'external',video_url:'https://example.invalid/test.mp4'
      }]);
    }
  };
}

test('iPhone Safari-sized visual viewport recalculates Shorts above navigation',async()=>{
  const f=fixture(true);
  await f.render();
  assert.equal(f.writes.at(-1),'590px');
  f.window.visualViewport.height=500;
  f.emit('visualViewport','resize');
  assert.equal(f.writes.at(-1),'380px');
  f.window.visualViewport.offsetTop=20;
  f.emit('visualViewport','scroll');
  assert.equal(f.writes.at(-1),'400px');
  const before=f.writes.length;
  f.window.kf159StopReels();
  f.window.visualViewport.height=300;
  f.emit('visualViewport','resize');
  assert.equal(f.writes.length,before,'listeners must stop after navigation away');
});

test('Android Chrome-sized window fallback accounts for fixed bottom navigation',async()=>{
  const f=fixture(false);
  await f.render();
  assert.equal(f.writes.at(-1),'590px');
  f.window.innerHeight=640;
  f.setNavTop(580);
  f.emit('window','resize');
  assert.equal(f.writes.at(-1),'460px');
  assert.match(f.main.innerHTML,/kf159-actions/);
  assert.match(f.main.innerHTML,/playsinline muted loop/);
});

test('iPhone keyboard viewport never collapses Shorts below usable minimum',async()=>{
  const f=fixture(true);
  await f.render();
  f.window.visualViewport.height=180;
  f.window.visualViewport.offsetTop=0;
  f.emit('visualViewport','resize');
  assert.equal(f.writes.at(-1),'120px');
  f.window.visualViewport.height=740;
  f.emit('visualViewport','resize');
  assert.equal(f.writes.at(-1),'590px','height should recover after keyboard closes');
});

test('Android viewport resize events do not write after Shorts navigation cleanup',async()=>{
  const f=fixture(false);
  await f.render();
  const count=f.writes.length;
  f.window.kf159StopReels();
  f.window.innerHeight=500;
  f.setNavTop(420);
  f.emit('window','resize');
  assert.equal(f.writes.length,count,'stale resize must not modify inactive Reels');
});

test('iOS visual viewport never extends below the browser window',async()=>{
  const f=fixture(true);
  await f.render();
  f.window.visualViewport.height=900;
  f.window.visualViewport.offsetTop=40;
  f.setNavTop(1000);
  f.emit('visualViewport','resize');
  assert.equal(f.writes.at(-1),'660px','viewport must be capped at window.innerHeight');
});

test('rapid Reels rerender does not accumulate active viewport resize handlers',async()=>{
  const f=fixture(true);
  await f.render();
  await f.render();
  const before=f.writes.length;
  f.window.visualViewport.height=500;
  f.emit('visualViewport','resize');
  assert.equal(f.writes.length,before+1,'only the latest Reels viewport handler should run');
  assert.equal(f.writes.at(-1),'380px');
});

test('Shorts viewport respects a bottom navigation that moves during rotation',async()=>{
  const f=fixture(false);
  await f.render();
  f.window.innerHeight=500;
  f.setNavTop(430);
  f.emit('window','resize');
  assert.equal(f.writes.at(-1),'310px');
  f.window.innerHeight=780;
  f.setNavTop(710);
  f.emit('window','resize');
  assert.equal(f.writes.at(-1),'590px');
});
