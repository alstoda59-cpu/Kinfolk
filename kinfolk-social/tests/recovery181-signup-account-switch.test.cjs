'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase79.js','utf8');

function fixture({activeIds=['signup'],denySecondPreference=false,signOutError=false}={}){
  let submit,message,signouts=0,readIndex=0;
  const local=new Map([['kinfolk_stay_logged_in_v1','1'],['kinfolk_stay_logged_in','1']]);
  const tab=new Map([['kinfolk_session_tab','1']]);
  let denied=false;
  const localStorage={
    getItem:k=>local.get(k)??null,
    setItem(k,v){if(denySecondPreference&&k==='kinfolk_stay_logged_in'&&!denied){denied=true;throw Error('Storage denied')}local.set(k,v)},
    removeItem:k=>local.delete(k)
  };
  const sessionStorage={
    getItem:k=>tab.get(k)??null,
    setItem:(k,v)=>tab.set(k,v),
    removeItem:k=>tab.delete(k)
  };
  const fields={
    '.kf73Title':{textContent:'Create your Kinfolk'},
    '#kf73Name':{value:'Synthetic QA'},
    '#kf73Email':{value:'qa@example.test'},
    '#kf73Password':{value:'testpass2026!'},
    '#kf79Birthdate':{value:'1990-01-01'},
    '#kf73Stay':{checked:false},
    '.kf73Primary':{disabled:false,textContent:'Create account'}
  };
  const form={
    querySelectorAll(){return []},id:'authForm',isConnected:true,dataset:{kf73:'1'},
    querySelector:k=>k==='.kf73Msg'?message:fields[k]||null,
    appendChild:x=>{message=x}
  };
  const document={
    head:{appendChild(){}},documentElement:{},
    createElement:()=>({style:{}}),
    addEventListener:(type,fn)=>{if(type==='submit')submit=fn}
  };
  const sb={auth:{
    signUp:async()=>({data:{user:{id:'signup',email:'qa@example.test'},session:{user:{id:'signup',email:'qa@example.test'}}},error:null}),
    getSession:async()=>{if(readIndex++===0)return {data:{session:null},error:null};const id=activeIds[Math.min(readIndex-2,activeIds.length-1)];return {data:{session:{user:{id,email:'qa@example.test'}}},error:null}},
    signOut:async()=>{signouts++;return {error:signOutError?Error('Synthetic signout failure'):null}}
  }};
  vm.runInNewContext(source,{
    window:{},document,sb,URL,Date,console,
    location:{origin:'https://qa.example.test'},
    localStorage,sessionStorage,
    MutationObserver:class{observe(){}},setTimeout(){},clearTimeout(){}
  });
  return {
    local,tab,get signouts(){return signouts},
    async submit(){
      await submit({target:form,preventDefault(){},stopImmediatePropagation(){}});
      return message?.textContent||'';
    }
  };
}

test('current signup session persists selected one-tab policy',async()=>{
  const f=fixture();
  assert.match(await f.submit(),/Opening Kinfolk/);
  assert.equal(f.local.get('kinfolk_stay_logged_in_v1'),'0');
  assert.equal(f.local.get('kinfolk_stay_logged_in'),'0');
  assert.equal(f.tab.get('kinfolk_session_tab'),'1');
  assert.equal(f.signouts,0);
});

test('stale signup response cannot overwrite a different account preference',async()=>{
  const f=fixture({activeIds:['other-account']});
  assert.match(await f.submit(),/active login changed/);
  assert.equal(f.local.get('kinfolk_stay_logged_in_v1'),'1');
  assert.equal(f.local.get('kinfolk_stay_logged_in'),'1');
  assert.equal(f.signouts,0);
});

test('account switching during storage cleanup does not sign out new account',async()=>{
  const f=fixture({activeIds:['signup','other-account'],denySecondPreference:true});
  assert.match(await f.submit(),/could not save/);
  assert.equal(f.local.get('kinfolk_stay_logged_in_v1'),'1');
  assert.equal(f.local.get('kinfolk_stay_logged_in'),'1');
  assert.equal(f.signouts,0);
});

test('same account is locally signed out when storage save fails',async()=>{
  const f=fixture({activeIds:['signup','signup'],denySecondPreference:true});
  assert.match(await f.submit(),/could not save/);
  assert.equal(f.local.get('kinfolk_stay_logged_in_v1'),'1');
  assert.equal(f.signouts,1);
});

test('failed local signout is explicitly reported rather than implying safety',async()=>{
  const f=fixture({activeIds:['signup','signup'],denySecondPreference:true,signOutError:true});
  assert.match(await f.submit(),/sign out manually/);
  assert.equal(f.signouts,1);
});
