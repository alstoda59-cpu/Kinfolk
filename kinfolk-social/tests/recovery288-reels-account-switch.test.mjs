import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(path.join(root,'kinfolk-reels159.js'),'utf8');

function harness({loadVideoReactions=async()=>{},signed=async()=>''}={}){
  const state={user:{id:'synthetic-account-a'},view:'reels',profiles:new Map()};
  const document={
    head:{appendChild(){}},
    createElement(){return {textContent:''}},
    addEventListener(){},
    querySelectorAll(){return []}
  };
  const window={addEventListener(){},innerHeight:800};
  vm.runInNewContext(source,{window,document,state,loadVideoReactions,signed});
  const main={isConnected:true,innerHTML:'unchanged-private-feed'};
  const reels=[{
    id:'synthetic-video',creator_id:'synthetic-account-a',
    source_type:'upload',storage_path:'synthetic/video.mp4',
    video_url:''
  }];
  return {state,main,reels,render:()=>window.kf159RenderReels(main,reels)};
}

test('account switch while reactions load never signs or renders previous account Reels',async()=>{
  let release;
  const pending=new Promise(resolve=>{release=resolve});
  let signingCalls=0;
  const h=harness({
    loadVideoReactions:()=>pending,
    signed:async()=>{signingCalls++;return 'https://signed.example/video.mp4'}
  });
  const rendering=h.render();
  h.state.user={id:'synthetic-account-b'};
  release();
  await rendering;
  assert.equal(signingCalls,0);
  assert.equal(h.main.innerHTML,'unchanged-private-feed');
});

test('account switch during private URL signing never inserts previous account Reels',async()=>{
  let signalStarted,releaseSigning;
  const started=new Promise(resolve=>{signalStarted=resolve});
  const pending=new Promise(resolve=>{releaseSigning=resolve});
  const h=harness({
    signed:()=>{signalStarted();return pending}
  });
  const rendering=h.render();
  await started;
  h.state.user={id:'synthetic-account-b'};
  releaseSigning('https://signed.example/private-video.mp4');
  await rendering;
  assert.equal(h.main.innerHTML,'unchanged-private-feed');
});

test('renderer binds its current-generation check to the account identity',()=>{
  assert.match(source,/const renderUserId=state\.user\?\.id\?\?null/);
  assert.match(source,/const isCurrent=\(\)=>[^;]*\(state\.user\?\.id\?\?null\)===renderUserId/);
});
