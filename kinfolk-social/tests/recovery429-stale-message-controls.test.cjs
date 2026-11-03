'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.resolve(__dirname,'../kinfolk-phase107.js'),'utf8');
const start=source.indexOf('function safeRun(');
const end=source.indexOf('const pendingBlocks=',start);
assert.ok(start>=0&&end>start,'effective Phase107 messaging helpers exist');
const bind=vm.runInNewContext(source.slice(start,end)+'\nbind',{
  console:{warn(){}},Date
},{timeout:1000});

function harness(){
  const calls=[],listeners={};
  const button=()=>({textContent:'Send',type:'submit',dataset:{},isConnected:true});
  const field=()=>({tagName:'INPUT',dataset:{},isConnected:true,handlers:[],
    addEventListener(type,fn){if(type==='keydown')this.handlers.push(fn)}});
  const firstButton=button(),firstField=field();
  const form={
    isConnected:true,dataset:{},buttons:[firstButton],fields:[firstField],
    onsubmit(){calls.push('send')},
    contains(node){return this.buttons.includes(node)||this.fields.includes(node)},
    addEventListener(type,fn){(listeners[type]??=[]).push(fn)},
    querySelectorAll(selector){
      if(selector==='button')return this.buttons;
      if(selector==='input,textarea')return this.fields;
      throw Error('Unexpected selector '+selector);
    },
    querySelector(selector){assert.equal(selector,'button');return this.buttons[0]||null}
  };
  bind(form);
  const click=btn=>{
    let prevented=0,stopped=0;
    btn.onclick({preventDefault(){prevented++},stopImmediatePropagation(){stopped++}});
    return {prevented,stopped};
  };
  const enter=el=>{
    let prevented=0,stopped=0;
    for(const fn of el.handlers)fn({key:'Enter',keyCode:13,isComposing:false,repeat:false,
      shiftKey:false,preventDefault(){prevented++},stopImmediatePropagation(){stopped++}});
    return {prevented,stopped};
  };
  const nativeSubmit=(submitter)=>{
    for(const fn of listeners.submit||[])fn({submitter,preventDefault(){},stopImmediatePropagation(){}});
  };
  return {calls,form,firstButton,firstField,button,field,click,enter,nativeSubmit};
}

test('Recovery429 current Send and Enter remain functional',()=>{
  const h=harness();
  assert.deepEqual(h.click(h.firstButton),{prevented:1,stopped:1});
  assert.deepEqual(h.enter(h.firstField),{prevented:1,stopped:1});
  assert.deepEqual(h.calls,['send','send']);
});

test('Recovery429 old Send button cannot send after replacement while form remains mounted',()=>{
  const h=harness(),newButton=h.button();
  h.form.buttons=[newButton];
  h.form.contains(h.firstButton)===false||assert.fail('old button must be outside form');
  bind(h.form);
  assert.deepEqual(h.click(h.firstButton),{prevented:1,stopped:1});
  assert.deepEqual(h.calls,[]);
  h.click(newButton);
  assert.deepEqual(h.calls,['send']);
});

test('Recovery429 detached stale Send button cannot invoke old onclick',()=>{
  const h=harness(),newButton=h.button();
  h.form.buttons=[newButton];
  h.firstButton.isConnected=false;
  bind(h.form);
  h.click(h.firstButton);
  assert.deepEqual(h.calls,[]);
  h.click(newButton);
  assert.deepEqual(h.calls,['send']);
});

test('Recovery429 replaced input cannot send from a stale keydown listener',()=>{
  const h=harness(),newField=h.field();
  h.form.fields=[newField];
  bind(h.form);
  assert.deepEqual(h.enter(h.firstField),{prevented:0,stopped:0});
  assert.deepEqual(h.calls,[]);
  assert.deepEqual(h.enter(newField),{prevented:1,stopped:1});
  assert.deepEqual(h.calls,['send']);
});

test('Recovery429 explicitly detached input cannot send after a modal rerender',()=>{
  const h=harness(),newField=h.field();
  h.form.fields=[newField];
  h.firstField.isConnected=false;
  bind(h.form);
  h.enter(h.firstField);
  assert.deepEqual(h.calls,[]);
  h.enter(newField);
  assert.deepEqual(h.calls,['send']);
});

test('Recovery429 rebinding the same live controls does not duplicate sends',()=>{
  const h=harness();
  bind(h.form);bind(h.form);
  assert.equal(h.firstField.handlers.length,1);
  h.enter(h.firstField);
  assert.deepEqual(h.calls,['send']);
});

test('Recovery429 native submit still routes through the current live form',()=>{
  const h=harness(),newButton=h.button(),newField=h.field();
  h.form.buttons=[newButton];h.form.fields=[newField];
  bind(h.form);
  h.nativeSubmit();
  assert.deepEqual(h.calls,['send']);
});


test('Recovery430 native submit ignores replaced or detached Send submitters',()=>{
  const h=harness(),replacement=h.button();
  h.form.buttons=[replacement];bind(h.form);
  h.nativeSubmit(h.firstButton);
  assert.deepEqual(h.calls,[]);
  h.firstButton.isConnected=false;
  h.nativeSubmit(h.firstButton);
  assert.deepEqual(h.calls,[]);
  h.nativeSubmit(replacement);
  assert.deepEqual(h.calls,['send']);
});

test('Recovery430 native submit ignores disabled or foreign submitters',()=>{
  const h=harness(),foreign=h.button();
  h.nativeSubmit(foreign);
  h.firstButton.disabled=true;
  h.nativeSubmit(h.firstButton);
  assert.deepEqual(h.calls,[]);
  h.firstButton.disabled=false;
  h.nativeSubmit(h.firstButton);
  assert.deepEqual(h.calls,['send']);
});
