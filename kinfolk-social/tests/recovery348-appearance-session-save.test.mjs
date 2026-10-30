import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(path.join(root,'kinfolk-phase81.js'),'utf8');
const start=source.indexOf('  // Recovery348: appearance saves belong');
const end=source.indexOf('  async function mountAppearance(){',start);
assert.ok(start>=0&&end>start,'effective Phase81 appearance handlers are present');
const code=source.slice(start,end);
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';

function deferred(){
  let resolve;
  const promise=new Promise(r=>{resolve=r});
  return {promise,resolve};
}
function harness(){
  const writes=[],messages=[],themes=[],timers=[];
  let stops=0,ensures=0;
  const sheet={contains:card=>card.sheet===sheet&&card.isConnected!==false};
  const card={sheet,isConnected:true,controls:{
    '.kf81Color':{value:'#e85a9b'},
    '.kf81ColorText':{value:'#aabbcc'},
    '.kf81MusicUrl':{value:'https://example.test/song.mp3'},
    '[data-kf81-save-color]':{disabled:false,textContent:'Save color'},
    '[data-kf81-save-music]':{disabled:false,textContent:'Save music'}
  }};
  const ctx={
    state:{user:{id:A},view:'profile',profile:{id:A},profiles:new Map()},
    kf129Epoch:7,
    document:{
      getElementById:id=>id==='kf78-sheet'?sheet:null,
      documentElement:{style:{setProperty:(...args)=>themes.push(['css',...args])}},
      querySelector:()=>({style:{setProperty:(...args)=>themes.push(['profile',...args])}})
    },
    window:{applyKinfolkTheme:color=>themes.push(['theme',color])},
    $q:(selector,el)=>el.controls[selector],
    hexOk:value=>/^#[0-9a-fA-F]{6}$/.test(value||''),
    setMsg:(el,message,good)=>messages.push({el,message,good:!!good}),
    stopMusic:()=>{stops++},
    ensureMusic:()=>{ensures++},
    setTimeout:fn=>{timers.push(fn);return timers.length},
    sb:{from:table=>({
      update:payload=>({eq:(field,id)=>({select:columns=>({single:()=>{
        const d=deferred();writes.push({table,kind:'update',payload,field,id,columns,...d});return d.promise;
      }})})}),
      upsert:(payload,options)=>({select:columns=>({single:()=>{
        const d=deferred();writes.push({table,kind:'upsert',payload,options,columns,...d});return d.promise;
      }})})
    })}
  };
  const api=vm.runInNewContext(code+';({saveColor,saveMusic,appearanceCurrent})',ctx,{timeout:1000});
  return {api,ctx,card,writes,messages,themes,timers,
    get stops(){return stops},get ensures(){return ensures}};
}
function colorButton(h){return h.card.controls['[data-kf81-save-color]']}
function musicButton(h){return h.card.controls['[data-kf81-save-music]']}
function colorResult(id=A,color='#aabbcc'){return {data:{id,accent_color:color},error:null}}
function extrasResult(id=A,url='https://example.test/song.mp3'){return {data:{user_id:id,music_url:url},error:null}}
function musicResult(id=A,url='https://example.test/song.mp3'){return {data:{id,profile_music_url:url},error:null}}

test('color save confirms matching row before applying theme or success',async()=>{
  const h=harness(),pending=h.api.saveColor(h.card);
  assert.equal(h.writes.length,1);
  assert.equal(h.writes[0].id,A);
  assert.equal(colorButton(h).disabled,true);
  assert.equal(h.themes.length,0);
  h.writes[0].resolve(colorResult());await pending;
  assert.equal(h.messages.at(-1).good,true);
  assert.equal(h.ctx.state.profile.accent_color,'#aabbcc');
  assert.ok(h.themes.some(x=>x[0]==='theme'));
  assert.equal(colorButton(h).disabled,false);
});
test('color update returning another account never changes the local theme',async()=>{
  const h=harness(),pending=h.api.saveColor(h.card);
  h.writes[0].resolve(colorResult(B));await pending;
  assert.equal(h.themes.length,0);
  assert.equal(h.messages.at(-1).good,false);
  assert.match(h.messages.at(-1).message,/could not be confirmed/);
});
test('color update returning a different value cannot claim success',async()=>{
  const h=harness(),pending=h.api.saveColor(h.card);
  h.writes[0].resolve(colorResult(A,'#ffffff'));await pending;
  assert.equal(h.themes.length,0);
  assert.equal(h.messages.at(-1).good,false);
});
test('duplicate color taps issue exactly one write',async()=>{
  const h=harness(),first=h.api.saveColor(h.card),second=h.api.saveColor(h.card);
  assert.equal(h.writes.length,1);
  h.writes[0].resolve(colorResult());await Promise.all([first,second]);
});
test('color response after same-user relogin cannot apply stale theme',async()=>{
  const h=harness(),pending=h.api.saveColor(h.card);
  h.ctx.kf129Epoch++;
  h.writes[0].resolve(colorResult());await pending;
  assert.equal(h.themes.length,0);
  assert.equal(h.messages.length,0);
});
test('color response after settings card is replaced is ignored',async()=>{
  const h=harness(),pending=h.api.saveColor(h.card);
  h.card.isConnected=false;
  h.writes[0].resolve(colorResult());await pending;
  assert.equal(h.themes.length,0);
  assert.equal(h.messages.length,0);
});
test('music write waits for confirmed extras before updating public profile',async()=>{
  const h=harness(),pending=h.api.saveMusic(h.card);
  assert.equal(h.writes.length,1);
  assert.equal(h.writes[0].table,'kinfolk_profile_extras');
  assert.equal(h.writes[0].payload.user_id,A);
  h.writes[0].resolve(extrasResult());
  await Promise.resolve();
  assert.equal(h.writes.length,2);
  assert.equal(h.writes[1].table,'profiles');
  assert.equal(h.writes[1].id,A);
  h.writes[1].resolve(musicResult());await pending;
  assert.equal(h.messages.at(-1).good,true);
  assert.equal(h.stops,1);
  assert.equal(musicButton(h).disabled,false);
  for(const fn of h.timers)fn();
  assert.equal(h.ensures,1);
});
test('failed extras write never triggers public profile update',async()=>{
  const h=harness(),pending=h.api.saveMusic(h.card);
  h.writes[0].resolve({data:null,error:{message:'RLS denied'}});await pending;
  assert.equal(h.writes.length,1);
  assert.equal(h.messages.at(-1).message,'RLS denied');
  assert.equal(h.stops,0);
  assert.equal(musicButton(h).disabled,false);
});
test('mismatched extras row never triggers public profile update',async()=>{
  const h=harness(),pending=h.api.saveMusic(h.card);
  h.writes[0].resolve(extrasResult(B));await pending;
  assert.equal(h.writes.length,1);
  assert.equal(h.messages.at(-1).good,false);
});
test('music save stops after account switch before second write',async()=>{
  const h=harness(),pending=h.api.saveMusic(h.card);
  h.ctx.state.user={id:B};
  h.writes[0].resolve(extrasResult());await pending;
  assert.equal(h.writes.length,1);
  assert.equal(h.messages.length,0);
  assert.equal(h.stops,0);
});
test('music save stops after same-user session epoch changes',async()=>{
  const h=harness(),pending=h.api.saveMusic(h.card);
  h.ctx.kf129Epoch++;
  h.writes[0].resolve(extrasResult());await pending;
  assert.equal(h.writes.length,1);
  assert.equal(h.stops,0);
});
test('duplicate music taps do not overlap private preference writes',async()=>{
  const h=harness(),first=h.api.saveMusic(h.card),second=h.api.saveMusic(h.card);
  assert.equal(h.writes.length,1);
  h.writes[0].resolve(extrasResult());await Promise.resolve();
  h.writes[1].resolve(musicResult());await Promise.all([first,second]);
  assert.equal(h.writes.length,2);
});
test('unconfirmed profile music write never claims success or restarts audio',async()=>{
  const h=harness(),pending=h.api.saveMusic(h.card);
  h.writes[0].resolve(extrasResult());await Promise.resolve();
  h.writes[1].resolve(musicResult(B));await pending;
  assert.equal(h.messages.at(-1).good,false);
  assert.equal(h.stops,0);
});
test('music restart timer cannot affect a replacement account session',async()=>{
  const h=harness(),pending=h.api.saveMusic(h.card);
  h.writes[0].resolve(extrasResult());await Promise.resolve();
  h.writes[1].resolve(musicResult());await pending;
  h.ctx.kf129Epoch++;
  for(const fn of h.timers)fn();
  assert.equal(h.ensures,0);
});
test('invalid music URL is rejected before any backend write',async()=>{
  const h=harness();h.card.controls['.kf81MusicUrl'].value='javascript:alert(1)';
  await h.api.saveMusic(h.card);
  assert.equal(h.writes.length,0);
  assert.match(h.messages.at(-1).message,/https:\/\//);
});
