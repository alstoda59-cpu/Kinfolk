'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase79.js','utf8');

// Synthetic DOM and auth promises only; never reaches a real account or backend.
function deferred(){
  let resolve;
  const promise=new Promise(r=>{resolve=r});
  return {promise,resolve};
}
function fixture(stage){
  let submit,message,signouts=0,sessionChecks=0,signupCalls=0;
  const wait=deferred(),local=new Map(),tab=new Map();
  const storage=map=>({
    getItem:k=>map.get(k)??null,
    setItem(k,v){if(stage==='signout'&&map===tab)throw Error('Synthetic storage denied');map.set(k,String(v))},
    removeItem:k=>map.delete(k)
  });
  const fields={
    '.kf73Title':{textContent:'Create your Kinfolk'},
    '#kf73Name':{value:'Synthetic QA'},
    '#kf73Email':{value:'synthetic@example.invalid'},
    '#kf73Password':{value:'testpass2026!'},
    '#kf79Birthdate':{value:'1990-01-01'},
    '#kf73Stay':{checked:false},
    '.kf73Primary':{disabled:false,textContent:'Create account'}
  };
  const form={
    querySelectorAll(){return []},id:'authForm',isConnected:true,dataset:{kf73:'1'},
    querySelector:k=>k==='.kf73Msg'?message:fields[k]||null,
    appendChild:n=>{message=n}
  };
  const document={
    head:{appendChild(){}},documentElement:{},
    createElement:()=>({style:{},setAttribute(){}}),
    addEventListener:(type,fn)=>{if(type==='submit')submit=fn}
  };
  const auth={
    async signUp(){
      signupCalls++;
      if(stage==='signup'||stage==='signup-error')await wait.promise;
      if(stage==='signup-error')return {data:null,error:Error('Synthetic signup rejected')};
      return {data:{session:{user:{id:'qa'}}},error:null};
    },
    async getSession(){
      sessionChecks++;
      if(stage==='session')await wait.promise;
      return {data:{session:{user:{id:'qa'}}},error:null};
    },
    async signOut(){
      signouts++;
      if(stage==='signout')await wait.promise;
      return {error:null};
    }
  };
  vm.runInNewContext(source,{
    window:{},document,sb:{auth},URL,Date,console,
    location:{origin:'https://example.invalid'},
    localStorage:storage(local),sessionStorage:storage(tab),
    MutationObserver:class{observe(){}},
    setTimeout(){},clearTimeout(){}
  },{filename:'kinfolk-phase79.js'});
  return {
    form,fields,wait,local,tab,
    get message(){return message?.textContent||''},
    get signouts(){return signouts},
    get signupCalls(){return signupCalls},
    get sessionChecks(){return sessionChecks},
    submit:()=>submit({target:form,preventDefault(){},stopImmediatePropagation(){}})
  };
}
async function tickUntil(fn){
  for(let i=0;i<20&&!fn();i++)await Promise.resolve();
  assert.ok(fn(),'expected deferred auth stage was not reached');
}
test('late signup response does not write preference or success after navigation',async()=>{
  const f=fixture('signup'),task=f.submit();
  f.fields['.kf73Title'].textContent='Welcome back';
  f.wait.resolve();
  await task;
  assert.equal(f.local.size,0);
  assert.equal(f.tab.size,0);
  assert.equal(f.message,'');
});
test('late session verification does not write preference after navigation',async()=>{
  const f=fixture('session'),task=f.submit();
  await tickUntil(()=>f.sessionChecks>0);
  f.form.isConnected=false;
  f.wait.resolve();
  await task;
  assert.equal(f.local.size,0);
  assert.equal(f.tab.size,0);
  assert.equal(f.message,'');
});
test('late local sign-out after storage failure does not update replaced login form',async()=>{
  const f=fixture('signout'),task=f.submit();
  await tickUntil(()=>f.signouts>0);
  f.fields['.kf73Title'].textContent='Welcome back';
  f.wait.resolve();
  await task;
  assert.equal(f.message,'');
  assert.equal(f.local.size,0,'preference rollback remains intact');
});

test('reused auth form cannot receive old signup success after login-to-signup roundtrip',async()=>{
  const f=fixture('signup'),oldTask=f.submit();
  // Phase76 replaces the form children but keeps the same #authForm element.
  f.fields['.kf73Title']={textContent:'Welcome back'};
  f.fields['.kf73Title']={textContent:'Create your Kinfolk'};
  await f.submit();
  assert.match(f.message,/previous account creation request/i,'new signup must explain why it is temporarily busy');
  assert.equal(f.signupCalls,1,'new screen must not create a second account concurrently');
  f.wait.resolve();await oldTask;
  assert.match(f.message,/previous account creation request/i,'old success must not repaint a new signup screen');
  assert.equal(f.local.size,0,'stale signup must not persist a previous account login setting');
  assert.equal(f.tab.size,0);
  await f.submit();
  assert.equal(f.signupCalls,2,'new signup can proceed after old operation finishes');
  assert.match(f.message,/Account created/);
});

test('reused auth form cannot receive old signup error after login-to-signup roundtrip',async()=>{
  const f=fixture('signup-error'),oldTask=f.submit();
  f.fields['.kf73Title']={textContent:'Welcome back'};
  f.fields['.kf73Title']={textContent:'Create your Kinfolk'};
  await f.submit();
  const previous=f.message;
  f.wait.resolve();await oldTask;
  assert.equal(f.message,previous,'old rejection must not appear on the new form');
  assert.equal(f.local.size,0);
  assert.equal(f.signupCalls,1);
});

test('delayed session verification cannot persist prior signup on remounted title node',async()=>{
  const f=fixture('session'),oldTask=f.submit();
  await tickUntil(()=>f.sessionChecks>0);
  f.fields['.kf73Title']={textContent:'Create your Kinfolk'};
  f.wait.resolve();await oldTask;
  assert.equal(f.local.size,0);
  assert.equal(f.tab.size,0);
  assert.equal(f.message,'');
});

test('delayed signup storage cleanup cannot paint error on remounted signup screen',async()=>{
  const f=fixture('signout'),oldTask=f.submit();
  await tickUntil(()=>f.signouts>0);
  f.fields['.kf73Title']={textContent:'Create your Kinfolk'};
  f.wait.resolve();await oldTask;
  assert.equal(f.message,'');
  assert.equal(f.local.size,0);
});
