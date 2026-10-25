'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase95.js','utf8');

function fixture(){
  let title='Welcome Back',message=null,requests=0;
  const fields={
    '.kf73Title':{get textContent(){return title}},
    '#kf73Email':{value:'',focus(){}},
    '#kf73Password':{value:'synthetic-password',removeAttribute(){}},
    '#kf73Stay':{checked:false},
    '.kf73Primary':{disabled:false,textContent:'Log in'}
  };
  const form={
    isConnected:true,
    querySelector(selector){return selector==='.kf73Msg'?message:fields[selector]||null},
    appendChild(el){message=el},
    onsubmit:null
  };
  const document={
    documentElement:{},visibilityState:'visible',
    querySelector(){return form},getElementById(){return null},
    createElement(){return {style:{}}}
  };
  const sb={auth:{getSession:async()=>({data:{session:null},error:null})}};
  const timers=[];
  vm.runInNewContext(source,{
    window:{},document,sb,console,AbortController,
    fetch:async()=>{requests++;throw Error('Network must not be reached in these tests')},
    localStorage:{getItem(){return null},setItem(){},removeItem(){}},
    sessionStorage:{getItem(){return null},setItem(){},removeItem(){}},
    MutationObserver:class{observe(){}},
    setInterval(){},
    setTimeout(fn,ms){if(ms===0)timers.push(fn);return 1},
    clearTimeout(){}
  });
  timers.forEach(fn=>fn());
  assert.equal(typeof form.onsubmit,'function');
  return {
    setMode(value){title=value},
    async submit(immediate=true){
      const calls={prevented:0,immediate:0,bubbled:0};
      const event={
        preventDefault(){calls.prevented++},
        stopPropagation(){calls.bubbled++}
      };
      if(immediate)event.stopImmediatePropagation=()=>{calls.immediate++};
      await form.onsubmit(event);
      return calls;
    },
    get message(){return message?.textContent||''},
    get requests(){return requests}
  };
}

test('login intercepts submit before competing form handlers',async()=>{
  const f=fixture();
  const calls=await f.submit();
  assert.equal(calls.prevented,1);
  assert.equal(calls.immediate,1);
  assert.equal(calls.bubbled,0);
  assert.match(f.message,/Enter your email address/);
  assert.equal(f.requests,0);
});

test('a reused signup form is not swallowed by stale login handler',async()=>{
  const f=fixture();
  f.setMode('Create Your Kinfolk');
  const calls=await f.submit();
  assert.deepEqual(calls,{prevented:0,immediate:0,bubbled:0});
  assert.equal(f.requests,0);
});

test('login falls back to stopPropagation when immediate stop is unavailable',async()=>{
  const f=fixture();
  const calls=await f.submit(false);
  assert.equal(calls.prevented,1);
  assert.equal(calls.bubbled,1);
  assert.equal(calls.immediate,0);
});
