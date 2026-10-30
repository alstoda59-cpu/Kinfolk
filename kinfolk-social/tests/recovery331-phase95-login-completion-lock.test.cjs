'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

// Exercise the capture-phase Phase95 login handler actually installed at runtime,
// rather than only the earlier Phase73 onsubmit handler that Phase95 overrides.
const source=fs.readFileSync(path.join(__dirname,'..','kinfolk-phase95.js'),'utf8');
const start=source.indexOf('let loginBusy=false,activeLoginTitle=null;function bind(){');
const end=source.indexOf('let pending=false;',start);
assert.ok(start>=0&&end>start,'active Phase95 login binding exists');
const handler=source.slice(start,end)+';bind();';

function harness(){
  const title={textContent:'Welcome back'};
  const email={value:'synthetic@example.invalid',focus(){}};
  const password={value:'synthetic-password-123',removeAttribute(){},focus(){}};
  const stay={checked:true};
  const button={disabled:false,textContent:'Log in'};
  const messages=[],calls=[];
  let activeId=null,failActivation=false;
  const fields={'.kf73Title':title,'#kf73Email':email,'#kf73Password':password,'#kf73Stay':stay,'.kf73Primary':button};
  const form={isConnected:true,dataset:{},onsubmit:null,querySelector:key=>fields[key]||null,addEventListener(){}};
  const session={user:{id:'synthetic-user-a',email:'synthetic@example.invalid'}};
  const context={
    document:{querySelector:()=>form,getElementById:id=>id==='authForm'?form:null},
    mode:()=>title.textContent==='Welcome back'?'login':'signup',
    unlock:()=>{},show:(_form,message,good)=>messages.push({message,good:!!good}),
    currentAccountId:async()=>activeId,
    tokenLogin:async()=>{calls.push('token');return {user:session.user,access_token:'synthetic-access',refresh_token:'synthetic-refresh'}},
    adopt:async()=>{calls.push('adopt');activeId=session.user.id;return session},
    activateLoginSession:async()=>{calls.push('activate');if(failActivation)throw Error('Synthetic activation failure')},
    saveStay:()=>()=>{calls.push('restoreStay')},
    clearFailedLoginSession:async()=>{calls.push('rollback');activeId=null},
    friendly:s=>String(s),window:{},console
  };
  vm.runInNewContext(handler,context,{timeout:1000});
  const submit=()=>form.onsubmit({preventDefault(){},stopImmediatePropagation(){}});
  return {form,title,button,messages,calls,submit,setFailActivation:value=>{failActivation=value}};
}

test('successful verified Phase95 login leaves submit locked until navigation',async()=>{
  const h=harness();
  await h.submit();
  assert.deepEqual(h.calls,['token','adopt','activate']);
  assert.equal(h.button.disabled,true);
  assert.equal(h.form.__kf95CompletedTitle,h.title);
  assert.equal(h.messages.at(-1).good,true);
});

test('second submit after successful Phase95 login cannot dispatch another token request',async()=>{
  const h=harness();
  await h.submit();
  await h.submit();
  assert.equal(h.calls.filter(call=>call==='token').length,1);
  assert.equal(h.messages.length,1);
  assert.equal(h.button.disabled,true);
});

test('failed account activation rolls back, unlocks the form and permits retry',async()=>{
  const h=harness();
  h.setFailActivation(true);
  await h.submit();
  assert.ok(h.calls.includes('rollback'));
  assert.equal(h.button.disabled,false);
  assert.notEqual(h.form.__kf95CompletedTitle,h.title);
  assert.equal(h.messages.at(-1).good,false);
  h.setFailActivation(false);
  await h.submit();
  assert.equal(h.calls.filter(call=>call==='token').length,2);
  assert.equal(h.button.disabled,true);
  assert.equal(h.messages.at(-1).good,true);
});
