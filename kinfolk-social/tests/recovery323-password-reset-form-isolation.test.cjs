'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'..','kinfolk-phase76.js'),'utf8');
const start=source.indexOf("const forgot=form.querySelector('.kf73Forgot');\n      forgot.onclick=async()=>");
const end=source.indexOf('\n    }else{',start);
assert.ok(start>=0&&end>start,'active mobile login password-reset handler exists');
const install=new Function('form','mode','window','sb','passwordResetRedirectOptions','msg','setTimeout','clearTimeout',
  source.slice(start,end)+'\nreturn forgot;');

function harness({callbackError=false}={}){
  const listeners=new Set();
  const emailField={
    value:'alpha@example.test',
    focused:false,
    focus(){this.focused=true},
    addEventListener(event,fn){if(event==='input')listeners.add(fn)},
    removeEventListener(event,fn){if(event==='input')listeners.delete(fn)},
    change(value){this.value=value;for(const fn of [...listeners])fn()}
  };
  const title={};
  const button={disabled:false,isConnected:true};
  const elements={'.kf73Forgot':button,'#kf73Email':emailField,'.kf73Title':title};
  const form={isConnected:true,querySelector(selector){return elements[selector]||null}};
  const window={state:{user:null}};
  const messages=[];
  let resolveRequest,rejectRequest,calls=0,receivedEmail=null,receivedOptions=null;
  const pending=new Promise((resolve,reject)=>{resolveRequest=resolve;rejectRequest=reject});
  const sb={auth:{resetPasswordForEmail(email,options){
    calls++;receivedEmail=email;receivedOptions=options;return pending;
  }}};
  const timers=new Map();
  let timerId=0;
  const setTimeout=(fn,delay)=>{const id=++timerId;timers.set(id,{fn,delay});return id};
  const clearTimeout=id=>timers.delete(id);
  install(form,'login',window,sb,
    ()=>{if(callbackError)throw new Error('Native callback unavailable');return {redirectTo:'https://alpha.example.test/reset'}},
    (_form,message,good)=>messages.push({message,good:!!good}),setTimeout,clearTimeout);
  return {
    form,window,button,title,elements,emailField,messages,timers,
    resolveRequest,rejectRequest,
    get calls(){return calls},
    get receivedEmail(){return receivedEmail},
    get receivedOptions(){return receivedOptions}
  };
}

test('successful reset remains scoped to the requested email and restores control',async()=>{
  const h=harness();
  const request=h.button.onclick();
  assert.equal(h.calls,1);
  assert.equal(h.receivedEmail,'alpha@example.test');
  assert.deepEqual(h.receivedOptions,{redirectTo:'https://alpha.example.test/reset'});
  assert.equal(h.button.disabled,true);
  h.resolveRequest({error:null});
  await request;
  assert.equal(h.button.disabled,false);
  assert.equal(h.messages.length,1);
  assert.match(h.messages[0].message,/reset link has been requested/);
  assert.equal(h.messages[0].good,true);
});
test('changing the email during reset suppresses old success and unlocks the current form',async()=>{
  const h=harness();
  const request=h.button.onclick();
  h.emailField.change('beta@example.test');
  h.resolveRequest({error:null});
  await request;
  assert.deepEqual(h.messages,[]);
  assert.equal(h.button.disabled,false);
});
test('replaced login screen cannot receive stale reset status',async()=>{
  const h=harness();
  const request=h.button.onclick();
  h.elements['.kf73Title']={};
  h.elements['.kf73Forgot']={disabled:false,isConnected:true};
  h.button.isConnected=false;
  h.resolveRequest({error:new Error('Sensitive old-account failure')});
  await request;
  assert.deepEqual(h.messages,[]);
});
test('account switching during pending reset hides previous account feedback',async()=>{
  const h=harness();
  const request=h.button.onclick();
  h.window.state.user={id:'synthetic-other-user'};
  h.resolveRequest({error:null});
  await request;
  assert.deepEqual(h.messages,[]);
  assert.equal(h.button.disabled,false);
});
test('duplicate taps cannot send another reset while the first request is pending',async()=>{
  const h=harness();
  const first=h.button.onclick();
  await h.button.onclick();
  assert.equal(h.calls,1);
  h.resolveRequest({error:null});
  await first;
});
test('missing native callback fails before sending an Auth request',async()=>{
  const h=harness({callbackError:true});
  await h.button.onclick();
  assert.equal(h.calls,0);
  assert.equal(h.button.disabled,false);
  assert.match(h.messages[0].message,/Native callback unavailable/);
});
test('bounded mobile timeout reports uncertainty rather than claiming delivery',async()=>{
  const h=harness();
  const request=h.button.onclick();
  const timer=[...h.timers.values()][0];
  assert.equal(timer.delay,20000);
  timer.fn();
  await request;
  assert.equal(h.calls,1);
  assert.match(h.messages[0].message,/may still arrive/);
  assert.equal(h.button.disabled,false);
});
