import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('function kf316ClearPreviousAccount(){');
const end=html.indexOf('window.kf129ActivateSession=kf129ActivateSession;',start);
assert.ok(start>0&&end>start,'use the committed account-switch cleanup and activation');
const source=html.slice(start,end);
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}};

function harness({oldUid=A,hydrate}={}){
  const calls={music:0,reels:0,settings:0,modal:0,overlays:[],auth:[]};
  const state={
    user:oldUid?{id:oldUid}:null,profile:{id:A},extras:{user_id:A},
    feed:[{author_id:A}],videos:[{owner_id:A}],stories:[{user_id:A}],
    notifications:[{user_id:A}],channels:[{owner_id:A}],friendRequests:[{user_id:A}],
    likes:new Map([['old',true]]),comments:new Map([['old',[]]]),
    subscriptions:new Map([['old',true]]),profiles:new Map([[A,{id:A}]]),
    signed:new Map([['private-old','https://example.invalid/old']]),
    view:'profile',profileViewId:A,profileTab:'media',channelViewId:'old',channelTab:'about',busy:true
  };
  const app={innerHTML:'previous member view'};
  const root={replaceChildren(){calls.modal++}};
  const document={
    body:{style:{overflow:'hidden'}},
    getElementById(id){
      if(id==='modalRoot')return root;
      if(['kf78-overlay','kf115-delete-overlay'].includes(id))return {remove(){calls.overlays.push(id)}};
      return null;
    },
    querySelector:()=>null
  };
  const window={
    closeKinfolkSettings(){calls.settings++},
    kf159StopReels(){calls.reels++},
    kf81StopProfileMusic(){calls.music++},
    _kinfolkSuggestionHidden:new Set(['old-hidden'])
  };
  const context={
    state,window,document,sessionStorage:{removeItem(){}},
    kf129Epoch:0,kf129ReadyUid:null,kf129InFlight:null,
    $:()=>app,
    kf129Timeout:async promise=>promise,
    hydrateUser:hydrate|| (async()=>true),
    loadCore:async()=>true,renderApp:async()=>true,
    renderAuth:mode=>calls.auth.push(mode),
    console:{error(){},warn(){}},
    kf129Error(){throw new Error('unexpected startup error')}
  };
  const activate=vm.runInNewContext(source+';kf129ActivateSession',context);
  return {activate,context,state,window,calls,app};
}

test('switching accounts clears every cached private content lane before hydration',async()=>{
  let observed;
  const h=harness({hydrate:async()=>{observed={
    user:h.state.user?.id,feed:h.state.feed.length,privateUrls:h.state.signed.size,
    notifications:h.state.notifications.length,profile:h.state.profile
  };return true}});
  const task=h.activate({user:{id:B}});
  assert.equal(h.state.user.id,B);
  assert.deepEqual(observed,{user:B,feed:0,privateUrls:0,notifications:0,profile:null});
  for(const key of ['feed','videos','stories','notifications','channels','friendRequests'])assert.equal(h.state[key].length,0,key);
  for(const key of ['likes','comments','subscriptions','profiles','signed'])assert.equal(h.state[key].size,0,key);
  assert.equal(h.state.extras,null);
  assert.equal(h.state.view,'home');
  assert.equal(h.state.profileViewId,null);
  assert.equal(h.state.channelViewId,null);
  assert.equal(h.state.profileTab,'posts');
  assert.equal(h.state.channelTab,'videos');
  assert.equal(h.state.busy,false);
  assert.equal(await task,true);
});

test('account switch stops old audio/video and closes old private overlays',async()=>{
  const h=harness();
  await h.activate({user:{id:B}});
  assert.equal(h.calls.music,1);
  assert.equal(h.calls.reels,1);
  assert.equal(h.calls.settings,1);
  assert.equal(h.calls.modal,1);
  assert.deepEqual(h.calls.overlays,['kf78-overlay','kf115-delete-overlay']);
  assert.equal(h.context.document.body.style.overflow,'');
  assert.equal(h.window._kinfolkSuggestionHidden.size,0);
});

test('repeated authentication for the same member does not wipe their current feed or playback',async()=>{
  const h=harness();
  assert.equal(await h.activate({user:{id:A}}),true);
  assert.equal(h.state.feed.length,1);
  assert.equal(h.state.signed.size,1);
  assert.equal(h.calls.music,0);
  assert.equal(h.calls.reels,0);
  assert.equal(h.calls.modal,0);
});

test('fresh login after signed-out state starts without old account caches',async()=>{
  const h=harness({oldUid:null});
  assert.equal(await h.activate({user:{id:B}}),true);
  assert.equal(h.state.feed.length,0);
  assert.equal(h.state.signed.size,0);
  assert.equal(h.state.user.id,B);
});

test('logout still clears private state and returns to login',async()=>{
  const h=harness();
  assert.equal(await h.activate(null),true);
  assert.equal(h.state.user,null);
  assert.equal(h.state.feed.length,0);
  assert.equal(h.state.signed.size,0);
  assert.deepEqual(h.calls.auth,['login']);
});

test('older in-flight account activation cannot render after another account becomes active',async()=>{
  const gate=deferred();let hydrations=0;
  const h=harness({oldUid:null,hydrate:()=>++hydrations===1?gate.promise:Promise.resolve(true)});
  const old=h.activate({user:{id:A}});
  const newer=h.activate({user:{id:B}});
  assert.equal(await newer,true);
  gate.resolve(true);
  assert.equal(await old,false);
  assert.equal(h.state.user.id,B);
});
