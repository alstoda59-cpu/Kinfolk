'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase95.js','utf8');

// Entirely offline: no real credentials, network, users or Supabase mutations.
function fixture({ids=[null,null,'login','login'],adoptedId='login',setSessionError=null,stay=false,activationError=null,missingActivation=false,disconnectOnActivation=false,holdActivation=false,tokenUserId='login'}={}){
  let read=0,activated=0,adoptions=0,message,releaseActivation;
  const local=new Map([['kinfolk_stay_logged_in_v1','1'],['kinfolk_stay_logged_in','1']]);
  const tab=new Map();
  const storage=map=>({getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)});
  const password={value:'synthetic-pass',removeAttribute(){},autocomplete:''};
  const fields={
    '.kf73Title':{textContent:'Welcome Back'},
    '#kf73Email':{value:'test@example.test'},
    '#kf73Password':password,
    '#kf73Stay':{checked:stay},
    '.kf73Primary':{disabled:false,textContent:'Log in'}
  };
  const form={
    isConnected:true,
    querySelector:key=>key==='.kf73Msg'?message:(fields[key]||null),
    onsubmit:null,
    appendChild:element=>{message=element}
  };
  const document={
    documentElement:{},visibilityState:'visible',
    querySelector:()=>form,getElementById:()=>null,
    createElement:()=>({style:{}})
  };
  const sb={auth:{
    async getSession(){
      const id=ids[Math.min(read++,ids.length-1)];
      return {data:{session:id===null?null:{user:{id,email:'test@example.test'}}},error:null};
    },
    async setSession(){
      adoptions++;
      return {data:{session:{user:adoptedId?{id:adoptedId,email:'test@example.test'}:null}},error:setSessionError};
    }
  }};
  const window={};
  if(!missingActivation)window.kf129ActivateSession=async()=>{activated++;if(holdActivation)await new Promise(resolve=>{releaseActivation=resolve});if(disconnectOnActivation)form.isConnected=false;if(activationError)throw activationError;return true};
  const timers=[];
  vm.runInNewContext(source,{
    window,document,sb,console,AbortController,
    fetch:async()=>({ok:true,json:async()=>({access_token:'synthetic',refresh_token:'synthetic',user:tokenUserId?{id:tokenUserId,email:'test@example.test'}:null})}),
    localStorage:storage(local),sessionStorage:storage(tab),
    MutationObserver:class{observe(){}},
    setInterval(){},
    setTimeout(fn,ms){if(ms===0)timers.push(fn);else if(ms===100)fn();return 1},
    clearTimeout(){}
  });
  for(const fn of timers)fn();
  assert.equal(typeof form.onsubmit,'function','Login handler must bind');
  return {
    local,tab,
    get activated(){return activated},
    get adoptions(){return adoptions},
    get message(){return message?.textContent||''},
    releaseActivation(){if(!releaseActivation)throw Error('Activation has not started');releaseActivation()},
    submitStart(){return form.onsubmit({preventDefault(){},stopPropagation(){}})},
    async submit(){
      await form.onsubmit({preventDefault(){},stopPropagation(){}});
      return message?.textContent||'';
    }
  };
}
test('matching active session activates login and persists selected choice',async()=>{
  const f=fixture();
  assert.match(await f.submit(),/Logged in/);
  assert.equal(f.activated,1);
  assert.equal(f.local.get('kinfolk_stay_logged_in_v1'),'0');
  assert.equal(f.tab.get('kinfolk_session_tab'),'1');
});
test('account switch during password request prevents adopting stale tokens',async()=>{
  const f=fixture({ids:[null,'other']});
  assert.match(await f.submit(),/active account changed/);
  assert.equal(f.adoptions,0);
  assert.equal(f.activated,0);
  assert.equal(f.local.get('kinfolk_stay_logged_in_v1'),'1');
});
test('different account after setSession is not activated',async()=>{
  const f=fixture({ids:[null,null,'other']});
  assert.match(await f.submit(),/active account changed/);
  assert.equal(f.adoptions,1);
  assert.equal(f.activated,0);
  assert.equal(f.local.get('kinfolk_stay_logged_in_v1'),'1');
  assert.equal(f.tab.has('kinfolk_session_tab'),false);
});
test('account switch after verification cannot activate old session',async()=>{
  const f=fixture({ids:[null,null,'login','other']});
  assert.match(await f.submit(),/active account changed/);
  assert.equal(f.activated,0);
  assert.equal(f.local.get('kinfolk_stay_logged_in_v1'),'1');
});
test('unverified session never falls back to setSession response',async()=>{
  const f=fixture({ids:[null,null,null,null,null,null,null]});
  assert.match(await f.submit(),/could not verify the active session/);
  assert.equal(f.activated,0);
  assert.equal(f.local.get('kinfolk_stay_logged_in_v1'),'1');
});
test('missing authenticated identity cannot activate login',async()=>{
  const f=fixture({adoptedId:null});
  assert.match(await f.submit(),/could not identify the login account/);
  assert.equal(f.activated,0);
  assert.equal(f.local.get('kinfolk_stay_logged_in_v1'),'1');
});
test('setSession error restores preferences and blocks activation',async()=>{
  const f=fixture({setSessionError:Error('synthetic session rejection')});
  assert.match(await f.submit(),/synthetic session rejection/);
  assert.equal(f.activated,0);
  assert.equal(f.local.get('kinfolk_stay_logged_in_v1'),'1');
});

test('successful activation shows success only after activation completes',async()=>{
  const f=fixture();
  assert.match(await f.submit(),/Logged in/);
  assert.equal(f.activated,1);
});
test('missing activation handler reports error and restores Stay Logged In',async()=>{
  const f=fixture({missingActivation:true});
  assert.match(await f.submit(),/could not open your account/);
  assert.equal(f.activated,0);
  assert.equal(f.local.get('kinfolk_stay_logged_in_v1'),'1');
  assert.equal(f.tab.has('kinfolk_session_tab'),false);
});
test('activation rejection reports error and restores Stay Logged In',async()=>{
  const f=fixture({activationError:Error('synthetic activation failure')});
  assert.match(await f.submit(),/synthetic activation failure/);
  assert.equal(f.activated,1);
  assert.equal(f.local.get('kinfolk_stay_logged_in_v1'),'1');
  assert.equal(f.tab.has('kinfolk_session_tab'),false);
});
test('account switch during activation reports error and restores preference',async()=>{
  const f=fixture({ids:[null,null,'login','login','other']});
  assert.match(await f.submit(),/active account changed while opening Kinfolk/);
  assert.equal(f.activated,1);
  assert.equal(f.local.get('kinfolk_stay_logged_in_v1'),'1');
  assert.equal(f.tab.has('kinfolk_session_tab'),false);
});
test('detached form does not receive stale success message',async()=>{
  const f=fixture({disconnectOnActivation:true});
  assert.doesNotMatch(await f.submit(),/Logged in/);
  assert.equal(f.activated,1);
});

test('pending activation cannot announce login success early',async()=>{
  const f=fixture({holdActivation:true});
  const pending=f.submitStart();
  for(let i=0;i<40&&f.activated===0;i++)await Promise.resolve();
  assert.equal(f.activated,1,'Expected activation to begin');
  assert.doesNotMatch(f.message,/Logged in/);
  f.releaseActivation();
  await pending;
  assert.match(f.message,/Logged in/);
});


test('password response user must match adopted Supabase session',async()=>{
  const f=fixture({tokenUserId:'different'});
  assert.match(await f.submit(),/authenticated account does not match the login response/);
  assert.equal(f.activated,0);
  assert.equal(f.local.get('kinfolk_stay_logged_in_v1'),'1');
  assert.equal(f.tab.has('kinfolk_session_tab'),false);
});
test('password response without user identity is rejected before adoption',async()=>{
  const f=fixture({tokenUserId:null});
  assert.match(await f.submit(),/incomplete login session/);
  assert.equal(f.adoptions,0);
  assert.equal(f.activated,0);
  assert.equal(f.local.get('kinfolk_stay_logged_in_v1'),'1');
});
