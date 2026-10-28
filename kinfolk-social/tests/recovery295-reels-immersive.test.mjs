import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const reels=readFileSync(new URL('../kinfolk-reels159.js',import.meta.url),'utf8');
const start=html.indexOf('let kf295ReelsLoadPromise=null;');
const end=html.indexOf('const videoReactionState=',start);
assert.ok(start>=0&&end>start,'Recovery295 immersive entrypoint exists');
const source=html.slice(start,end);

function harness({moduleReady=true,renderFailure=false}={}){
 const scripts=[],calls=[],warnings=[];
 const state={user:{id:'synthetic-A'},view:'reels',videos:[{id:'synthetic-reel',kind:'reel'},{id:'synthetic-channel',kind:'channel'}]};
 const main={isConnected:true,innerHTML:''};
 const context={
  state,kf129Epoch:1,console:{warn:(...args)=>warnings.push(args)},
  window:{},
  document:{createElement:()=>({}),head:{appendChild:script=>scripts.push(script)}},
  setTimeout:()=>1,clearTimeout:()=>{}
 };
 const render=async(_main,items)=>{calls.push(items.map(x=>x.id));if(renderFailure)throw Error('synthetic renderer failure')};
 if(moduleReady)context.window.kf159RenderReels=render;
 vm.runInNewContext(source+';globalThis.runReels=renderReels;globalThis.setEpoch=n=>{kf129Epoch=n};',context);
 return {state,main,scripts,calls,warnings,context,render,run:()=>context.runReels(main),setEpoch:n=>context.setEpoch(n)};
}

test('installed immersive renderer receives only Reels and replaces loading state',async()=>{
 const h=harness();
 await h.run();
 assert.equal(h.calls.length,1);
 assert.deepEqual(Array.from(h.calls[0]),['synthetic-reel']);
 assert.equal(h.scripts.length,0);
 assert.doesNotMatch(h.main.innerHTML,/videoGrid|reelGrid/);
});

test('missing renderer attempts same-origin script recovery, not legacy video grid',async()=>{
 const h=harness({moduleReady:false});
 const pending=h.run();
 assert.equal(h.scripts.length,1);
 assert.equal(h.scripts[0].src,'/kinfolk-reels159.js');
 assert.match(h.main.innerHTML,/Loading Reels/);
 h.scripts[0].onerror();
 await pending;
 assert.match(h.main.innerHTML,/Reels could not load/);
 assert.match(h.main.innerHTML,/Retry Reels/);
 assert.doesNotMatch(h.main.innerHTML,/reelGrid/);
});

test('recovered immersive script renders the feed',async()=>{
 const h=harness({moduleReady:false});
 const pending=h.run();
 h.context.window.kf159RenderReels=h.render;
 h.scripts[0].onload();
 await pending;
 assert.equal(h.calls.length,1);
 assert.doesNotMatch(h.main.innerHTML,/Reels could not load/);
});

test('stale account switch while loading never renders or replaces new account UI',async()=>{
 const h=harness({moduleReady:false});
 const pending=h.run();
 h.state.user={id:'synthetic-B'};h.setEpoch(2);
 h.main.innerHTML='new account screen';
 h.context.window.kf159RenderReels=h.render;
 h.scripts[0].onload();
 await pending;
 assert.equal(h.calls.length,0);
 assert.equal(h.main.innerHTML,'new account screen');
});

test('renderer failure shows retry rather than a legacy grid',async()=>{
 const h=harness({renderFailure:true});
 await h.run();
 assert.equal(h.calls.length,1);
 assert.match(h.main.innerHTML,/Reels could not load/);
 assert.equal(h.warnings.length,1);
});

test('immersive Reels retains both feed tabs and stops profile audio',()=>{
 assert.match(reels,/window\.kf81StopProfileMusic\?\.\(\)/);
 assert.match(reels,/kf296SelectReelMode\(\x27for_you\x27\)/);
 assert.match(reels,/kf296SelectReelMode\(\x27subscriptions\x27\)/);
 assert.match(reels,/kf159-feed/);
 new vm.Script(reels);
});
