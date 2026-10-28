'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('kinfolk-social/kinfolk-reels159.js','utf8');

// Synthetic DOM fixture. No real backend, browser, or device is contacted.
function fixture(){
  const nav={isConnected:true,getBoundingClientRect:()=>({top:710,height:70})};
  const feed={isConnected:true,style:{setProperty(){}},
    getBoundingClientRect:()=>({top:120,bottom:710,height:590}),
    querySelectorAll:()=>[],addEventListener(){},removeEventListener(){}};
  const main={isConnected:true,innerHTML:'',querySelector:()=>feed};
  const document={head:{appendChild(){}},createElement:()=>({textContent:''}),
    addEventListener(){},querySelectorAll:()=>[nav],hidden:false};
  const window={innerHeight:780,addEventListener(){}};
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
  const state={view:'reels',user:{id:'synthetic'},profiles:new Map([['synthetic',{display_name:'Tester'}]])};
  const context={window,document,state,esc,console,AbortController,setTimeout,clearTimeout,
    IntersectionObserver:class{observe(){}disconnect(){}},
    getComputedStyle:()=>({position:'fixed'}),
    videoReactionState:{rows:[],available:true},
    savedKinfolkVideoIds:()=>[],loadVideoReactions:async()=>{},signed:async()=>null};
  vm.runInNewContext(source,context,{filename:'kinfolk-reels159.js'});
  const render=async(id,url,source_type='external')=>{
    await window.kf159RenderReels(main,[{id,creator_id:'synthetic',
      title:'Synthetic video',source_type,video_url:url}]);
    return main.innerHTML;
  };
  return {render,main};
}
const decode=s=>s.replace(/&quot;/g,'"').replace(/&#39;/g,"'")
  .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');

test('Reels action handlers preserve hostile IDs as inert string arguments',async()=>{
  const f=fixture();
  const id=`x');globalThis.__kinfolkPwned=true;//" & <test>`;
  const html=await f.render(id,'https://example.invalid/test.mp4');
  const handlers=[...html.matchAll(/onclick="([^"]+)"/g)].map(m=>decode(m[1]));
  const calls=[];
  const scope={__kinfolkPwned:false,
    toggleVideoReaction:(...args)=>calls.push(['reaction',...args]),
    openMediaComments:(...args)=>calls.push(['comments',...args]),
    shareKinfolkVideo:(...args)=>calls.push(['share',...args]),
    remixKinfolkVideo:(...args)=>calls.push(['remix',...args]),
    saveKinfolkVideo:(...args)=>calls.push(['save',...args]),
    downloadKinfolkVideo:(...args)=>calls.push(['download',...args]),
    kf161ToggleSound:(...args)=>calls.push(['sound',...args]),
    kf159TogglePlayback:(...args)=>calls.push(['play',...args])};
  const videoHandlers=handlers.filter(h=>!/openVideoModal/.test(h));
  assert.equal(videoHandlers.length,9,'expected all eight actions and tap playback');
  for(const handler of videoHandlers)vm.runInNewContext(handler,scope);
  assert.equal(scope.__kinfolkPwned,false,'video ID must not execute injected JavaScript');
  assert.equal(calls.length,9);
  for(const call of calls)assert.ok(call.includes(id),'original video ID must reach action intact');
});

test('Reels refuse executable and non-web media URL schemes',async()=>{
  const f=fixture();
  for(const url of ['javascript:alert(1)','data:text/html,evil','blob:untrusted','file:///private.mp4']){
    const html=await f.render('synthetic-video',url);
    assert.doesNotMatch(html,/(?:href|src)="(?:javascript:|data:|blob:|file:)/i);
    assert.match(html,/Video unavailable/);
  }
});

test('Reels still render normal HTTPS video and YouTube external link',async()=>{
  const f=fixture();
  let html=await f.render('safe','https://example.invalid/video.mp4');
  assert.match(html,/<video[^>]+playsinline muted loop/);
  assert.match(html,/kf159-actions/);
  html=await f.render('youtube','https://www.youtube.com/watch?v=123');
  assert.match(html,/Open external video/);
  assert.match(html,/href="https:\/\/www\.youtube\.com/);
});
