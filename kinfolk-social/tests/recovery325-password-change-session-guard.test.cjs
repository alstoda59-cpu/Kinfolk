'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'..','kinfolk-phase76.js'),'utf8');
const start=source.indexOf('// Recovery325: bind password changes');
const end=source.indexOf('window.openNotificationDetails=',start);
assert.ok(start>=0&&end>start,'active account security handler exists');
const handler=source.slice(start,end);
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
function deferred(){
  let resolve,reject;
  const promise=new Promise((res,rej)=>{resolve=res;reject=rej});
  return {promise,resolve,reject};
}
function harness(){
  const requests=[],toasts=[];
  let screen=null,closed=0;
  const ctx={
    state:{user:{id:A}},kf129Epoch:1,
    toast:(...args)=>toasts.push(args),
    sub:(title,html)=>{
      if(screen)screen.form.isConnected=false;
      const button={disabled:false,textContent:'Update password'};
      const form={isConnected:true,onsubmit:null,querySelector:s=>s==='button[type="submit"]'?button:null};
      screen={title,html,form,button,password:{value:'long-synthetic-passphrase'},confirmation:{value:'long-synthetic-passphrase'}};
    },
    $:selector=>{
      if(!screen)return null;
      return ({'#kfsPasswordForm':screen.form,'#kfsNewPassword':screen.password,'#kfsConfirmPassword':screen.confirmation})[selector]||null;
    },
    closeKfsSub:()=>{closed++;if(screen)screen.form.isConnected=false;},
    sb:{auth:{updateUser:args=>{
      const gate=deferred();requests.push({args,...gate});return gate.promise;
    }}}
  };
  ctx.window=ctx;
  vm.runInNewContext(handler,ctx,{timeout:1000});
  const open=()=>{ctx.openAccountSecurity();return screen};
  const submit=target=>target.form.onsubmit({preventDefault(){}});
  return {ctx,requests,toasts,open,submit,get screen(){return screen},get closed(){return closed}};
}
test('confirmed password change clears fields and closes only its own screen',async()=>{
  const h=harness(),screen=h.open();
  const pending=h.submit(screen);
  assert.equal(h.requests.length,1);
  assert.equal(h.requests[0].args.password,'long-synthetic-passphrase');
  assert.equal(screen.button.disabled,true);
  h.requests[0].resolve({data:{user:{id:A}},error:null});
  await pending;
  assert.equal(h.toasts[0][0],'Password updated');
  assert.equal(h.closed,1);
  assert.equal(screen.password.value,'');
  assert.equal(screen.confirmation.value,'');
});
test('password policy and confirmation mismatch block writes',async()=>{
  const h=harness(),screen=h.open();
  screen.password.value='short';
  await h.submit(screen);
  assert.equal(h.requests.length,0);
  screen.password.value='long-synthetic-passphrase';
  screen.confirmation.value='different-synthetic-passphrase';
  await h.submit(screen);
  assert.equal(h.requests.length,0);
  assert.equal(h.toasts.length,2);
});
test('duplicate submit cannot start a second password mutation',async()=>{
  const h=harness(),screen=h.open();
  const first=h.submit(screen);
  await h.submit(screen);
  assert.equal(h.requests.length,1);
  h.requests[0].resolve({data:{user:{id:A}},error:null});
  await first;
});
test('account switch during update suppresses old success and modal closure',async()=>{
  const h=harness(),screen=h.open(),pending=h.submit(screen);
  h.ctx.state.user={id:B};
  h.requests[0].resolve({data:{user:{id:A}},error:null});
  await pending;
  assert.equal(h.toasts.length,0);
  assert.equal(h.closed,0);
  assert.equal(screen.password.value,'long-synthetic-passphrase');
});
test('same-account reactivation rejects stale update feedback',async()=>{
  const h=harness(),screen=h.open(),pending=h.submit(screen);
  h.ctx.kf129Epoch++;
  h.requests[0].resolve({data:{user:{id:A}},error:null});
  await pending;
  assert.equal(h.closed,0);
  assert.equal(h.toasts.length,0);
  await h.submit(screen);
  assert.equal(h.requests.length,1,'old form must not write under a new activation');
});
test('reopened security screen cannot be closed by older request',async()=>{
  const h=harness(),old=h.open(),oldPending=h.submit(old);
  const newer=h.open(),newPending=h.submit(newer);
  assert.equal(h.requests.length,2);
  h.requests[0].resolve({data:{user:{id:A}},error:null});
  await oldPending;
  assert.equal(h.closed,0);
  assert.equal(newer.button.disabled,true);
  h.requests[1].resolve({data:{user:{id:A}},error:null});
  await newPending;
  assert.equal(h.closed,1);
  assert.equal(h.toasts.length,1);
});
test('auth failure restores button and permits a new attempt',async()=>{
  const h=harness(),screen=h.open(),pending=h.submit(screen);
  h.requests[0].resolve({data:{user:null},error:{message:'Reauthentication required'}});
  await pending;
  assert.equal(h.toasts[0][0],'Reauthentication required');
  assert.equal(screen.button.disabled,false);
  assert.equal(screen.button.textContent,'Update password');
  const retry=h.submit(screen);
  assert.equal(h.requests.length,2);
  h.requests[1].resolve({data:{user:{id:A}},error:null});
  await retry;
  assert.equal(h.closed,1);
});
test('unconfirmed or wrong-account auth response never claims password changed',async()=>{
  for(const user of [null,{id:B}]){
    const h=harness(),screen=h.open(),pending=h.submit(screen);
    h.requests[0].resolve({data:{user},error:null});
    await pending;
    assert.equal(h.closed,0);
    assert.match(h.toasts[0][0],/could not be confirmed/);
    assert.equal(screen.button.disabled,false);
  }
});
test('signed-out user cannot open or submit account security',()=>{
  const h=harness();h.ctx.state.user=null;
  assert.equal(h.ctx.openAccountSecurity(),undefined);
  assert.equal(h.screen,null);
  assert.equal(h.requests.length,0);
  assert.match(h.toasts[0][0],/Sign in/);
});
