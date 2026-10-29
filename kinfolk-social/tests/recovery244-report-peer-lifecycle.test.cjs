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

const submitStart=source.indexOf('window.kf108SubmitReport=async function(');
const submitEnd=source.indexOf('function patchDmReports(',submitStart);
assert.ok(submitStart>=0&&submitEnd>submitStart);
function submitHarness(){
 const events=[],state={user:{id:'account-A'}},button={disabled:false,textContent:'Submit report'};
 let activeButton=button,settle;
 const document={getElementById(id){if(id==='kf108Reason')return {value:'Spam or scam'};if(id==='kf108Details')return {value:'synthetic details'};if(id==='kf108Submit')return activeButton;return null},contains:()=>true};
 const sb={from(table){assert.equal(table,'kinfolk_reports');return {insert(row,options){assert.equal(options.count,'exact');events.push(['insert',row.reporter_id,row.target_type,row.target_id]);return new Promise(resolve=>{settle=resolve})}}}};
 const window={state};
 vm.runInNewContext('let sendingToken=null;let activeReport={type:"profile",id:"peer-B",reporterId:"account-A",token:1,activationEpoch:null};'+source.slice(submitStart,submitEnd),{window,document,sb,TYPES:new Set(['profile','message']),tell108:(...a)=>events.push(['toast',...a]),closeModal:()=>events.push(['close'])});
 return {events,state,button,submit:(type,id)=>window.kf108SubmitReport(type,id,1),finish:error=>settle({error:error||null,count:error?null:1}),replaceModal(){activeButton={disabled:false,textContent:'Submit report'}}};
}
test('report submission retains originating reporter and suppresses stale account success UI',async()=>{
 const h=submitHarness(),pending=h.submit('profile','peer-B');
 assert.deepEqual(h.events[0],['insert','account-A','profile','peer-B']);
 h.state.user.id='account-C';
 h.finish();
 await pending;
 assert.equal(h.events.filter(e=>e[0]==='close'||e[0]==='toast').length,0);
});
test('report completion cannot close a newly opened report modal',async()=>{
 const h=submitHarness(),pending=h.submit('profile','peer-B');
 h.replaceModal();
 h.finish();
 await pending;
 assert.equal(h.events.filter(e=>e[0]==='close'||e[0]==='toast').length,0);
});
test('same-account report success closes original modal and confirms submission',async()=>{
 const h=submitHarness(),pending=h.submit('profile','peer-B');
 h.finish();
 await pending;
 assert.ok(h.events.some(e=>e[0]==='close'));
 assert.ok(h.events.some(e=>e[0]==='toast'&&e[2]==='good'));
});
test('report error after account switch does not toast into another account',async()=>{
 const h=submitHarness(),pending=h.submit('profile','peer-B');
 h.state.user.id='account-C';
 h.finish(new Error('permission denied'));
 await pending;
 assert.equal(h.events.filter(e=>e[0]==='toast').length,0);
});
