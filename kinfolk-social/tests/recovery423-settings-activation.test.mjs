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
    let resolve,reject;
    const promise=new Promise((r,j)=>{resolve=r;reject=j});
    writes.push({table,payload,resolve,reject});
    return promise;
  }
  const submit=vm.runInNewContext('('+handler+')',ctx,{timeout:1000});
  const complete=(overrides={})=>{for(const [i,write] of writes.entries())write.resolve(Object.prototype.hasOwnProperty.call(overrides,i)?overrides[i]:{
    data:{id:A,accent_color:'#e85a9b'},error:null,count:1
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

test('Settings requests exact counts for profile update and five preference upserts',()=>{
  const handler=source.slice(start,end);
  assert.match(handler,/accent_color:c\},\{count:'exact'\}\)\.eq\('id',settingsAccountId\)/);
  assert.equal(handler.split("{onConflict:'user_id',count:'exact'}").length-1,5);
});
test('all six Settings writes require an exact one-row acknowledgment',async()=>{
  for(let i=0;i<6;i++){
    const h=harness(),pending=h.submit(event());
    h.complete({[i]:{data:{id:A,accent_color:'#e85a9b'},error:null}});
    await pending;
    assert.equal(h.closes,0,'unconfirmed table index '+i);
    assert.equal(h.renders,0);
    assert.equal(h.$('#kfsSave').disabled,false);
    assert.match(h.toasts.at(-1).message,/could not be confirmed/);
  }
});
test('zero or multiple Settings rows cannot report success',async()=>{
  for(const count of [0,2]){
    const h=harness(),pending=h.submit(event());
    h.complete({2:{data:{id:A},error:null,count}});
    await pending;
    assert.equal(h.closes,0);
    assert.equal(h.toasts.filter(x=>x.kind==='good').length,0);
  }
});
test('profile update returning a foreign account cannot overwrite active profile',async()=>{
  const h=harness(),pending=h.submit(event());
  h.complete({0:{data:{id:B},error:null,count:1}});
  await pending;
  assert.equal(h.state.profile,null);
  assert.equal(h.closes,0);
  assert.equal(h.toasts.filter(x=>x.kind==='good').length,0);
});
test('rejected Settings write restores the Save button without false success',async()=>{
  const h=harness(),pending=h.submit(event());
  h.writes[0].reject(new Error('Connection lost'));
  for(const w of h.writes.slice(1))w.resolve({data:{id:A},error:null,count:1});
  await pending;
  assert.equal(h.$('#kfsSave').disabled,false);
  assert.equal(h.$('#kfsSave').textContent,'Save changes');
  assert.equal(h.closes,0);
  assert.match(h.toasts.at(-1).message,/Unable to confirm Settings save/);
});
test('late rejection after account reactivation cannot show an old-session toast',async()=>{
  const h=harness(),pending=h.submit(event());
  h.ctx.kf129Epoch++;
  h.writes[0].reject(new Error('Connection lost'));
  for(const w of h.writes.slice(1))w.resolve({data:{id:A},error:null,count:1});
  await pending;
  assert.equal(h.toasts.length,0);
  assert.equal(h.closes,0);
});

test('missing Supabase response fails closed rather than crashing or claiming success',async()=>{
  const h=harness(),pending=h.submit(event());
  h.complete({4:null});
  await pending;
  assert.equal(h.closes,0);
  assert.equal(h.$('#kfsSave').disabled,false);
  assert.match(h.toasts.at(-1).message,/could not be confirmed/);
});

test('Settings success is suppressed when account activation changes during app refresh',async()=>{
  const h=harness();
  let finishRender;
  h.ctx.renderApp=()=>new Promise(resolve=>{finishRender=resolve});
  const pending=h.submit(event());
  h.complete();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(typeof finishRender,'function','refresh began after confirmed writes');
  h.ctx.kf129Epoch++;
  finishRender();
  await pending;
  assert.equal(h.toasts.filter(x=>x.kind==='good').length,0);
  assert.equal(h.renders,0);
});
test('confirmed Settings save reports a screen refresh failure without claiming data was lost',async()=>{
  const h=harness();
  h.ctx.renderApp=async()=>{throw new Error('UI refresh failed')};
  const pending=h.submit(event());
  h.complete();
  await pending;
  assert.equal(h.closes,1);
  assert.equal(h.state.profile.id,A);
  assert.equal(h.toasts.filter(x=>x.kind==='good').length,0);
  assert.match(h.toasts.at(-1).message,/Settings saved, but the screen could not refresh/);
});
test('late refresh rejection from an old activation cannot notify a different session',async()=>{
  const h=harness();
  let rejectRender;
  h.ctx.renderApp=()=>new Promise((_resolve,reject)=>{rejectRender=reject});
  const pending=h.submit(event());
  h.complete();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(typeof rejectRender,'function');
  h.state.user={id:B};
  rejectRender(new Error('stale render'));
  await pending;
  assert.equal(h.toasts.length,0);
});
test('post-render Settings success checks the original activation again',()=>{
  const body=source.slice(start,end);
  assert.match(body,/try\{await renderApp\(\)\}catch\(_error\)/);
  assert.match(body,/if\(!settingsCurrent\(\)\)return;setTimeout\(refreshWallpaper,80\);toast\('Profile and settings saved','good'\)/);
});
