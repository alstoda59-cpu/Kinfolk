import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(path.join(root,'kinfolk-reels159.js'),'utf8');
const start=source.indexOf('async function kf289LoadReactions(');
const end=source.indexOf('async function kf287ResolveReelUrls(',start);
assert.ok(start>=0&&end>start,'bounded optional reactions helper is present');

function reactionHelper(loader){
  return vm.runInNewContext(source.slice(start,end)+';kf289LoadReactions',{
    loadVideoReactions:loader,setTimeout,clearTimeout
  });
}

function harness(loader){
  const state={user:{id:'synthetic-account-a'},view:'reels',profiles:new Map()};
  const feed={
    isConnected:true,clientHeight:600,style:{setProperty(){}},
    getBoundingClientRect(){return {top:100,bottom:700,height:600}},
    querySelectorAll(){return []},addEventListener(){}
  };
  const main={isConnected:true,innerHTML:'unchanged',querySelector(){return feed}};
  const document={
    head:{appendChild(){}},createElement(){return {textContent:''}},
    addEventListener(){},querySelectorAll(){return []},hidden:false
  };
  const window={addEventListener(){},innerHeight:800};
  const videoReactionState={
    rows:[{video_id:'synthetic-video',user_id:'synthetic-account-a',reaction:'like'}],
    available:true
  };
  vm.runInNewContext(source,{
    window,document,state,loadVideoReactions:loader,
    signed:async()=> 'https://media.example/synthetic.mp4',
    videoReactionState,esc:v=>String(v),savedKinfolkVideoIds:()=>[],
    AbortController:class{abort(){}},getComputedStyle:()=>({position:'static'}),
    setTimeout,clearTimeout
  });
  const reels=[{
    id:'synthetic-video',creator_id:'synthetic-account-a',
    source_type:'upload',storage_path:'synthetic/video.mp4',video_url:''
  }];
  return {main,render:()=>window.kf159RenderReels(main,reels)};
}

test('healthy reactions retain Like counts and private video playback',async()=>{
  const h=harness(async()=>{});
  await h.render();
  assert.match(h.main.innerHTML,/https:\/\/media\.example\/synthetic\.mp4/);
  assert.match(h.main.innerHTML,/Like 1/);
  assert.doesNotMatch(h.main.innerHTML,/Reactions require backend activation/);
});

test('rejected reactions query does not block Reels or leak stale reaction counts',async()=>{
  const h=harness(async()=>{throw Error('synthetic reactions outage')});
  await h.render();
  assert.match(h.main.innerHTML,/https:\/\/media\.example\/synthetic\.mp4/);
  assert.match(h.main.innerHTML,/Like 0/);
  assert.doesNotMatch(h.main.innerHTML,/Like 1/);
  assert.match(h.main.innerHTML,/Reactions require backend activation/);
});

test('hung reactions query is bounded rather than blocking video playback forever',async()=>{
  const load=reactionHelper(()=>new Promise(()=>{}));
  assert.equal(await load(15),false);
});

test('reactions helper reports success and failure without swallowing navigation checks',async()=>{
  assert.equal(await reactionHelper(async()=>{})(20),true);
  assert.equal(await reactionHelper(async()=>{throw Error('offline')})(20),false);
  assert.match(source,/const reactionsReady=await kf289LoadReactions\(\);\s*if\(!isCurrent\(\)\)return;/);
  assert.match(source,/const rows=reactionsReady\?videoReactionState\.rows\.filter/);
  assert.match(source,/const disabled=reactionsReady&&videoReactionState\.available/);
});
