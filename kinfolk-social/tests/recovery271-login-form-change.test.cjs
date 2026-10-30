'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase95.js','utf8');

function harness(){
  const title={textContent:'Welcome back'};
  const email={value:'qa@example.test',focus(){}};
  const password={value:'synthetic-password',removeAttribute(){},autocomplete:''};
  const button={disabled:false,textContent:'Log in'};
  const message={style:{},textContent:''};
  const fields={'.kf73Title':title,'#kf73Email':email,'#kf73Password':password,
    '#kf73Stay':{checked:true},'.kf73Primary':button,'.kf73Msg':message};
  const form={
    isConnected:true,dataset:{},querySelector:key=>fields[key]||null,
    appendChild(){},addEventListener(){},onsubmit:null
  };
  let resolveFetch,adopted=0,activated=0;
  const scheduled=[];
  const storage=()=>({getItem:()=>null,setItem(){},removeItem(){}});
  const document={
    documentElement:{},visibilityState:'visible',
    querySelector:key=>key==='#authForm[data-kf73="1"]'?form:null,
    getElementById:key=>key==='authForm'?form:null,
    createElement:()=>({style:{},textContent:''})
  };
  const sb={auth:{
    getSession:async()=>({data:{session:null},error:null}),
    setSession:async()=>{adopted++;return{data:{session:{user:{id:'synthetic-id',email:'qa@example.test',email_confirmed_at:'2026-10-29T12:00:00.000Z'}}},error:null}}
  }};
  vm.runInNewContext(source,{
    window:{kf129ActivateSession:async()=>{activated++}},
    document,sb,fetch:()=>new Promise(resolve=>{resolveFetch=resolve}),
    AbortController,localStorage:storage(),sessionStorage:storage(),
    MutationObserver:class{observe(){}},
    setTimeout:(fn,ms)=>{scheduled.push({fn,ms});return scheduled.length},
    clearTimeout(){},setInterval(){},console:{log(){},warn(){}}
  });
  const bind=scheduled.find(t=>t.ms===0);
  assert.ok(bind,'initial login binding scheduled');
  bind.fn();
  assert.equal(typeof form.onsubmit,'function');
  return {
    form,email,password,button,message,
    get adopted(){return adopted},get activated(){return activated},
    get resolveFetch(){return resolveFetch}
  };
}

for(const changed of ['email','password']){
  test('editing '+changed+' while login response is pending does not adopt stale account',async()=>{
    const h=harness();
    const task=h.form.onsubmit({preventDefault(){},stopImmediatePropagation(){}});
    for(let i=0;i<8&&!h.resolveFetch;i++)await Promise.resolve();
    assert.equal(typeof h.resolveFetch,'function','synthetic token request started');
    if(changed==='email')h.email.value='other@example.test';
    else h.password.value='another-password';
    h.resolveFetch({ok:true,status:200,json:async()=>({
      access_token:'synthetic-access',refresh_token:'synthetic-refresh',
      user:{id:'synthetic-id',email:'qa@example.test',email_confirmed_at:'2026-10-29T12:00:00.000Z'}
    })});
    await task;
    assert.equal(h.adopted,0,'stale token must not be installed');
    assert.equal(h.activated,0,'stale login must not activate the app');
    assert.equal(h.button.disabled,false,'button must be usable again');
    assert.match(h.message.textContent,/login details changed/i);
  });
}
