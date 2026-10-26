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
  let submit,message,signouts=0,sessionChecks=0;
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
    '#kf73Password':{value:'testpass'},
    '#kf79Birthdate':{value:'1990-01-01'},
    '#kf73Stay':{checked:false},
    '.kf73Primary':{disabled:false,textContent:'Create account'}
  };
  const form={
    id:'authForm',isConnected:true,dataset:{kf73:'1'},
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
      if(stage==='signup')await wait.promise;
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
