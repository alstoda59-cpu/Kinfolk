import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(path.join(root,'kinfolk-phase81.js'),'utf8');
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const color='#aabbcc';
function section(start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a);
  assert.ok(a>=0&&b>a,'effective Phase81 section exists: '+start);
  return source.slice(a,b);
}
function deferred(){
  let resolve,reject;
  const promise=new Promise((yes,no)=>{resolve=yes;reject=no});
  return {promise,resolve,reject};
}
const hydrateCode=section('  async function loadOwnAppearance(){','  function setMsg(');
function hydration(response={data:{music_url:null},error:null}){
  const reads=[];
  const ctx={
    state:{user:{id:A},profile:{id:A,profile_music_url:'https://example.test/old.mp3'},profiles:new Map()},
    kf129Epoch:9,
    sb:{from(table){
      reads.push(table);
      assert.equal(table,'kinfolk_profile_extras');
      return {select(columns){
        assert.equal(columns,'music_url');
        return {eq(field,id){
          assert.equal(field,'user_id');assert.equal(id,A);
          return {maybeSingle:()=>response};
        }};
      }};
    }}
  };
  return {ctx,reads,load:vm.runInNewContext(hydrateCode+';loadOwnAppearance',ctx,{timeout:1000})};
}

test('settings hydration returns owner extras and matching owner profile',async()=>{
  const h=hydration();
  const result=await h.load();
  assert.equal(result.userId,A);
  assert.equal(result.epoch,9);
  assert.equal(result.profile.id,A);
  assert.equal(result.extra.music_url,null);
  assert.deepEqual(h.reads,['kinfolk_profile_extras']);
});
test('settings hydration never takes another member profile from state.profile',async()=>{
  const h=hydration();
  h.ctx.state.profile={id:B,profile_music_url:'https://example.test/other.mp3'};
  h.ctx.state.profiles.set(A,{id:A,accent_color:color});
  const result=await h.load();
  assert.equal(result.profile.id,A);
  assert.equal(result.profile.accent_color,color);
});
test('settings hydration falls back to empty owner profile rather than another member',async()=>{
  const h=hydration();
  h.ctx.state.profile={id:B,accent_color:'#000000'};
  assert.equal(Object.keys((await h.load()).profile).length,0);
});
test('same-account reactivation invalidates pending settings hydration',async()=>{
  const d=deferred(),h=hydration(d.promise);
  const pending=h.load();
  h.ctx.kf129Epoch++;
  d.resolve({data:{music_url:'https://example.test/stale.mp3'},error:null});
  assert.equal(await pending,null);
});
test('account switch invalidates pending settings hydration',async()=>{
  const d=deferred(),h=hydration(d.promise);
  const pending=h.load();
  h.ctx.state.user={id:B};
  d.resolve({data:{music_url:null},error:null});
  assert.equal(await pending,null);
});
test('failed private extras read does not break current owner settings',async()=>{
  const h=hydration(Promise.reject(new Error('offline')));
  const result=await h.load();
  assert.equal(result.userId,A);
  assert.equal(Object.keys(result.extra).length,0);
});
test('mount refuses stale same-user hydration after relogin',async()=>{
  const code=section('  async function mountAppearance(){',"  document.addEventListener('submit',e=>{");
  const d=deferred();
  let inserts=0;
  const sheet={querySelector:()=>null};
  const safetyBox={insertAdjacentElement:()=>{inserts++}};
  const ctx={
    state:{user:{id:A}},
    kf129Epoch:9,
    loadOwnAppearance:()=>d.promise,
    document:{getElementById:id=>id==='kf78-sheet'?sheet:id==='kf78-safety'?safetyBox:null}
  };
  const mount=vm.runInNewContext(code+';mountAppearance',ctx,{timeout:1000});
  const pending=mount();
  ctx.kf129Epoch++;
  d.resolve({userId:A,epoch:9,profile:{id:A},extra:{}});
  await pending;
  assert.equal(inserts,0);
});
const legacyCode=section("  document.addEventListener('submit',e=>{",'\n  let musicKey=');
function legacy(){
  const d=deferred(),themes=[],writes=[];
  const form={id:'kfsForm',isConnected:true};
  const controls={kfsAccentText:{value:color},kfsAccent:{value:'#ffffff'}};
  let submit;
  const ctx={
    state:{user:{id:A},profile:{id:A},profiles:new Map()},
    kf129Epoch:9,
    hexOk:v=>/^#[0-9a-fA-F]{6}$/.test(v),
    document:{
      addEventListener:(type,fn,capture)=>{assert.equal(type,'submit');assert.equal(capture,true);submit=fn},
      getElementById:id=>id==='kfsForm'?form:controls[id]||null
    },
    window:{applyKinfolkTheme:c=>themes.push(c)},
    sb:{from(table){
      assert.equal(table,'profiles');
      return {update:payload=>{
        writes.push(payload);
        return {eq:(field,id)=>{
          assert.equal(field,'id');assert.equal(id,A);
          return {select:()=>({single:()=>d.promise})};
        }};
      }};
    }}
  };
  vm.runInNewContext(legacyCode,ctx,{timeout:1000});
  return {ctx,form,d,themes,writes,submit:()=>submit({target:form})};
}
async function settle(){await Promise.resolve();await Promise.resolve();}
test('legacy color save applies only a confirmed owner row',async()=>{
  const h=legacy();h.submit();
  assert.equal(h.writes.length,1);
  h.d.resolve({data:{id:A,accent_color:color},error:null});await settle();
  assert.deepEqual(h.themes,[color]);
  assert.equal(h.ctx.state.profile.accent_color,color);
});
test('legacy color save ignores same-user reactivation during write',async()=>{
  const h=legacy();h.submit();h.ctx.kf129Epoch++;
  h.d.resolve({data:{id:A,accent_color:color},error:null});await settle();
  assert.deepEqual(h.themes,[]);
});
test('legacy color save ignores account switches during write',async()=>{
  const h=legacy();h.submit();h.ctx.state.user={id:B};
  h.d.resolve({data:{id:A,accent_color:color},error:null});await settle();
  assert.deepEqual(h.themes,[]);
});
test('legacy color save ignores replaced settings form',async()=>{
  const h=legacy();h.submit();h.form.isConnected=false;
  h.d.resolve({data:{id:A,accent_color:color},error:null});await settle();
  assert.deepEqual(h.themes,[]);
});
test('legacy color save ignores mismatched or unconfirmed rows',async()=>{
  const h=legacy();h.submit();
  h.d.resolve({data:{id:B,accent_color:color},error:null});await settle();
  assert.deepEqual(h.themes,[]);
});
test('legacy color save ignores backend-adjusted color',async()=>{
  const h=legacy();h.submit();
  h.d.resolve({data:{id:A,accent_color:'#ffffff'},error:null});await settle();
  assert.deepEqual(h.themes,[]);
});
