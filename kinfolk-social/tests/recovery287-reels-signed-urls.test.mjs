import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(path.join(root,'kinfolk-reels159.js'),'utf8');
const start=source.indexOf('async function kf287ResolveReelUrls(');
const end=source.indexOf('window.kf159RenderReels=async',start);
assert.ok(start>=0&&end>start,'private video URL helper found in actual Reels source');
const resolveUrls=vm.runInNewContext(source.slice(start,end)+';kf287ResolveReelUrls',{});
const video=(id,upload=true)=>({id,source_type:upload?'upload':'external',storage_path:upload?'synthetic/'+id:null,video_url:'https://media.example/'+id});

test('empty feed does not contact storage',async()=>{
  const result=await resolveUrls([],()=>{throw Error('unexpected signer')},()=>true);
  assert.deepEqual(Array.from(result),[]);
});
test('external videos never request storage signatures',async()=>{
  const result=await resolveUrls([video('a',false),video('b',false)],()=>{throw Error('unexpected signer')},()=>true);
  assert.deepEqual(Array.from(result),['https://media.example/a','https://media.example/b']);
});
test('bounded concurrency preserves original slide order',async()=>{
  let active=0,peak=0;
  const reels=Array.from({length:13},(_,i)=>video(String(i)));
  const result=await resolveUrls(reels,async(_bucket,p)=>{
    active++;peak=Math.max(peak,active);
    await new Promise(r=>setTimeout(r,(13-Number(p.split('/')[1]))%4+1));
    active--;
    return 'https://signed.example/'+p;
  },()=>true);
  assert.ok(peak>1,'requests should overlap');
  assert.ok(peak<=4,'never exceed four in-flight signatures');
  assert.deepEqual(Array.from(result),reels.map(v=>'https://signed.example/'+v.storage_path));
});
test('single failed signature does not discard the remaining reels',async()=>{
  const result=await resolveUrls([video('ok'),video('bad'),video('next')],async(_bucket,p)=>{
    if(p==='synthetic/bad')throw Error('synthetic storage failure');
    return 'https://signed.example/'+p;
  },()=>true);
  assert.deepEqual(Array.from(result),['https://signed.example/synthetic/ok','','https://signed.example/synthetic/next']);
});
test('navigating away stops scheduling further signed URL requests',async()=>{
  let current=true,calls=0;
  const result=await resolveUrls(Array.from({length:8},(_,i)=>video(String(i))),async()=>{
    calls++;current=false;return 'https://signed.example/first';
  },()=>current,1);
  assert.equal(calls,1);
  assert.equal(result.filter(Boolean).length,1);
});
test('Reels renderer uses resolved URLs and checks navigation before rendering',()=>{
  assert.match(source,/const urls=await kf287ResolveReelUrls\(reels,signed,isCurrent\);\s*if\(!isCurrent\(\)\)return;/);
  assert.match(source,/const rawUrl=urls\[i\]/);
  assert.doesNotMatch(source,/const rawUrl=v\.source_type==='upload'&&v\.storage_path\?await signed/);
});
