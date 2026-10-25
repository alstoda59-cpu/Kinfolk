'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase95.js','utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(){
  let title='Welcome Back', connected=true, resolveFetch, setSessionCalls=0, messages=[];
  const fields={
    '.kf73Title':{get textContent(){return title}},
    '#kf73Email':{value:'test@example.invalid',focus(){}},
    '#kf73Password':{value:'synthetic-password',removeAttribute(){}},
    '#kf73Stay':{checked:true},
    '.kf73Primary':{disabled:false,textContent:'Log in'}
  };
  let message=null;
  const form={
    get isConnected(){return connected},
    querySelector(selector){return selector==='.kf73Msg'?message:fields[selector]||null},
    appendChild(element){message=element;messages.push(element)},
    onsubmit:null
  };
  const document={
    documentElement:{},visibilityState:'visible',
    querySelector(){return form},getElementById(){return null},
    createElement(){return {style:{}}}
  };
  const timers=[];
  const sb={auth:{
    getSession:async()=>({data:{session:null},error:null}),
    setSession:async()=>{setSessionCalls++;throw Error('Must not adopt stale response')}
  }};
  vm.runInNewContext(source,{
    window:{},document,sb,console,AbortController,
    fetch:()=>new Promise(resolve=>{resolveFetch=resolve}),
    localStorage:{getItem(){return null},setItem(){},removeItem(){}},
    sessionStorage:{getItem(){return null},setItem(){},removeItem(){}},
    MutationObserver:class{observe(){}},
    setInterval(){},
    setTimeout(fn,ms){if(ms===0)timers.push(fn);return 1},
    clearTimeout(){}
  });
  timers.forEach(fn=>fn());
  return {
    async submit(){return form.onsubmit({preventDefault(){},stopImmediatePropagation(){}})},
    async finishFetch(){await tick();assert.equal(typeof resolveFetch,'function');resolveFetch({ok:true,json:async()=>({access_token:'synthetic',refresh_token:'synthetic',user:{id:'user-test'}})});await tick()},
    setTitle(value){title=value},
    detach(){connected=false},
    get setSessionCalls(){return setSessionCalls},
    get message(){return message?.textContent||''}
  };
}
for(const scenario of ['switch-to-signup','remove-login-form']){
  test('reject delayed password response after '+scenario,async()=>{
    const f=fixture();
    const pending=f.submit();
    await tick();
    if(scenario==='switch-to-signup')f.setTitle('Create Your Kinfolk');
    else f.detach();
    await f.finishFetch();
    await pending;
    assert.equal(f.setSessionCalls,0,'Stale password response must not be adopted');
    assert.match(f.message,/login screen changed/i);
  });
}
