import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(path.join(root,'kinfolk-phase81.js'),'utf8');
const start=source.indexOf('  async function musicUrlFor(uid){');
const end=source.indexOf('  async function ensureMusic(force=false){',start);
assert.ok(start>=0&&end>start,'effective profile music lookup exists');
const code=source.slice(start,end);
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const old='https://example.test/old.mp3';
const fresh='https://example.test/new.mp3';

function deferred(){
  let resolve;
  const promise=new Promise(r=>{resolve=r});
  return {promise,resolve};
}
function harness(response={data:{music_url:fresh},error:null}){
  const calls=[];
  const ctx={
    kf129Epoch:8,
    state:{
      user:{id:A},
      profile:{id:A,profile_music_url:old},
      profiles:new Map([[B,{id:B,profile_music_url:old}]])
    },
    sb:{
      from(table){
        calls.push(table);
        assert.equal(table,'kinfolk_profile_extras','opening a profile must never write to profiles');
        return {
          select(columns){
            assert.equal(columns,'music_url');
            return {eq(field,id){
              assert.equal(field,'user_id');
              assert.equal(id,A);
              return {maybeSingle:()=>response};
            }};
          }
        };
      }
    }
  };
  const lookup=vm.runInNewContext(code+';musicUrlFor',ctx,{timeout:1000});
  return {ctx,calls,lookup};
}

test('explicit null in extras removes music even when public profile has an old URL',async()=>{
  const h=harness({data:{music_url:null},error:null});
  assert.equal(await h.lookup(A),'');
  assert.deepEqual(h.calls,['kinfolk_profile_extras']);
});
test('empty music preference also overrides stale public profile music',async()=>{
  const h=harness({data:{music_url:''},error:null});
  assert.equal(await h.lookup(A),'');
});
test('private extras music URL wins over stale public profile value without a write',async()=>{
  const h=harness({data:{music_url:fresh},error:null});
  assert.equal(await h.lookup(A),fresh);
  assert.deepEqual(h.calls,['kinfolk_profile_extras']);
});
test('missing private extras row preserves public profile fallback',async()=>{
  const h=harness({data:null,error:null});
  assert.equal(await h.lookup(A),old);
});
test('failed extras lookup preserves public profile fallback',async()=>{
  const h=harness({data:null,error:{message:'network unavailable'}});
  assert.equal(await h.lookup(A),old);
});
test('other member profile reads public music without querying private extras',async()=>{
  const h=harness();
  assert.equal(await h.lookup(B),old);
  assert.deepEqual(h.calls,[]);
});
test('account switch during extras request discards stale music lookup',async()=>{
  const d=deferred(),h=harness(d.promise);
  const pending=h.lookup(A);
  h.ctx.state.user={id:B};
  d.resolve({data:{music_url:fresh},error:null});
  assert.equal(await pending,'');
});
test('same-user new auth activation discards stale music lookup',async()=>{
  const d=deferred(),h=harness(d.promise);
  const pending=h.lookup(A);
  h.ctx.kf129Epoch++;
  d.resolve({data:{music_url:fresh},error:null});
  assert.equal(await pending,'');
});
