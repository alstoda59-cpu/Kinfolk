'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase108.js','utf8');
const dmStart=source.indexOf('function patchDmReports(');
const dmEnd=source.indexOf('const oldFeed=',dmStart);
const headerStart=source.indexOf('function patchDmHeader(');
const headerEnd=source.indexOf('function enforce108(',headerStart);
assert.ok(dmStart>=0&&dmEnd>dmStart&&headerStart>=0&&headerEnd>headerStart);

function reportHeaderHarness(){
 const events=[],form={dataset:{peer:'peer-A'},appendChild(el){this.row=el}};
 const document={getElementById:id=>id==='dmForm'?form:null,createElement:()=>({style:{},appendChild(el){this.button=el}})};
 const patch=vm.runInNewContext(source.slice(headerStart,headerEnd)+'\npatchDmHeader',{document,window:{kf108Report:(...args)=>events.push(args)}});
 return {events,form,patch};
}
test('report account uses the current peer after a reused DM form changes recipients',()=>{
 const h=reportHeaderHarness();
 h.patch();
 h.form.dataset.peer='peer-B';
 h.form.row.button.onclick({preventDefault(){}});
 assert.deepEqual(h.events,[['profile','peer-B','account']]);
});
test('report account does not submit an empty or stale peer',()=>{
 const h=reportHeaderHarness();
 h.patch();
 h.form.dataset.peer='';
 h.form.row.button.onclick({preventDefault(){}});
 assert.equal(h.events.length,0);
});

function messageReportHarness(){
 const events=[],bubble={appendChild(button){this.button=button}};
 const line={dataset:{},id:'msg-A',bubble:null,querySelector(){return this.bubble},getAttribute(){return this.id}};
 const document={querySelectorAll:()=>[line],createElement:()=>({style:{}})};
 const patch=vm.runInNewContext(source.slice(dmStart,dmEnd)+'\npatchDmReports',{document,window:{kf108Report:(...args)=>events.push(args)}});
 return {events,bubble,line,patch};
}
test('message report binding retries after message bubble is inserted',()=>{
 const h=messageReportHarness();
 h.patch();
 assert.equal(h.line.dataset.kf108Report,undefined);
 h.line.bubble=h.bubble;
 h.patch();
 assert.equal(h.line.dataset.kf108Report,'1');
 h.bubble.button.onclick({preventDefault(){},stopPropagation(){}});
 assert.deepEqual(h.events,[['message','msg-A','message']]);
 h.patch();
 assert.equal(h.line.dataset.kf108Report,'1');
});
test('message report binding waits until message ID exists',()=>{
 const h=messageReportHarness();
 h.line.bubble=h.bubble;
 h.line.id='';
 h.patch();
 assert.equal(h.line.dataset.kf108Report,undefined);
 h.line.id='msg-B';
 h.patch();
 assert.equal(h.line.dataset.kf108Report,'1');
});
