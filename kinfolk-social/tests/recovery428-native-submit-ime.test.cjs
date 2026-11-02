'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.resolve(__dirname,'../kinfolk-phase107.js'),'utf8');
const begin=source.indexOf('function safeRun(');
const end=source.indexOf('const pendingBlocks=',begin);
assert.ok(begin>=0&&end>begin,'effective mobile message submit helpers exist');
const bind=vm.runInNewContext(source.slice(begin,end)+'\nbind',{
  console:{warn(){}},Date
},{timeout:1000});

function setup(){
  const calls=[],listeners={};
  const button={textContent:'Send',dataset:{},type:'submit',disabled:false};
  const input={
    tagName:'INPUT',dataset:{},listeners:{},
    addEventListener(type,fn,capture){
      (this.listeners[type]??=[]).push({fn,capture});
    }
  };
  const form={
    isConnected:true,dataset:{},onsubmit(){calls.push('send')},
    addEventListener(type,fn,capture){
      (listeners[type]??=[]).push({fn,capture});
    },
    querySelectorAll(selector){
      if(selector==='button')return [button];
      if(selector==='input,textarea')return [input];
      throw Error('Unexpected selector '+selector);
    },
    querySelector(selector){
      assert.equal(selector,'button');return button;
    }
  };
  bind(form);
  const emit=(type,props={})=>{
    let prevented=0,stopped=0;
    const event={
      key:'Enter',keyCode:13,shiftKey:false,isComposing:false,repeat:false,
      preventDefault(){prevented++},stopImmediatePropagation(){stopped++},
      ...props
    };
    for(const {fn} of listeners[type]||[])fn(event);
    return {prevented,stopped};
  };
  const keydown=(props={})=>{
    let prevented=0,stopped=0;
    const event={
      key:'Enter',keyCode:13,shiftKey:false,isComposing:false,repeat:false,
      preventDefault(){prevented++},stopImmediatePropagation(){stopped++},
      ...props
    };
    for(const {fn} of input.listeners.keydown||[])fn(event);
    return {prevented,stopped};
  };
  const click=()=>{
    let prevented=0;
    button.onclick({preventDefault(){prevented++},stopImmediatePropagation(){}});
    return prevented;
  };
  return {calls,listeners,button,input,form,emit,keydown,click};
}

test('Recovery428 native requestSubmit uses one guarded handler and prevents browser default',()=>{
  const h=setup();
  const result=h.emit('submit');
  assert.deepEqual(result,{prevented:1,stopped:1});
  assert.deepEqual(h.calls,['send']);
  assert.equal(h.button.type,'button');
});

test('Recovery428 repeated binding does not stack native submit or composition listeners',()=>{
  const h=setup();
  bind(h.form);bind(h.form);
  assert.equal(h.listeners.submit.length,1);
  assert.equal(h.listeners.compositionstart.length,1);
  assert.equal(h.listeners.compositionend.length,1);
  h.emit('submit');
  assert.deepEqual(h.calls,['send']);
});

test('Recovery428 native submit and button tap share async pending lock',async()=>{
  const h=setup();let release;
  h.form.onsubmit=()=>{h.calls.push('send');return new Promise(r=>{release=r})};
  bind(h.form);
  h.emit('submit');
  h.click();
  h.keydown();
  assert.deepEqual(h.calls,['send']);
  assert.equal(h.form.dataset.kf107Busy,'1');
  release();await new Promise(r=>setImmediate(r));
  assert.equal(h.form.dataset.kf107Busy,undefined);
  h.click();assert.deepEqual(h.calls,['send','send']);
  release();await new Promise(r=>setImmediate(r));
});

test('Recovery428 native submit while IME composition is active never sends',()=>{
  const h=setup();
  h.emit('compositionstart');
  assert.equal(h.form.__kf107Composing,true);
  assert.deepEqual(h.emit('submit'),{prevented:1,stopped:1});
  assert.deepEqual(h.calls,[]);
});

test('Recovery428 iOS post-composition ghost submit is ignored until cooldown expires',()=>{
  const h=setup();
  h.emit('compositionstart');h.emit('compositionend');
  assert.equal(h.form.__kf107Composing,false);
  assert.deepEqual(h.emit('submit'),{prevented:1,stopped:1});
  assert.deepEqual(h.calls,[]);
  h.form.__kf107ImeUntil=Date.now()-1;
  h.emit('submit');
  assert.deepEqual(h.calls,['send']);
});

test('Recovery428 iOS post-composition Enter with isComposing=false cannot send',()=>{
  const h=setup();
  h.emit('compositionstart');
  assert.deepEqual(h.keydown({isComposing:false,keyCode:13}),{prevented:0,stopped:0});
  h.emit('compositionend');
  assert.deepEqual(h.keydown({isComposing:false,keyCode:13}),{prevented:0,stopped:0});
  assert.deepEqual(h.calls,[]);
  h.form.__kf107ImeUntil=0;
  assert.deepEqual(h.keydown(),{prevented:1,stopped:1});
  assert.deepEqual(h.calls,['send']);
});

test('Recovery428 detached old DM form cannot submit through stale button or Enter',()=>{
  const h=setup();
  h.form.isConnected=false;
  h.click();h.keydown();h.emit('submit');
  assert.deepEqual(h.calls,[]);
});

test('Recovery428 disabled Send button blocks keyboard and native submits',()=>{
  const h=setup();
  h.button.disabled=true;
  h.keydown();h.emit('submit');
  assert.deepEqual(h.calls,[]);
  h.button.disabled=false;
  h.emit('submit');
  assert.deepEqual(h.calls,['send']);
});

test('Recovery428 ordinary button taps remain functional after composition cooldown',()=>{
  const h=setup();
  h.emit('compositionstart');h.emit('compositionend');
  assert.equal(h.click(),1);
  assert.deepEqual(h.calls,['send'],'explicit Send tap is not suppressed by IME cooldown');
});
