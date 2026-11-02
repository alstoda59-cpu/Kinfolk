import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../kinfolk-phase76.js',import.meta.url),'utf8');
const begin=source.indexOf('const wallpaperSignedCache=new Map();');
const finish=source.indexOf('// Recovery420: bind each upload',begin);
assert.ok(begin>=0&&finish>begin,'Effective private wallpaper resolver must exist');
const resolver=source.slice(begin,finish);
const owner='11111111-1111-4111-8111-111111111111';
const other='22222222-2222-4222-8222-222222222222';
const ref='kinfolk-wallpapers:'+owner+'/profile-wallpaper-12345.mp4';

function deferred(){
  let resolve,reject;
  const promise=new Promise((yes,no)=>{resolve=yes;reject=no});
  return {promise,resolve,reject};
}
function harness({signWait,signResult}={}){
  const calls={sign:[],auth:0};
  const state={user:{id:owner}};
  let token='token-A',clock=1000;
  const window={};
  const sb={
    auth:{getSession:async()=>{
      calls.auth++;
      return {data:{session:{user:{id:state.user.id},access_token:token}},error:null};
    }},
    storage:{from:bucket=>{
      assert.equal(bucket,'kinfolk-wallpapers');
      return {createSignedUrl:(path,ttl)=>{
        calls.sign.push({path,ttl});
        return signWait?signWait.promise:Promise.resolve(signResult||{
          data:{signedUrl:'https://alpha.invalid/storage/sign/'+path+'?token=short'},error:null
        });
      }};
    }}
  };
  vm.runInNewContext(resolver,{window,state,sb,Date:{now:()=>clock}},{timeout:1000});
  return {resolve:window.resolveKinfolkWallpaper,state,calls,
    setToken:v=>{token=v},advance:ms=>{clock+=ms}};
}
async function tick(){await new Promise(resolve=>setImmediate(resolve))}

test('private reference signs for 300 seconds and caches only within safe renewal window',async()=>{
  const h=harness();
  const url=await h.resolve(ref,owner);
  assert.match(url,/https:\/\/alpha\.invalid\/storage\/sign\//);
  assert.equal(h.calls.sign.length,1);
  assert.equal(h.calls.sign[0].path,owner+'/profile-wallpaper-12345.mp4');
  assert.equal(h.calls.sign[0].ttl,300);
  assert.equal(await h.resolve(ref,owner),url);
  assert.equal(h.calls.sign.length,1,'re-render must not re-sign each mutation');
  h.advance(240001);
  assert.equal(await h.resolve(ref,owner),url);
  assert.equal(h.calls.sign.length,2,'renew before signed URL expires');
});

test('foreign, malformed and traversal references never reach storage',async()=>{
  const h=harness();
  for(const bad of [
    'kinfolk-wallpapers:'+other+'/profile-wallpaper-12345.mp4',
    'kinfolk-wallpapers:'+owner+'/../profile-wallpaper-12345.mp4',
    'kinfolk-wallpapers:'+owner+'/evil.mp4',
    'kinfolk-wallpapers:'+owner+'/profile-wallpaper-1.svg',
    'kinfolk-wallpapers:'+owner+'/profile-wallpaper-1.mp4?token=leak'
  ])assert.equal(await h.resolve(bad,owner),'');
  assert.equal(h.calls.sign.length,0);
});

test('switching accounts during signing never displays the previous owner wallpaper',async()=>{
  const wait=deferred(),h=harness({signWait:wait});
  const pending=h.resolve(ref,owner);
  await tick();
  assert.equal(h.calls.sign.length,1);
  h.state.user={id:other};
  wait.resolve({data:{signedUrl:'https://alpha.invalid/old-owner'},error:null});
  assert.equal(await pending,'');
});

test('replacing the same account Auth token during signing fails closed',async()=>{
  const wait=deferred(),h=harness({signWait:wait});
  const pending=h.resolve(ref,owner);
  await tick();
  h.setToken('token-B');
  wait.resolve({data:{signedUrl:'https://alpha.invalid/stale-token'},error:null});
  assert.equal(await pending,'');
});

test('simultaneous profile and Settings renders share one in-flight signature',async()=>{
  const wait=deferred(),h=harness({signWait:wait});
  const first=h.resolve(ref,owner),second=h.resolve(ref,owner);
  await tick();
  assert.equal(h.calls.sign.length,1);
  wait.resolve({data:{signedUrl:'https://alpha.invalid/short'},error:null});
  assert.equal(await first,'https://alpha.invalid/short');
  assert.equal(await second,'https://alpha.invalid/short');
});

test('failed signatures do not cache false success and can retry',async()=>{
  const h=harness({signResult:{data:null,error:{message:'denied'}}});
  assert.equal(await h.resolve(ref,owner),'');
  assert.equal(await h.resolve(ref,owner),'');
  assert.equal(h.calls.sign.length,2);
});

test('external HTTPS and legacy signed URLs remain usable; executable schemes are rejected',async()=>{
  const h=harness();
  assert.equal(await h.resolve('https://example.invalid/user-wallpaper.gif',owner),
    'https://example.invalid/user-wallpaper.gif');
  assert.equal(await h.resolve('https://alpha.invalid/storage/object/sign/old.png?token=old',owner),
    'https://alpha.invalid/storage/object/sign/old.png?token=old');
  assert.equal(await h.resolve('javascript:alert(1)',owner),'');
  assert.equal(h.calls.sign.length,0);
});

test('both effective profile wallpaper renderers resolve private refs before display',()=>{
  assert.match(source,/const url=await window\.resolveKinfolkWallpaper\(reference,accountId\)/);
  assert.match(source,/if\(request!==wallpaperRequest\|\|state\?\.user\?\.id!==accountId\)return;const route=/);
  assert.match(source,/wallpaper=await window\.resolveKinfolkWallpaper\(safe\.animated_wallpaper_url\|\|'',uid\)/);
  assert.match(source,/if\(window\.state\?\.user\?\.id!==uid\|\|root\.isConnected===false\)return/);
  assert.doesNotMatch(source,/createSignedUrl\(path,31536000\)/);
});
