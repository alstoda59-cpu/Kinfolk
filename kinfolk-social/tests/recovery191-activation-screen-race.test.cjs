'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase95.js','utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function harness(){
  let title='Welcome Back',connected=true,finishAdoption,activated=0,loginSuccess=0,restoreWrites=0,session=null;
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
    querySelector(s){return s==='.kf73Msg'?message:fields[s]||null},
    appendChild(el){message=el},
    onsubmit:null
  };
  const document={
    documentElement:{},visibilityState:'visible',
    querySelector(){return form},getElementById(){return null},
    createElement(){return {style:{}}}
  };
  const sb={auth:{
    getSession:async()=>({data:{session},error:null}),
    setSession:()=>new Promise(resolve=>{finishAdoption=()=>{session={user:{id:'account-1',email:'test@example.invalid'}};resolve({data:{session},error:null})}})
  }};
  const window={kf129ActivateSession:async()=>{activated++}};
  const storage=new Map();
  const localStorage={
    getItem(k){return storage.has(k)?storage.get(k):null},
    setItem(k,v){storage.set(k,v);restoreWrites++},
    removeItem(k){storage.delete(k);restoreWrites++}
  };
  const timers=[];
  vm.runInNewContext(source,{
    window,document,sb,console,AbortController,
    fetch:async()=>({ok:true,json:async()=>({access_token:'synthetic',refresh_token:'synthetic',user:{id:'account-1',email:'test@example.invalid'}})}),
    localStorage,
    sessionStorage:{getItem(){return null},setItem(){},removeItem(){}},
    MutationObserver:class{observe(){}},
    setInterval(){},setTimeout(fn,ms){if(ms===0)timers.push(fn);return 1},clearTimeout(){}
  });
  timers.forEach(fn=>fn());
  return {
    submit(){return form.onsubmit({preventDefault(){},stopImmediatePropagation(){}})},
    async waitForAdoption(){for(let i=0;i<20&&!finishAdoption;i++)await tick();assert.equal(typeof finishAdoption,'function')},
    finish(){finishAdoption()},
    setMode(v){title=v},detach(){connected=false},
    get activated(){return activated},
    get message(){return message?.textContent||''},
    get restoreWrites(){return restoreWrites}
  };
}
for(const transition of ['signup','detached']){
  test('do not activate if login form becomes '+transition+' during session adoption',async()=>{
    const f=harness(),pending=f.submit();
    await f.waitForAdoption();
    if(transition==='signup')f.setMode('Create Your Kinfolk');
    else f.detach();
    f.finish();
    await pending;
    assert.equal(f.activated,0);
    assert.doesNotMatch(f.message,/Logged in\. Opening Kinfolk/);
    assert.ok(f.restoreWrites>0,'preference rollback must run');
  });
}
