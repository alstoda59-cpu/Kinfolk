'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase95.js','utf8');

// Full committed login handler, synthetic DOM/Auth/storage only. No real accounts.
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}}
function fixture({existing=false,stage='token'}={}){
  const hold=deferred(),prefs=new Map(),tab=new Map(),timers=[];
  let session=existing?{user:{id:'existing-id',email:'existing@example.test'}}:null;
  let tokenCalls=0,adoptions=0,activations=0,signouts=0;
  const fields={
    '.kf73Title':{textContent:'Welcome back'},
    '#kf73Email':{value:'synthetic@example.test',focus(){}},
    '#kf73Password':{value:'synthetic-password',removeAttribute(){},autocomplete:''},
    '#kf73Stay':{checked:true},
    '.kf73Primary':{disabled:false,textContent:'Log in'}
  };
  const form={isConnected:true,dataset:{},querySelector:key=>fields[key]||null,appendChild:node=>{fields['.kf73Msg']=node},addEventListener(){}};
  const store=map=>({getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,String(value)),removeItem:key=>map.delete(key)});
  const auth={
    getSession:async()=>({data:{session},error:null}),
    setSession:async()=>{
      adoptions++;
      if(stage==='adopt')await hold.promise;
      session={user:{id:'new-id',email:'synthetic@example.test'}};
      return {data:{session},error:null};
    },
    signOut:async options=>{assert.equal(options.scope,'local');signouts++;session=null;return {error:null}}
  };
  const document={
    documentElement:{},visibilityState:'visible',
    querySelector:key=>key==='#authForm[data-kf73="1"]'?form:null,
    getElementById:key=>key==='authForm'?form:null,
    createElement:()=>({style:{},textContent:''})
  };
  const context={
    window:{kf129ActivateSession:async()=>{activations++;return true}},document,sb:{auth},
    fetch:async()=>{
      tokenCalls++;
      if(stage==='token')await hold.promise;
      return {ok:true,status:200,json:async()=>({
        access_token:'synthetic-access',refresh_token:'synthetic-refresh',
        user:{id:'new-id',email:'synthetic@example.test'}
      })};
    },
    AbortController,localStorage:store(prefs),sessionStorage:store(tab),
    MutationObserver:class{observe(){}},
    setTimeout:(fn,delay)=>{if(delay===0)timers.push(fn);return 1},
    clearTimeout(){},setInterval(){},console:{log(){},warn(){}}
  };
  vm.runInNewContext(source,context,{filename:'kinfolk-phase95.js'});
  timers.forEach(fn=>fn());
  assert.equal(typeof form.onsubmit,'function');
  return {form,fields,hold,prefs,tab,
    submit:()=>form.onsubmit({preventDefault(){},stopImmediatePropagation(){}}),
    get tokenCalls(){return tokenCalls},get adoptions(){return adoptions},
    get activations(){return activations},get signouts(){return signouts},
    get session(){return session}
  };
}
async function until(fn){for(let i=0;i<40&&!fn();i++)await Promise.resolve();assert.ok(fn(),'deferred step not reached')}

test('existing signed-in account cannot be silently replaced by login',async()=>{
  const h=fixture({existing:true});
  await h.submit();
  assert.equal(h.tokenCalls,0);
  assert.equal(h.adoptions,0);
  assert.equal(h.activations,0);
  assert.equal(h.signouts,0);
  assert.equal(h.session.user.id,'existing-id');
  assert.equal(h.prefs.size,0);
  assert.match(h.fields['.kf73Msg'].textContent,/already signed in/i);
});

test('changing Stay Logged In during token request rejects stale choice',async()=>{
  const h=fixture();
  const pending=h.submit();
  await until(()=>h.tokenCalls===1);
  h.fields['#kf73Stay'].checked=false;
  h.hold.resolve();
  await pending;
  assert.equal(h.adoptions,0);
  assert.equal(h.activations,0);
  assert.equal(h.prefs.size,0);
  assert.equal(h.signouts,0);
  assert.match(h.fields['.kf73Msg'].textContent,/login details changed/i);
});

test('changing Stay Logged In during adoption restores preference and clears new session',async()=>{
  const h=fixture({stage:'adopt'});
  const pending=h.submit();
  await until(()=>h.adoptions===1);
  assert.equal(h.prefs.get('kinfolk_stay_logged_in_v1'),'1');
  h.fields['#kf73Stay'].checked=false;
  h.hold.resolve();
  await pending;
  assert.equal(h.activations,0);
  assert.equal(h.signouts,1);
  assert.equal(h.session,null);
  assert.equal(h.prefs.size,0);
  assert.equal(h.tab.size,0);
  assert.match(h.fields['.kf73Msg'].textContent,/login details changed/i);
});

for(const stay of [true,false]){
  test('unchanged Stay Logged In '+stay+' completes normal login',async()=>{
    const h=fixture({stage:'immediate'});
    h.fields['#kf73Stay'].checked=stay;
    await h.submit();
    assert.equal(h.tokenCalls,1);
    assert.equal(h.adoptions,1);
    assert.equal(h.activations,1);
    assert.equal(h.signouts,0);
    assert.equal(h.prefs.get('kinfolk_stay_logged_in_v1'),stay?'1':'0');
    assert.equal(h.prefs.get('kinfolk_stay_logged_in'),stay?'1':'0');
    if(stay)assert.equal(h.tab.has('kinfolk_session_tab'),false);
    else assert.equal(h.tab.get('kinfolk_session_tab'),'1');
  });
}
