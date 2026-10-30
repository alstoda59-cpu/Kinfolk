'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'..','kinfolk-phase76.js'),'utf8');
const begin=source.indexOf('    form.onsubmit=async e=>{',source.indexOf("function render(next='login')"));
const end=source.indexOf('    window.__KIN_FOLK_PHASE73__',begin);
assert.ok(begin>=0&&end>begin,'active Phase73 auth form submit handler exists');
const handler=source.slice(begin,end);
assert.match(source.slice(begin-450,begin),/delete form\.__kf330Pending/,'mode switching invalidates old request');

function deferred(){
  let resolve,reject;
  const promise=new Promise((yes,no)=>{resolve=yes;reject=no});
  return {promise,resolve,reject};
}
function harness(initialMode='login'){
  const calls=[],messages=[],stays=[];
  const form={isConnected:true,onsubmit:null,__kf330Pending:null,querySelector:s=>fields[s]||null};
  const root={querySelector:s=>s==='#authForm'?form:null};
  let fields;
  function replaceFields(mode){
    fields={
      '.kf73Primary':{disabled:false},
      '#kf73Email':{value:'first@example.test'},
      '#kf73Password':{value:'synthetic-password-123'},
      '#kf73Stay':{checked:true}
    };
    if(mode==='signup')fields['#kf73Name']={value:'Synthetic Alpha'};
  }
  replaceFields(initialMode);
  const ctx={
    form,root,mode:initialMode,
    location:{origin:'https://alpha.example.test'},
    msg:(_form,message,good)=>messages.push({message,good:!!good}),
    saveStay:value=>stays.push(value),
    sb:{auth:{
      signInWithPassword:args=>{const d=deferred();calls.push({kind:'login',args,...d});return d.promise},
      signUp:args=>{const d=deferred();calls.push({kind:'signup',args,...d});return d.promise}
    }}
  };
  vm.runInNewContext(handler,ctx,{timeout:1000});
  const submit=()=>form.onsubmit({preventDefault(){}});
  const switchMode=next=>{
    delete form.__kf330Pending;
    ctx.mode=next;
    replaceFields(next);
    vm.runInNewContext(handler,ctx,{timeout:1000});
  };
  return {ctx,form,root,calls,messages,stays,submit,switchMode,
    get fields(){return fields}};
}

test('login is sent once and confirms only its active form',async()=>{
  const h=harness(),request=h.submit();
  assert.equal(h.calls.length,1);
  assert.equal(h.calls[0].kind,'login');
  assert.equal(h.calls[0].args.email,'first@example.test');
  assert.equal(h.fields['.kf73Primary'].disabled,true);
  await h.submit();
  assert.equal(h.calls.length,1,'duplicate tap must not send a second login');
  assert.deepEqual(h.stays,[],'stay preference is not persisted before success');
  h.calls[0].resolve({error:null});
  await request;
  assert.equal(h.messages.length,1);
  assert.match(h.messages[0].message,/Logged in/);
  assert.equal(h.messages[0].good,true);
  assert.deepEqual(h.stays,[true]);
  assert.equal(h.fields['.kf73Primary'].disabled,true,'successful login remains locked until navigation');
});

test('failed login restores button and permits retry',async()=>{
  const h=harness(),request=h.submit();
  h.calls[0].resolve({error:{message:'Synthetic bad credentials'}});
  await request;
  assert.equal(h.messages[0].message,'Synthetic bad credentials');
  assert.equal(h.fields['.kf73Primary'].disabled,false);
  assert.deepEqual(h.stays,[]);
  const retry=h.submit();
  assert.equal(h.calls.length,2);
  h.calls[1].resolve({error:null});
  await retry;
  assert.equal(h.messages.at(-1).good,true);
});

test('switching to signup suppresses old login response and never unlocks new submit',async()=>{
  const h=harness(),old=h.submit();
  h.switchMode('signup');
  const current=h.submit();
  assert.equal(h.calls.length,2);
  assert.equal(h.calls[1].kind,'signup');
  const currentButton=h.fields['.kf73Primary'];
  assert.equal(currentButton.disabled,true);
  h.calls[0].resolve({error:null});
  await old;
  assert.deepEqual(h.messages,[]);
  assert.equal(currentButton.disabled,true);
  h.calls[1].resolve({data:{session:null},error:null});
  await current;
  assert.equal(currentButton.disabled,true,'successful signup remains locked until navigation');
  assert.equal(h.messages.length,1);
  assert.match(h.messages[0].message,/confirmation link/);
});

test('edited email while request is pending suppresses stale success',async()=>{
  const h=harness(),request=h.submit();
  h.fields['#kf73Email'].value='second@example.test';
  h.calls[0].resolve({error:null});
  await request;
  assert.deepEqual(h.messages,[]);
  assert.deepEqual(h.stays,[]);
  assert.equal(h.fields['.kf73Primary'].disabled,false);
});

test('edited password while request is pending suppresses stale error',async()=>{
  const h=harness(),request=h.submit();
  h.fields['#kf73Password'].value='another-synthetic-password';
  h.calls[0].resolve({error:{message:'Sensitive previous password error'}});
  await request;
  assert.deepEqual(h.messages,[]);
});

test('detached form cannot display an old result',async()=>{
  const h=harness(),request=h.submit();
  h.form.isConnected=false;
  h.calls[0].resolve({error:null});
  await request;
  assert.deepEqual(h.messages,[]);
  assert.deepEqual(h.stays,[]);
});

test('signup preserves callback and profile metadata but avoids claiming creation without session',async()=>{
  const h=harness('signup'),request=h.submit();
  assert.equal(h.calls.length,1);
  assert.equal(h.calls[0].kind,'signup');
  assert.equal(h.calls[0].args.options.emailRedirectTo,'https://alpha.example.test');
  assert.equal(h.calls[0].args.options.data.display_name,'Synthetic Alpha');
  h.calls[0].resolve({data:{session:null,user:null},error:null});
  await request;
  assert.match(h.messages[0].message,/If this email is eligible/);
  assert.doesNotMatch(h.messages[0].message,/Account created/);
});

test('signup validates password before calling backend and can retry',async()=>{
  const h=harness('signup');
  h.fields['#kf73Password'].value='short';
  await h.submit();
  assert.equal(h.calls.length,0);
  assert.match(h.messages[0].message,/12–128/);
  assert.equal(h.fields['.kf73Primary'].disabled,false);
  h.fields['#kf73Password'].value='synthetic-password-123';
  const request=h.submit();
  assert.equal(h.calls.length,1);
  h.calls[0].resolve({data:{session:null},error:null});
  await request;
});

test('editing signup display name invalidates old completion',async()=>{
  const h=harness('signup'),request=h.submit();
  h.fields['#kf73Name'].value='New Synthetic Name';
  h.calls[0].resolve({data:{session:null},error:null});
  await request;
  assert.deepEqual(h.messages,[]);
  assert.deepEqual(h.stays,[]);
});
