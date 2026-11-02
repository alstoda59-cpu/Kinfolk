import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../kinfolk-phase76.js',import.meta.url),'utf8');
const migration=readFileSync(new URL('../migrations/ALPHA_only_wallpaper_bucket_owner_rls.sql',import.meta.url),'utf8');
const start=source.indexOf('window.uploadKinfolkWallpaper=async function(input){');
const end=source.indexOf('\nconst oldOpen=window.openKinfolkSettings;',start);
assert.ok(start>=0&&end>start,'Effective Phase76 wallpaper uploader must be found');
const handler=source.slice(start,end);

function deferred(){
  let resolve,reject;
  const promise=new Promise((yes,no)=>{resolve=yes;reject=no});
  return {promise,resolve,reject};
}
function harness({uploadWait,signWait,saveWait}={}){
  const calls={upload:[],sign:[],save:[],toast:[],session:0};
  const state={user:{id:'11111111-1111-4111-8111-111111111111'}};
  let token='token-A';
  const meta={textContent:''},fill={style:{width:''}},bar={style:{}};
  const btn={disabled:false,textContent:'Choose from phone'};
  const box={querySelector:selector=>({
    '.kfwUploadMeta':meta,'.kfwProgress':bar,'.kfwUploadBtn':btn
  })[selector]||null};
  bar.querySelector=selector=>selector==='i'?fill:null;
  const input={isConnected:true,files:[{type:'image/png',size:1024,name:'wallpaper.png'}],closest:()=>box};
  const urlBox={value:''},motion={checked:false};
  const window={};
  const sb={
    auth:{getSession:async()=>{calls.session++;return {data:{session:{user:{id:state.user.id},access_token:token}},error:null}}},
    storage:{from:bucket=>{
      assert.equal(bucket,'kinfolk-wallpapers');
      return {
        upload:async(path,file,opts)=>{
          calls.upload.push({path,file,opts});
          return uploadWait?await uploadWait.promise:{error:null};
        },
        createSignedUrl:async(path,ttl)=>{
          calls.sign.push({path,ttl});
          return signWait?await signWait.promise:{data:{signedUrl:'https://alpha.invalid/signed-wallpaper'},error:null};
        }
      };
    }},
    from:table=>{
      assert.equal(table,'kinfolk_safety_settings');
      return {upsert:async(row,opts)=>{
        calls.save.push({row,opts});
        return saveWait?await saveWait.promise:{error:null};
      }};
    }
  };
  const context={window,state,sb,document:{getElementById:id=>({
    kfsAnimatedUrl:urlBox,kfsMotion:motion
  })[id]||null},toast:(...args)=>calls.toast.push(args),
  validTypes:new Set(['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm']),
  extFor:()=> 'png',Date};
  vm.runInNewContext(handler,context,{timeout:1000});
  return {upload:window.uploadKinfolkWallpaper,window,state,input,calls,meta,fill,btn,urlBox,motion,
    setToken:v=>{token=v}};
}
async function tick(){await new Promise(resolve=>setImmediate(resolve))}

test('isolated wallpaper bucket is private, 15MB and restricts MIME types',()=>{
  assert.match(migration,/kinfolk-wallpapers/);
  assert.match(migration,/false,15728640/);
  for(const mime of ['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm'])
    assert.ok(migration.includes(mime));
  assert.match(migration,/create policy kinfolk_alpha_wallpaper_owner_upload/i);
  assert.match(migration,/create policy kinfolk_alpha_wallpaper_owner_read/i);
  assert.match(migration,/create policy kinfolk_alpha_wallpaper_owner_delete/i);
  assert.match(migration,/\(storage\.foldername\(name\)\)\[1\]=\(select auth\.uid\(\)\)::text/);
  assert.doesNotMatch(migration,/for (?:insert|select|delete) to (?:anon|public)/i);
});

test('owner upload saves only the initiating user and updates its own form',async()=>{
  const h=harness();
  await h.upload(h.input);
  assert.equal(h.calls.upload.length,1);
  assert.match(h.calls.upload[0].path,/^11111111-1111-4111-8111-111111111111\/profile-wallpaper-\d+\.png$/);
  assert.equal(h.calls.save.length,1);
  assert.equal(h.calls.save[0].row.user_id,h.state.user.id);
  assert.equal(h.urlBox.value,'https://alpha.invalid/signed-wallpaper');
  assert.equal(h.motion.checked,true);
  assert.equal(h.btn.disabled,false);
  assert.equal(h.calls.toast.at(-1)[0],'Wallpaper uploaded');
});

test('duplicate upload is rejected while first storage request is pending',async()=>{
  const wait=deferred(),h=harness({uploadWait:wait});
  const first=h.upload(h.input);
  await tick();
  await h.upload(h.input);
  assert.equal(h.calls.upload.length,1);
  assert.match(h.calls.toast.at(-1)[0],/already finishing/);
  wait.resolve({error:null});
  await first;
  assert.equal(h.calls.save.length,1);
});

test('account switch during storage upload cannot save wallpaper into another account',async()=>{
  const wait=deferred(),h=harness({uploadWait:wait});
  const first=h.upload(h.input);
  await tick();
  h.state.user={id:'22222222-2222-4222-8222-222222222222'};
  wait.resolve({error:null});
  await first;
  assert.equal(h.calls.sign.length,0);
  assert.equal(h.calls.save.length,0);
  assert.equal(h.urlBox.value,'');
});

test('same-user token replacement invalidates an in-flight upload',async()=>{
  const wait=deferred(),h=harness({uploadWait:wait});
  const first=h.upload(h.input);
  await tick();
  h.setToken('token-new-session');
  wait.resolve({error:null});
  await first;
  assert.equal(h.calls.save.length,0);
});

test('account switch while signing the uploaded object prevents database save',async()=>{
  const wait=deferred(),h=harness({signWait:wait});
  const first=h.upload(h.input);
  await tick();
  assert.equal(h.calls.sign.length,1);
  h.state.user={id:'22222222-2222-4222-8222-222222222222'};
  wait.resolve({data:{signedUrl:'https://alpha.invalid/old-account'},error:null});
  await first;
  assert.equal(h.calls.save.length,0);
});

test('account switch during database save never updates the new account UI',async()=>{
  const wait=deferred(),h=harness({saveWait:wait});
  const first=h.upload(h.input);
  await tick();
  assert.equal(h.calls.save.length,1);
  h.state.user={id:'22222222-2222-4222-8222-222222222222'};
  wait.resolve({error:null});
  await first;
  assert.equal(h.calls.save[0].row.user_id,'11111111-1111-4111-8111-111111111111');
  assert.equal(h.urlBox.value,'');
  assert.equal(h.motion.checked,false);
});

test('invalid file and oversize file fail before any storage operation',async()=>{
  const h=harness();
  h.input.files[0].type='text/html';
  await h.upload(h.input);
  h.input.files[0].type='image/png';
  h.input.files[0].size=16*1024*1024;
  await h.upload(h.input);
  assert.equal(h.calls.upload.length,0);
  assert.equal(h.calls.save.length,0);
});

test('disconnected composer fails closed after Auth preflight',async()=>{
  const h=harness();
  h.input.isConnected=false;
  await h.upload(h.input);
  assert.equal(h.calls.upload.length,0);
  assert.equal(h.calls.save.length,0);
});
