'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'..','kinfolk-phase95.js'),'utf8');
const start=source.indexOf('async function clearFailedLoginSession(');
const end=source.indexOf('async function activateLoginSession(',start);
assert.ok(start>=0&&end>start,'Phase95 session adoption and rollback functions exist');
const helpers=source.slice(start,end)+';globalThis.__helpers={adopt,clearFailedLoginSession};';
const tokens={access_token:'synthetic-access',refresh_token:'synthetic-refresh',user:{id:'synthetic-requested',email:'synthetic@example.invalid'}};

function sessionHarness(adoptedId='synthetic-unexpected'){
  let activeId=null,activeToken=null,signOutCount=0;
  const auth={
    async setSession(){activeId=adoptedId;activeToken='synthetic-adopted-access';return {data:{session:{access_token:activeToken,user:{id:adoptedId,email:tokens.user.email,email_confirmed_at:'2026-10-29T20:00:00Z'}}}};},
    async getSession(){return {data:{session:activeId?{access_token:activeToken,user:{id:activeId,email:tokens.user.email,email_confirmed_at:'2026-10-29T20:00:00Z'}}:null}};},
    async signOut(){signOutCount++;activeId=null;activeToken=null;return {error:null};}
  };
  const context={sb:{auth},currentAccountId:async()=>activeId,console,setTimeout};
  vm.runInNewContext(helpers,context,{timeout:1000});
  return {helpers:context.__helpers,auth,get activeId(){return activeId;},set activeId(value){activeId=value;if(value==='synthetic-newer-account')activeToken='synthetic-newer-access';},get signOutCount(){return signOutCount;}};
}

test('adopt tags the exact unexpected session ID on Supabase identity mismatch',async()=>{
  const h=sessionHarness();
  let failure;
  try{await h.helpers.adopt(tokens)}catch(err){failure=err}
  assert.ok(failure);
  assert.equal(failure.adoptedSessionId,'synthetic-unexpected');
  assert.equal(h.activeId,'synthetic-unexpected');
});

test('mismatched adopted session is cleared locally when still active',async()=>{
  const h=sessionHarness();
  let failure;
  try{await h.helpers.adopt(tokens)}catch(err){failure=err}
  await h.helpers.clearFailedLoginSession(failure.adoptedSessionId||tokens.user.id,null,failure.adoptedSessionToken);
  assert.equal(h.activeId,null);
  assert.equal(h.signOutCount,1);
});

test('rollback does not sign out a newer unrelated account',async()=>{
  const h=sessionHarness();
  let failure;
  try{await h.helpers.adopt(tokens)}catch(err){failure=err}
  h.activeId='synthetic-newer-account';
  await h.helpers.clearFailedLoginSession(failure.adoptedSessionId||tokens.user.id,null,failure.adoptedSessionToken);
  assert.equal(h.activeId,'synthetic-newer-account');
  assert.equal(h.signOutCount,0);
});

test('matching Supabase identity still adopts successfully',async()=>{
  const h=sessionHarness(tokens.user.id);
  const session=await h.helpers.adopt(tokens);
  assert.equal(session.user.id,tokens.user.id);
  assert.equal(h.signOutCount,0);
});

test('effective login handler passes unexpected adopted ID to rollback',async()=>{
  const a=source.indexOf('let loginBusy=false,activeLoginTitle=null;function bind(){');
  const b=source.indexOf('let pending=false;',a);
  assert.ok(a>=0&&b>a);
  const title={textContent:'Welcome back'};
  const email={value:tokens.user.email,focus(){}};
  const password={value:'synthetic-password-123',removeAttribute(){},focus(){}};
  const stay={checked:true};
  const button={disabled:false,textContent:'Log in'};
  const fields={'.kf73Title':title,'#kf73Email':email,'#kf73Password':password,'#kf73Stay':stay,'.kf73Primary':button};
  const form={isConnected:true,dataset:{},querySelector:k=>fields[k]||null,addEventListener(){}};
  const cleared=[];
  const context={
    document:{querySelector:()=>form,getElementById:id=>id==='authForm'?form:null},
    mode:()=> 'login',unlock(){},show(){},
    currentAccountId:async()=>null,
    tokenLogin:async()=>tokens,
    adopt:async()=>{const e=Error('Synthetic account mismatch');e.adoptedSessionId='synthetic-unexpected';e.adoptedSessionToken='synthetic-adopted-access';throw e},
    clearFailedLoginSession:async(id,original,accessToken)=>cleared.push({id,original,accessToken}),
    saveStay:()=>()=>{},friendly:s=>s,window:{},console
  };
  vm.runInNewContext(source.slice(a,b)+';bind();',context,{timeout:1000});
  await form.onsubmit({preventDefault(){},stopImmediatePropagation(){}});
  assert.equal(cleared.length,1);
  assert.equal(cleared[0].id,'synthetic-unexpected');
  assert.equal(cleared[0].original,null);
  assert.equal(cleared[0].accessToken,'synthetic-adopted-access');
  assert.equal(button.disabled,false);
});
