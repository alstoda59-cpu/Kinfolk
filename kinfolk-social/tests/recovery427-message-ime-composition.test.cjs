'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.resolve(__dirname,'../kinfolk-phase107.js'),'utf8');
const begin=source.indexOf('function safeRun(');
const end=source.indexOf('const pendingBlocks=',begin);
assert.ok(begin>=0&&end>begin,'effective mobile messaging helpers must exist');
const bind=vm.runInNewContext(source.slice(begin,end)+'\nbind',{
  console:{warn(){}}
},{timeout:1000});

function setup(tagName='TEXTAREA'){
  const calls=[];
  const button={textContent:'Send',dataset:{},type:'submit'};
  const input={tagName,dataset:{},handlers:[],addEventListener(type,fn,capture){
    if(type==='keydown')this.handlers.push({fn,capture});
  }};
  const form={
    dataset:{},
    onsubmit(){calls.push('send')},
    querySelectorAll(selector){
      if(selector==='button')return [button];
      if(selector==='input,textarea')return [input];
      throw Error('Unexpected selector: '+selector);
    },
    querySelector(selector){
      assert.equal(selector,'button');
      return button;
    }
  };
  bind(form);
  assert.equal(input.handlers.length,1);
  const keydown=(props={})=>{
    let prevented=0,stopped=0;
    input.handlers[0].fn({
      key:'Enter',shiftKey:false,isComposing:false,repeat:false,keyCode:13,
      ...props,
      preventDefault(){prevented++},
      stopImmediatePropagation(){stopped++}
    });
    return {prevented,stopped};
  };
  return {calls,button,input,form,keydown};
}

test('Recovery427 Android IME composition Enter does not send a message',()=>{
  const h=setup();
  assert.deepEqual(h.keydown({isComposing:true}),{prevented:0,stopped:0});
  assert.deepEqual(h.calls,[]);
});

test('Recovery427 Android legacy keyCode 229 does not send a message',()=>{
  const h=setup('INPUT');
  assert.deepEqual(h.keydown({keyCode:229}),{prevented:0,stopped:0});
  assert.deepEqual(h.calls,[]);
});

test('Recovery427 held Enter auto-repeat does not send another message',()=>{
  const h=setup();
  assert.deepEqual(h.keydown({repeat:true}),{prevented:0,stopped:0});
  assert.deepEqual(h.calls,[]);
});

test('Recovery427 a normal Enter after IME completion sends exactly once',()=>{
  const h=setup();
  h.keydown({isComposing:true});
  h.keydown({keyCode:229});
  const sent=h.keydown({isComposing:false,keyCode:13,repeat:false});
  assert.deepEqual(sent,{prevented:1,stopped:1});
  assert.deepEqual(h.calls,['send']);
});

test('Recovery427 Shift+Enter still creates a textarea newline',()=>{
  const h=setup();
  assert.deepEqual(h.keydown({shiftKey:true}),{prevented:0,stopped:0});
  assert.deepEqual(h.calls,[]);
});

test('Recovery427 button taps still submit without keyboard composition',()=>{
  const h=setup('INPUT');
  let prevented=0;
  h.button.onclick({preventDefault(){prevented++},stopImmediatePropagation(){}});
  assert.equal(prevented,1);
  assert.deepEqual(h.calls,['send']);
});
