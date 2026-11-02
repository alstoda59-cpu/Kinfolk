'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.resolve(__dirname,'../kinfolk-phase107.js'),'utf8');
const begin=source.indexOf('function safeRun(');
const end=source.indexOf('const pendingBlocks=',begin);
assert.ok(begin>=0&&end>begin,'effective Phase107 messaging submit helpers exist');
const bind=vm.runInNewContext(source.slice(begin,end)+'\nbind',{
  console:{warn(){}}
},{timeout:1000});

function button(label='Send'){
  return {textContent:label,dataset:{},type:'submit',onclick:null,
    onpointerup(){},ontouchend(){},onkeydown(){}};
}
function field(tagName='INPUT',dataset={}){
  return {tagName,dataset,handlers:[],
    addEventListener(name,fn,capture){this.handlers.push({name,fn,capture})},
    keydown(key='Enter',shiftKey=false){
      let prevented=0,stopped=0;
      for(const h of this.handlers.filter(h=>h.name==='keydown')){
        h.fn({key,shiftKey,preventDefault(){prevented++},
          stopImmediatePropagation(){stopped++}});
      }
      return {prevented,stopped};
    }};
}
function harness(){
  const calls=[],first=button(),input=field();
  const form={dataset:{},buttons:[first],fields:[input],
    onsubmit(){calls.push('original')},
    querySelectorAll(selector){
      if(selector==='button')return this.buttons;
      if(selector==='input,textarea')return this.fields;
      throw new Error('Unexpected selector '+selector);
    },
    querySelector(selector){
      assert.equal(selector,'button');
      return this.buttons[0]||null;
    }};
  const click=btn=>{
    let prevented=0,stopped=0;
    assert.equal(typeof btn.onclick,'function','Send must have a click handler');
    btn.onclick({preventDefault(){prevented++},stopImmediatePropagation(){stopped++}});
    assert.equal(prevented,1);
    assert.equal(stopped,1);
  };
  return {form,calls,first,input,click};
}

test('Recovery404 initial mobile Send binds once and bypasses native double-submit',()=>{
  const h=harness();
  bind(h.form);bind(h.form);
  assert.equal(h.first.type,'button');
  assert.equal(h.form.dataset.kf107,'1');
  h.click(h.first);
  assert.deepEqual(h.calls,['original']);
  assert.equal(h.input.handlers.length,1);
});

test('Recovery404 replaced Send button works even when original form retains dataset flag',()=>{
  const h=harness();
  bind(h.form);
  const replacement=button('Send');
  replacement.dataset.kf107='1'; // cloneNode copies attributes, not onclick
  h.form.buttons=[replacement];
  bind(h.form);
  h.click(replacement);
  assert.deepEqual(h.calls,['original']);
  assert.equal(replacement.type,'button');
});

test('Recovery404 stripped or overwritten Send handler is restored without duplicates',()=>{
  const h=harness();
  bind(h.form);
  const installed=h.first.onclick;
  h.first.onclick=()=>h.calls.push('untrusted replacement');
  bind(h.form);
  assert.equal(h.first.onclick,installed);
  bind(h.form);
  h.click(h.first);
  assert.deepEqual(h.calls,['original']);
});

test('Recovery404 updated underlying submit handler is adopted on an existing form',()=>{
  const h=harness();
  bind(h.form);
  h.form.onsubmit=function(){h.calls.push('new')};
  bind(h.form);
  h.click(h.first);
  assert.deepEqual(h.calls,['new']);
});

test('Recovery404 cloned input regains Enter-to-send despite copied dataset sentinel',()=>{
  const h=harness();
  bind(h.form);
  const replacement=field('INPUT',{kf107Enter:'1'});
  h.form.fields=[replacement];
  bind(h.form);bind(h.form);
  assert.equal(replacement.handlers.length,1);
  const event=replacement.keydown();
  assert.equal(event.prevented,1);
  assert.deepEqual(h.calls,['original']);
});

test('Recovery404 Shift+Enter remains multiline in replacement textarea',()=>{
  const h=harness();
  bind(h.form);
  const textarea=field('TEXTAREA',{kf107Enter:'1'});
  h.form.fields=[textarea];
  bind(h.form);
  assert.equal(textarea.keydown('Enter',true).prevented,0);
  assert.equal(h.calls.length,0);
  assert.equal(textarea.keydown('Enter',false).prevented,1);
  assert.deepEqual(h.calls,['original']);
});

test('Recovery404 pending async send remains locked after button replacement',async()=>{
  const h=harness();
  let resolve;
  h.form.onsubmit=()=>{h.calls.push('send');return new Promise(r=>{resolve=r})};
  bind(h.form);
  const replacement=button('Send');
  h.form.buttons=[replacement];
  bind(h.form);
  h.click(h.first);
  h.click(replacement);
  assert.deepEqual(h.calls,['send']);
  assert.equal(h.form.dataset.kf107Busy,'1');
  resolve();
  await new Promise(r=>setImmediate(r));
  assert.equal(h.form.dataset.kf107Busy,undefined);
  h.click(replacement);
  assert.deepEqual(h.calls,['send','send']);
  resolve();
  await new Promise(r=>setImmediate(r));
});

test('Recovery404 temporarily cleared onsubmit retains last known safe handler',()=>{
  const h=harness();
  bind(h.form);
  h.form.onsubmit=null;
  h.form.buttons=[button('Send')];
  bind(h.form);
  h.click(h.form.buttons[0]);
  assert.deepEqual(h.calls,['original']);
});
