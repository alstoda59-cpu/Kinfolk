'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase95.js','utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));

function fixture(kind){
  let title='Welcome Back',connected=true,finishFetch,finishAdoption,session=null,activated=0,storageWrites=0,message=null;
  const fields={
    '.kf73Title':{get textContent(){return title}},
    '#kf73Email':{value:'test@example.invalid',focus(){}},
    '#kf73Password':{value:'synthetic-password',removeAttribute(){}},
    '#kf73Stay':{checked:true},
    '.kf73Primary':{disabled:false,textContent:'Log in'}
  };
  const form={
    get isConnected(){return connected},
    querySelector(selector){return selector==='.kf73Msg'?message:fields[selector]||null},
    appendChild(element){message=element},
    onsubmit:null
  };
  const document={
    documentElement:{},visibilityState:'visible',
    querySelector(){return form},getElementById(){return null},
    createElement(){return {style:{}}}
  };
  const values=new Map(),tabs=new Map();
  const localStorage={
    getItem(k){return values.get(k)??null},
    setItem(k,v){values.set(k,v);storageWrites++},
    removeItem(k){values.delete(k);storageWrites++}
  };
  const sessionStorage={
    getItem(k){return tabs.get(k)??null},
    setItem(k,v){tabs.set(k,v)},removeItem(k){tabs.delete(k)}
  };
  const sb={auth:{
    getSession:async()=>({data:{session},error:null}),
    setSession:async()=>{
      if(kind==='adoption-pending')await new Promise(resolve=>{finishAdoption=resolve});
      session={user:{id:'account-1',email:'test@example.invalid'}};
      return {data:{session},error:null};
    }
  }};
  const fetch=async()=>{
    if(kind==='token-pending')await new Promise(resolve=>{finishFetch=resolve});
    if(kind==='invalid-password')return {ok:false,status:401,json:async()=>({error:'Invalid login credentials'})};
    if(kind==='timeout')throw new Error('Kinfolk login timed out. Check your connection and try again.');
    return {ok:true,json:async()=>({
      access_token:'synthetic',refresh_token:'synthetic',user:{id:'account-1',email:'test@example.invalid'}
    })};
  };
  const timers=[];
  const window={kf129ActivateSession:async()=>{activated++;return true}};
  vm.runInNewContext(source,{
    window,document,sb,fetch,localStorage,sessionStorage,console,AbortController,
    MutationObserver:class{observe(){}},
    setInterval(){},setTimeout(fn,ms){if(ms===0)timers.push(fn);return 1},
    clearTimeout(){}
  });
  timers.forEach(fn=>fn());
  return {
    submit(){return form.onsubmit({preventDefault(){},stopImmediatePropagation(){}})},
    async waitFor(stage){
      for(let i=0;i<30&&!((stage==='token')?finishFetch:finishAdoption);i++)await tick();
      assert.equal(typeof ((stage==='token')?finishFetch:finishAdoption),'function','expected deferred stage');
    },
    finishToken(){finishFetch()},
    finishAdoption(){finishAdoption()},
    switchToSignup(){title='Create Your Kinfolk';fields['.kf73Primary'].textContent='Sign up'},
    detach(){connected=false},
    get activated(){return activated},
    get message(){return message?.textContent||''},
    get button(){return fields['.kf73Primary'].textContent},
    get storageWrites(){return storageWrites}
  };
}

for(const transition of ['signup','detached']){
  test('delayed token response does not activate after '+transition,async()=>{
    const f=fixture('token-pending'),pending=f.submit();
    await f.waitFor('token');
    if(transition==='signup')f.switchToSignup();else f.detach();
    f.finishToken();
    await pending;
    assert.equal(f.activated,0);
    assert.equal(f.message,'');
    if(transition==='signup')assert.equal(f.button,'Sign up');
  });
  test('delayed session adoption does not activate after '+transition,async()=>{
    const f=fixture('adoption-pending'),pending=f.submit();
    await f.waitFor('adoption');
    if(transition==='signup')f.switchToSignup();else f.detach();
    f.finishAdoption();
    await pending;
    assert.equal(f.activated,0);
    assert.equal(f.message,'');
    assert.ok(f.storageWrites>=4,'Stay Logged In preference must be rolled back');
    if(transition==='signup')assert.equal(f.button,'Sign up');
  });
}

test('successful password login activates once and shows success',async()=>{
  const f=fixture('success');
  await f.submit();
  assert.equal(f.activated,1);
  assert.match(f.message,/Logged in\. Opening Kinfolk/);
});

test('invalid password leaves form available for retry',async()=>{
  const f=fixture('invalid-password');
  await f.submit();
  assert.equal(f.activated,0);
  assert.match(f.message,/Email or password is incorrect/);
  assert.equal(f.button,'Log in');
});

test('login timeout preserves useful message and permits retry',async()=>{
  const f=fixture('timeout');
  await f.submit();
  assert.equal(f.activated,0);
  assert.match(f.message,/login timed out/i);
  assert.equal(f.button,'Log in');
});
