'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase107.js','utf8');
const start=source.indexOf('function bind('),end=source.indexOf('const pendingBlocks=',start);
assert.ok(start>=0&&end>start);
const code=source.slice(start,end);
function harness(){
 const btn={textContent:'Send',dataset:{},type:'submit'};
 const form={dataset:{},onsubmit(){this.calls=(this.calls||0)+1},querySelectorAll(sel){return sel==='button'?[btn]:[]},querySelector(){return btn}};
 const bind=vm.runInNewContext(code+'\nbind',{safeRun:(f,h,e)=>h.call(f,e)});
 bind(form);
 return {form,btn,bind};
}
test('mobile send button has exactly one click activation path',()=>{
 const {form,btn}=harness();
 assert.equal(btn.type,'button');
 assert.equal(typeof btn.onclick,'function');
 assert.equal(btn.onpointerup,null);
 assert.equal(btn.ontouchend,null);
 assert.equal(btn.onkeydown,null);
 btn.onclick({preventDefault(){},stopImmediatePropagation(){}});
 assert.equal(form.calls,1);
});
test('rebinding same form does not create another handler',()=>{
 const {form,btn,bind}=harness();
 const original=btn.onclick;
 bind(form);
 assert.equal(btn.onclick,original);
});
test('form without a send control remains eligible for binding when button appears',()=>{
 const form={dataset:{},onsubmit(){this.calls=(this.calls||0)+1},querySelectorAll(sel){return sel==='button'?(this.button?[this.button]:[]):[]},querySelector(){return this.button||null}};
 const bind=vm.runInNewContext(code+'\nbind',{safeRun:(f,h,e)=>h.call(f,e)});
 bind(form);
 assert.equal(form.dataset.kf107,undefined);
 form.button={textContent:'Send',dataset:{}};
 bind(form);
 assert.equal(form.dataset.kf107,'1');
 assert.equal(typeof form.button.onclick,'function');
 form.button.onclick({preventDefault(){},stopImmediatePropagation(){}});
 assert.equal(form.calls,1);
});
test('all three message forms use the shared single-activation binding',()=>{
 assert.match(source,/const FORMS=\['dmForm','groupMsgForm','groupCreateForm'\]/);
 assert.match(source,/btn\.onclick=run/);
 assert.doesNotMatch(source,/btn\.onpointerup=run/);
 assert.doesNotMatch(source,/btn\.ontouchend=run/);
});
