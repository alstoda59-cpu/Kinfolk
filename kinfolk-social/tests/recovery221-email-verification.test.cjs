const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase79.js','utf8');
function fixture(origin='https://preview.example.test'){
  const calls=[];let resolve,panel;
  const title={textContent:'Create your Kinfolk'};
  const pending={email:'synthetic@example.test',retryAt:0,busy:false};
  const form={isConnected:true,__kf221Verification:pending,
    querySelector:s=>s==='#kf221Verification'?panel:s==='.kf73Title'?title:s==='#kf73Email'?{value:'synthetic@example.test'}:null,
    appendChild:p=>{panel=p;p.isConnected=true}
  };
  const window={};
  const document={head:{appendChild(){}},documentElement:{},addEventListener(){},
    createElement:()=>({style:{},setAttribute(){},append(...children){this.children=children},remove(){this.isConnected=false;panel=null}})};
  const auth={resend:args=>{calls.push(args);return new Promise(r=>resolve=r)}};
  vm.runInNewContext(source.replace('  // Recovery133: a single capturing signup handler', '  window.mountVerification=mountVerification;\n  // Recovery133: a single capturing signup handler'),{
    window,document,sb:{auth},URL,Date,location:{origin},
    MutationObserver:class{observe(){}},setTimeout(){},clearTimeout(){}
  });
  window.mountVerification(form);
  return {window,form,pending,title,calls,auth,get panel(){return panel},get button(){return panel.children[2]},get status(){return panel.children[3]},resolve:r=>resolve(r)};
}
test('resend uses original email, signup type and public HTTPS redirect',async()=>{
 const f=fixture();const task=f.button.onclick();
 assert.equal(f.button.disabled,true);assert.equal(f.calls[0].email,'synthetic@example.test');
 assert.equal(f.calls[0].type,'signup');assert.equal(f.calls[0].options.emailRedirectTo,'https://preview.example.test');
 f.resolve({error:null});await task;assert.match(f.status.textContent,/a new email has been requested/);assert.equal(f.button.disabled,false);
});
test('duplicate in-flight and cooldown clicks do not resend',async()=>{
 const f=fixture(),task=f.button.onclick();await f.button.onclick();assert.equal(f.calls.length,1);
 f.resolve({error:null});await task;await f.button.onclick();assert.equal(f.calls.length,1);assert.match(f.status.textContent,/wait a minute/);
});
test('localhost web-preview origin does not produce a public callback',async()=>{
 const f=fixture('https://localhost'),task=f.button.onclick();assert.equal(f.calls[0].options,undefined);f.resolve({error:null});await task;
});
test('rate limit and other errors allow retry after cooldown without false success',async()=>{
 for(const error of [{status:429},{message:'offline'}]){
  const f=fixture(),task=f.button.onclick();f.resolve({error});await task;
  assert.match(f.status.textContent,error.status===429?/Too many/:/Could not/);assert.equal(f.button.disabled,false);
  f.pending.retryAt=0;const retry=f.button.onclick();assert.equal(f.calls.length,2);f.resolve({error:null});await retry;
 }
});
test('late responses cannot repaint detached, login or replaced signup screens',async()=>{
 for(const leave of [f=>f.form.isConnected=false,f=>f.title.textContent='Welcome back',f=>f.form.__kf221Verification={}]){
  const f=fixture(),status=f.status,task=f.button.onclick();leave(f);f.resolve({error:null});await task;
  assert.equal(status.textContent,'Requesting verification email…');
 }
});
test('remount is idempotent and clearing pending state removes the panel',()=>{
 const f=fixture(),panel=f.panel;f.window.mountVerification(f.form);assert.equal(f.panel,panel);
 delete f.form.__kf221Verification;f.window.mountVerification(f.form);assert.equal(f.panel,null);
});
