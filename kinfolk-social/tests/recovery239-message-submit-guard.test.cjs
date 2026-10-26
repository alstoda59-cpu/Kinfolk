'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase107.js','utf8');
const start=source.indexOf('function safeRun(');
const end=source.indexOf('function bind(',start);
assert.ok(start>=0&&end>start,'message submit guard must exist');
const code=source.slice(start,end);
const warnings=[];
const safeRun=vm.runInNewContext(code+'\nsafeRun',{document:{contains:()=>false},console:{warn:(...a)=>warnings.push(a)}});
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('rejected async submit is handled and releases lock after detached form',async()=>{
 const form={dataset:{},isConnected:false};
 let reject;
 const promise=new Promise((_,r)=>{reject=r});
 safeRun(form,()=>promise,{});
 assert.equal(form.dataset.kf107Busy,'1');
 reject(new Error('network failure'));
 await tick();
 assert.equal(form.dataset.kf107Busy,undefined);
 assert.ok(warnings.some(w=>String(w[0]).includes('rejected')));
});

test('successful async submit releases lock even if form is detached',async()=>{
 const form={dataset:{}};
 let resolve;
 const promise=new Promise(r=>{resolve=r});
 safeRun(form,()=>promise,{});
 assert.equal(form.dataset.kf107Busy,'1');
 resolve();
 await tick();
 assert.equal(form.dataset.kf107Busy,undefined);
});

test('pending submit blocks duplicate handler invocation',async()=>{
 const form={dataset:{}};
 let resolve;
 const promise=new Promise(r=>{resolve=r});
 let calls=0;
 safeRun(form,()=>{calls++;return promise},{});
 safeRun(form,()=>{calls++;return promise},{});
 assert.equal(calls,1);
 resolve();
 await tick();
 safeRun(form,()=>{calls++},{});
 assert.equal(calls,2);
});

test('synchronous handler exception does not leave form locked',()=>{
 const form={dataset:{}};
 safeRun(form,()=>{throw Error('sync failure')},{});
 assert.equal(form.dataset.kf107Busy,undefined);
});
