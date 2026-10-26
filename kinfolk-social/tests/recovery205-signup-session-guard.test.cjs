'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase79.js','utf8');

// Synthetic signup only. No real Supabase, accounts, storage or network calls.
function fixture({sessionCheck='missing'}={}){
  let submit, message, signups=0;
  const local=new Map([
    ['kinfolk_stay_logged_in_v1','1'],
    ['kinfolk_stay_logged_in','1']
  ]);
  const tab=new Map();
  const storage=map=>({
    getItem:key=>map.get(key)??null,
    setItem:(key,value)=>map.set(key,String(value)),
    removeItem:key=>map.delete(key)
  });
  const fields={
    '.kf73Title':{textContent:'Create your Kinfolk'},
    '#kf73Name':{value:'Synthetic QA'},
    '#kf73Email':{value:'synthetic@example.invalid'},
    '#kf73Password':{value:'testpass12345'},
    '#kf79Birthdate':{value:'1990-01-01'},
    '#kf73Stay':{checked:false},
    '.kf73Primary':{disabled:false,textContent:'Create account'}
  };
  const form={
    querySelectorAll(){return []},id:'authForm',isConnected:true,dataset:{kf73:'1'},
    querySelector:key=>key==='.kf73Msg'?message:fields[key]||null,
    appendChild:node=>{message=node}
  };
  const document={
    head:{appendChild(){}},documentElement:{},
    createElement:()=>({style:{}}),
    addEventListener:(type,fn)=>{if(type==='submit')submit=fn}
  };
  const auth={
    signUp:async()=>{signups++;return {data:{session:{user:{id:'signup-user'}}},error:null}}
  };
  if(sessionCheck!=='missing'){
    auth.getSession=async()=>{
      if(sessionCheck==='error')return {data:null,error:Error('Synthetic session check failure')};
      return {data:{session:{user:{id:sessionCheck==='matching'?'signup-user':'other-user'}}},error:null};
    };
  }
  vm.runInNewContext(source,{
    window:{},document,sb:{auth},URL,Date,console,
    location:{origin:'https://example.invalid'},
    localStorage:storage(local),sessionStorage:storage(tab),
    MutationObserver:class{observe(){}},
    setTimeout(){},clearTimeout(){}
  },{filename:'kinfolk-phase79.js'});
  return {
    local,tab,get signups(){return signups},
    async submit(){
      await submit({target:form,preventDefault(){},stopImmediatePropagation(){}});
      return message?.textContent||'';
    }
  };
}

test('signup refuses to save login preference when getSession is unavailable',async()=>{
  const f=fixture();
  const message=await f.submit();
  assert.match(message,/could not verify|sign in again/i);
  assert.equal(f.signups,1);
  assert.equal(f.local.get('kinfolk_stay_logged_in_v1'),'1');
  assert.equal(f.local.get('kinfolk_stay_logged_in'),'1');
  assert.equal(f.tab.has('kinfolk_session_tab'),false);
});

test('signup preserves existing preference if active account differs',async()=>{
  const f=fixture({sessionCheck:'different'});
  assert.match(await f.submit(),/active login changed/i);
  assert.equal(f.local.get('kinfolk_stay_logged_in_v1'),'1');
  assert.equal(f.tab.has('kinfolk_session_tab'),false);
});

test('signup saves chosen one-tab preference for verified matching account',async()=>{
  const f=fixture({sessionCheck:'matching'});
  assert.match(await f.submit(),/Opening Kinfolk/);
  assert.equal(f.local.get('kinfolk_stay_logged_in_v1'),'0');
  assert.equal(f.local.get('kinfolk_stay_logged_in'),'0');
  assert.equal(f.tab.get('kinfolk_session_tab'),'1');
});

test('signup refuses to save preference when session verification errors',async()=>{
  const f=fixture({sessionCheck:'error'});
  assert.match(await f.submit(),/Synthetic session check failure/);
  assert.equal(f.local.get('kinfolk_stay_logged_in_v1'),'1');
  assert.equal(f.tab.has('kinfolk_session_tab'),false);
});
