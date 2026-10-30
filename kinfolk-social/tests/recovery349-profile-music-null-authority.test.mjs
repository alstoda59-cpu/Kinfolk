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
  let resolve,reject;
  const promise=new Promise((r,j)=>{resolve=r;reject=j});
  return {promise,resolve,reject};
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

test('Settings shows removed music as blank even if public profile still has old URL',()=>{
  const start=source.indexOf("    const music=Object.prototype.hasOwnProperty.call(extra,'music_url')");
  assert.ok(start>=0,'effective Settings music fallback is present');
  const expression=source.slice(start,source.indexOf(';',start)+1);
  const evaluate=(extra,profile)=>vm.runInNewContext('(()=>{'+expression+'return music;})()',{extra,profile});
  assert.equal(evaluate({music_url:null},{profile_music_url:old}),'');
  assert.equal(evaluate({music_url:''},{profile_music_url:old}),'');
  assert.equal(evaluate({music_url:fresh},{profile_music_url:old}),fresh);
  assert.equal(evaluate({},{profile_music_url:old}),old);
});
test('failed extras lookup after same-user relogin does not return stale public music',async()=>{
  const d=deferred(),h=harness(d.promise);
  const pending=h.lookup(A);
  h.ctx.kf129Epoch++;
  d.reject(new Error('request failed'));
  assert.equal(await pending,'');
});
