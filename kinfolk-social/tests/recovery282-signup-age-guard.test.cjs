// Regression for the last-resort capture-phase teen signup age gate.
// Run with: node --test tests/recovery282-signup-age-guard.test.cjs
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'../kinfolk-phase129.js'),'utf8');
function birthday(yearsAgo){
  const today=new Date();
  const year=today.getFullYear()-yearsAgo;
  const month=String(today.getMonth()+1).padStart(2,'0');
  const day=String(today.getDate()).padStart(2,'0');
  return year+'-'+month+'-'+day;
}
function simulate(title,birthdate){
  let handler,capture,created=0;
  const document={
    addEventListener(type,callback,isCapture){assert.equal(type,'submit');handler=callback;capture=isCapture},
    createElement(tag){assert.equal(tag,'div');created++;return {style:{},textContent:'',className:''}}
  };
  const window={};
  vm.runInNewContext(source,{window,document,Date,console:{log(){}}},{filename:'kinfolk-phase129.js'});
  assert.equal(capture,true,'age guard must run in capture phase');
  assert.equal(window.__kinfolkPhase129,true);
  let message=null,prevented=0,stopped=0;
  const form={
    id:'authForm',dataset:{kf73:'1'},
    querySelector(selector){
      if(selector==='.kf73Title')return {textContent:title};
      if(selector==='#kf79Birthdate')return {value:birthdate};
      if(selector==='.kf73Msg')return message;
      return null;
    },
    appendChild(el){message=el}
  };
  handler({target:form,preventDefault(){prevented++},stopImmediatePropagation(){stopped++}});
  return {prevented,stopped,message,created};
}
test('alternate Create Account blocks users under 13 before legacy handlers',()=>{
  const result=simulate('Create Account',birthday(12));
  assert.equal(result.prevented,1);
  assert.equal(result.stopped,1);
  assert.match(result.message.textContent,/13 and older/);
});
test('alternate Create Account rejects missing or invalid birthday',()=>{
  for(const value of ['', 'not-a-date', '2026-02-30']){
    const result=simulate('Create Account',value);
    assert.equal(result.prevented,1,value);
    assert.match(result.message.textContent,/valid birthday/);
  }
});
test('both signup headings reject age over 99',()=>{
  for(const title of ['Create Account','Create your Kinfolk']){
    const result=simulate(title,birthday(100));
    assert.equal(result.prevented,1,title);
    assert.match(result.message.textContent,/13–99/);
  }
});
test('both signup headings permit valid 13 and 99 year old signups',()=>{
  for(const title of ['Create Account','Create your Kinfolk']){
    for(const age of [13,18,99]){
      const result=simulate(title,birthday(age));
      assert.equal(result.prevented,0,title+' age '+age);
      assert.equal(result.stopped,0);
      assert.equal(result.created,0);
    }
  }
});
test('login screen is never blocked by the signup age gate',()=>{
  const result=simulate('Welcome back','');
  assert.equal(result.prevented,0);
  assert.equal(result.stopped,0);
});
