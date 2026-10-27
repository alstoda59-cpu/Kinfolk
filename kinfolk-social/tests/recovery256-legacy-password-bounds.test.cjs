'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const source=filename=>fs.readFileSync(path.join(__dirname,'..',filename),'utf8');
const phase88=source('kinfolk-phase88.js');
const phase98=source('kinfolk-phase98.js');
const phase88Core=source('kinfolk-phase88-core.js');

function signupHarness(order,titleText='Create your Kinfolk') {
  const password={
    minLength:0,maxLength:12,autocomplete:'',type:'password',
    removeAttribute(name) {
      if(name==='minlength')this.minLength=0;
      if(name==='maxlength')this.maxLength=0;
    }
  };
  const title={textContent:titleText};
  const form={
    dataset:{kf73:'1'},
    querySelector(selector) {
      if(selector==='.kf73Title')return title;
      if(selector==='#kf73Password'||selector==='input[type="password"]')return password;
      return null;
    }
  };
  const intervals=[];
  const document={
    documentElement:{},
    visibilityState:'visible',
    querySelector(){return form},
    getElementById(id){return id==='authForm'?form:null},
    createElement(){return {onload:null,onerror:null,src:''}},
    head:{appendChild(script){if(script.onload)script.onload()}}
  };
  const window={};
  const context={
    document,window,sb:{auth:{}},
    MutationObserver:class{observe(){}disconnect(){}},
    setTimeout(fn){fn();return 1},
    clearTimeout(){},
    setInterval(fn){intervals.push(fn);return 1},
    console:{log(){},error(){}}
  };
  for(const name of order)vm.runInNewContext(name==='88'?phase88:phase98,context,{timeout:2500});
  return {password,intervals};
}

test('both legacy signup guards use the same 12-128 password bounds as Phase79',()=>{
  for(const [phase,s] of [['Phase88',phase88],['Phase98',phase98]]){
    assert.doesNotMatch(s,/pass\.minLength=5;pass\.maxLength=12/,phase+' must not silently cap signup passwords');
    assert.match(s,/pass\.minLength=12;pass\.maxLength=128/,phase+' must preserve the current policy');
  }
});

for(const order of [['88'],['98'],['88','98'],['98','88']]){
  test('signup password bounds persist through legacy guards '+order.join(' then '),()=>{
    const {password,intervals}=signupHarness(order);
    assert.equal(password.minLength,12);
    assert.equal(password.maxLength,128);
    assert.equal(password.autocomplete,'new-password');
    // These modules run interval/observer fallbacks during a long mobile signup.
    for(let repeat=0;repeat<3;repeat++){
      for(const fn of intervals)fn();
      assert.equal(password.minLength,12,'legacy fallback changed minLength');
      assert.equal(password.maxLength,128,'legacy fallback truncated long passwords');
    }
  });
}


test('Phase88 core no longer reinstalls obsolete signup password limits or hint',()=>{
  assert.doesNotMatch(phase88Core,/password\.minLength=5;password\.maxLength=12/);
  assert.doesNotMatch(phase88Core,/Use 5[–-]12 characters/);
  assert.match(phase88Core,/password\.minLength=12;password\.maxLength=128/);
});

function coreHarness(mode) {
  const title={textContent:mode==='signup'?'Create your Kinfolk':'Welcome back'};
  let hint='';
  const password={
    minLength:0,maxLength:12,autocomplete:'',
    removeAttribute(name){
      if(name==='minlength')this.minLength=0;
      if(name==='maxlength')this.maxLength=0;
    },
    insertAdjacentElement(_place,element){hint=element.textContent}
  };
  const form={
    querySelector(selector){
      if(selector==='.kf73Title')return title;
      if(selector==='#kf73Password')return password;
      return null;
    }
  };
  const document={
    documentElement:{},
    querySelector(selector){return selector==='#authForm[data-kf73="1"]'?form:null},
    getElementById(){return null},
    createElement(){return {textContent:'',className:'',id:''}}
  };
  vm.runInNewContext(phase88Core,{
    window:{},document,sb:{auth:{}},Date,
    MutationObserver:class{observe(){}},
    setTimeout(fn){fn();return 1},
    clearTimeout(){},
    console:{}
  },{timeout:2500});
  return {password,hint};
}

test('Phase88 core keeps full signup length and accurate hint in simulated DOM',()=>{
  const {password,hint}=coreHarness('signup');
  assert.equal(password.minLength,12);
  assert.equal(password.maxLength,128);
  assert.equal(password.autocomplete,'new-password');
  assert.match(hint,/12[–-]128/);
});

test('Phase88 core does not impose signup restrictions on existing-user login',()=>{
  const {password,hint}=coreHarness('login');
  assert.equal(password.minLength,0);
  assert.equal(password.maxLength,0);
  assert.equal(password.autocomplete,'current-password');
  assert.equal(hint,'');
});

for(const order of [['98'],['88','98'],['98','88']]){
  test('alternate Create Account heading retains 12-128 signup bounds '+order.join(' then '),()=>{
    const {password,intervals}=signupHarness(order,'Create Account');
    assert.equal(password.minLength,12);
    assert.equal(password.maxLength,128);
    assert.equal(password.autocomplete,'new-password');
    for(const fallback of intervals)fallback();
    assert.equal(password.minLength,12);
    assert.equal(password.maxLength,128);
  });
}
