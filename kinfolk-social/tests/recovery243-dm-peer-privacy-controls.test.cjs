'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=name=>fs.readFileSync('kinfolk-social/'+name,'utf8');
const legacy=read('index.html');
const active=read('kinfolk-phase76.js');
const block=read('kinfolk-phase107.js');
const report=read('kinfolk-phase108.js');

test('both legacy DM templates attach escaped active peer identity',()=>{
 const forms=legacy.match(/<form id="dmForm"[^>]*>/g)||[];
 assert.equal(forms.length,2);
 for(const form of forms){
   assert.match(form,/data-peer="\$\{esc\(peer\)\}"/);
   assert.doesNotMatch(form,/data-peer="\$\{peer\}"/);
 }
});
test('active DM template attaches escaped peer for block and report actions',()=>{
 const forms=active.match(/<form id="dmForm"[^>]*>/g)||[];
 assert.equal(forms.length,1);
 assert.match(forms[0],/data-peer="\$\{esc\(peer\)\}"/);
 assert.match(block,/const currentPeer=form\.dataset\.peer/);
 assert.match(report,/const peer=form\.dataset\.peer/);
});
test('report control retries if peer is assigned after form appears',()=>{
 const start=report.indexOf('function patchDmHeader('),end=report.indexOf('function enforce108(',start);
 assert.ok(start>=0&&end>start);
 const form={dataset:{},children:[],appendChild(child){this.children.push(child)}};
 const document={getElementById:id=>id==='dmForm'?form:null,createElement:tag=>({tag,appendChild(child){this.child=child}})};
 const ctx={document,window:{kf108Report(){}},console};
 const patch=vm.runInNewContext(report.slice(start,end)+'\npatchDmHeader',ctx);
 patch();
 assert.equal(form.dataset.kf108Header,undefined);
 assert.equal(form.children.length,0);
 form.dataset.peer='synthetic-peer-42';
 patch();
 assert.equal(form.dataset.kf108Header,'1');
 assert.equal(form.children.length,1);
 assert.equal(form.children[0].child.textContent,'⚑ Report account');
 patch();
 assert.equal(form.children.length,1);
});
test('report button forwards the current synthetic peer',()=>{
 const start=report.indexOf('function patchDmHeader('),end=report.indexOf('function enforce108(',start);
 const events=[];
 const form={dataset:{peer:'synthetic-peer-42'},appendChild(child){this.row=child}};
 const doc={getElementById:()=>form,createElement:()=>({appendChild(button){this.button=button}})};
 const patch=vm.runInNewContext(report.slice(start,end)+'\npatchDmHeader',{document:doc,window:{kf108Report:(...args)=>events.push(args)}});
 patch();
 form.row.button.onclick({preventDefault(){}});
 assert.deepEqual(events,[['profile','synthetic-peer-42','account']]);
});
