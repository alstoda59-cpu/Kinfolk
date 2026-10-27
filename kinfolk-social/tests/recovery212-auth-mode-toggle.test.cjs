'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase98.js','utf8');

// Synthetic DOM test only. It does not authenticate or launch a mobile WebView.
test('reused login form restores signup submit and password rules, then login',()=>{
  const timers=[];
  const observers=[];
  class FakeMutationObserver{
    constructor(fn){this.fn=fn;this.disconnected=false;observers.push(this)}
    observe(){}
    disconnect(){this.disconnected=true}
  }
  const pass={
    dataset:{kf98:'1'},value:'testpass',type:'password',
    removeAttribute(){},addEventListener(){},autocomplete:'',minLength:5,maxLength:12
  };
  const button={type:'submit',onclick:null};
  const title={textContent:'Welcome back'};
  const form={
    dataset:{},
    __kf95Handler(){},
    querySelector(selector){
      if(selector==='.kf73Title')return title;
      if(selector==='#kf73Password'||selector==='input[type="password"]')return pass;
      if(selector==='.kf73Primary')return button;
      return null;
    },
    querySelectorAll(){return []}
  };
  const document={
    documentElement:{},visibilityState:'visible',
    getElementById(id){return id==='authForm'?form:null}
  };
  const sandbox={
    window:{},document,MutationObserver:FakeMutationObserver,
    setTimeout(fn){timers.push(fn);return timers.length},
    clearTimeout(){},setInterval(){},
    console:{log(){},warn(){}}
  };
  const flush=()=>{const batch=timers.splice(0);for(const fn of batch)fn()};
  vm.runInNewContext(source,sandbox,{timeout:2000});
  flush();
  assert.equal(button.type,'button','login uses its existing click handler');
  assert.equal(typeof button.onclick,'function');
  assert.equal(pass.maxLength,128,'login permits existing longer passwords');

  title.textContent='Create your Kinfolk';
  observers[0].fn();
  flush();
  assert.equal(button.type,'submit','signup must submit through the Phase79 capturing handler');
  assert.equal(button.onclick,null,'signup must not call the Phase95 login handler');
  assert.equal(pass.minLength,12);
  assert.equal(pass.maxLength,128);
  assert.equal(pass.autocomplete,'new-password');

  title.textContent='Welcome back';
  observers[0].fn();
  flush();
  assert.equal(button.type,'button');
  assert.equal(typeof button.onclick,'function');
  assert.equal(pass.maxLength,128);
});
