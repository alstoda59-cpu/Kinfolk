'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase107.js','utf8');
const start=source.indexOf('function bind('),end=source.indexOf('const pendingBlocks=',start);
assert.ok(start>=0&&end>start);
const bind=vm.runInNewContext(source.slice(start,end)+'\nbind',{safeRun:(form,handler,event)=>handler.call(form,event)});
function makeForm(){
 const button={textContent:'Send',dataset:{}};
 const form={dataset:{},querySelectorAll(sel){return sel==='button'?[button]:[]},querySelector(){return button}};
 return {form,button};
}
test('reused message form submits with its latest handler',()=>{
 const {form,button}=makeForm(),calls=[];
 form.onsubmit=()=>calls.push('first');
 bind(form);
 form.onsubmit=()=>calls.push('second');
 bind(form);
 button.onclick({preventDefault(){},stopImmediatePropagation(){}});
 assert.deepEqual(calls,['second']);
});
test('form handler replacement with missing handler retains previous working binding',()=>{
 const {form,button}=makeForm(),calls=[];
 form.onsubmit=()=>calls.push('original');
 bind(form);
 form.onsubmit=null;
 bind(form);
 button.onclick({preventDefault(){},stopImmediatePropagation(){}});
 assert.deepEqual(calls,['original']);
});
test('repeated binding does not replace button click handler',()=>{
 const {form,button}=makeForm();
 form.onsubmit=()=>{};
 bind(form);
 const click=button.onclick;
 bind(form);
 assert.equal(button.onclick,click);
});
