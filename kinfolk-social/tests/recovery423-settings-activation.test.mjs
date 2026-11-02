import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../kinfolk-phase76.js',import.meta.url),'utf8');
const start=source.indexOf("$('#kfsForm').onsubmit=async e=>{");
const end=source.indexOf("toast('Profile and settings saved','good')}};",start);
assert.ok(start>=0&&end>start,'effective Phase76 Settings submit handler exists');
const handler=source.slice(start+"$('#kfsForm').onsubmit=".length,
  end+"toast('Profile and settings saved','good')}".length);
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';

function harness(){
  const writes=[],toasts=[],themes=[];
  let closes=0,renders=0;
  const state={user:{id:A},profile:null,profiles:new Map()};
  const el={isConnected:true};
  const controls=new Map();
  const $=selector=>{
    if(!controls.has(selector))controls.set(selector,{value:'',checked:false,disabled:false,textContent:''});
    return controls.get(selector);
  };
  $('#kfsAccentText').value='#e85a9b';
  const ctx={
    state,el,settingsAccountId:A,settingsEpoch:9,kf129Epoch:9,isTeen:false,$,
    t:$('#kfsAccentText'),refreshWallpaper:()=>{},
    settingsCurrent:()=>state.user?.id===A&&ctx.kf129Epoch===9,
    toast:(message,kind)=>toasts.push({message,kind}),
    theme:color=>themes.push(color),
    closeKinfolkSettings:()=>{closes++},
    renderApp:async()=>{renders++},
    setTimeout:()=>{},
    sb:{from:table=>({
      update:payload=>({eq:(_field,_id)=>({select:()=>({single:()=>write(table,payload)})})}),
      upsert:(payload,_options)=>write(table,payload)
    })}
  };
  function write(table,payload){
    let resolve;
    const promise=new Promise(r=>{resolve=r});
    writes.push({table,payload,resolve});
    return promise;
  }
  const submit=vm.runInNewContext('('+handler+')',ctx,{timeout:1000});
  const complete=()=>{for(const write of writes)write.resolve({
    data:{id:A,accent_color:'#e85a9b'},error:null
  })};
  return {ctx,state,el,writes,toasts,themes,$,submit,complete,
    get closes(){return closes},get renders(){return renders}};
}
const event=()=>({preventDefault(){}});
test('same-account reactivation before Settings submit cannot write stale preferences',async()=>{
  const h=harness();h.ctx.kf129Epoch++;
  await h.submit(event());
  assert.equal(h.writes.length,0);
  assert.match(h.toasts.at(-1).message,/session changed/);
});
test('account switch before Settings submit cannot write previous account preferences',async()=>{
  const h=harness();h.state.user={id:B};
  await h.submit(event());
  assert.equal(h.writes.length,0);
});
test('Settings save ignores delayed writes after same-account relogin',async()=>{
  const h=harness(),pending=h.submit(event());
  assert.equal(h.writes.length,6);
  h.ctx.kf129Epoch++;
  h.complete();await pending;
  assert.equal(h.closes,0);
  assert.equal(h.renders,0);
  assert.equal(h.themes.length,0);
  assert.equal(h.toasts.filter(x=>x.kind==='good').length,0);
});
test('Settings save ignores delayed writes after screen replacement',async()=>{
  const h=harness(),pending=h.submit(event());
  h.el.isConnected=false;
  h.complete();await pending;
  assert.equal(h.closes,0);
  assert.equal(h.renders,0);
});
test('duplicate Settings submissions do not issue another batch of writes',async()=>{
  const h=harness(),first=h.submit(event()),second=h.submit(event());
  assert.equal(h.writes.length,6);
  h.complete();await Promise.all([first,second]);
  assert.equal(h.closes,1);
  assert.equal(h.renders,1);
  assert.equal(h.toasts.filter(x=>x.kind==='good').length,1);
});
test('Settings hydration checks activation epoch before mounting stale screen',()=>{
  assert.match(source,/const settingsEpoch=typeof kf129Epoch==='number'\?kf129Epoch:null/);
  assert.match(source,/if\(!settingsCurrent\(\)\)return;closeKinfolkSettings\(\)/);
  assert.match(source,/if\(!settingsCurrent\(\)\|\|el\.isConnected===false\)return;const er=/);
});
