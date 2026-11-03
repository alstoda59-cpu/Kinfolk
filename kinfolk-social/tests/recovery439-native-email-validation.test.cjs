'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('kinfolk-social/index.html','utf8');
const start=source.indexOf("function renderAuth(mode='login')");
const end=source.indexOf('function layout()',start);
assert.ok(start>=0&&end>start);
const auth=source.slice(start,end);
function harness(mode,email){
 const elements={app:{innerHTML:''},loginTab:{},signupTab:{},authForm:{isConnected:true},authBtn:{disabled:false},authMsg:{textContent:'',className:'danger'},email:{value:email},password:{value:'synthetic-long-password'},username:{value:'Tester_123'},displayName:{value:'Synthetic Tester'}};
 let calls=0;
 const sb={auth:{signUp:async()=>{calls++;return {data:{session:null},error:null}},signInWithPassword:async()=>{calls++;return {error:null}}}};
 const $=selector=>elements[selector.slice(1)];
 const context={$,sb,document:{getElementById:id=>elements[id]},location:{origin:'capacitor://localhost'},kfAlphaSignupRedirectOptions:()=>({}),toast:()=>{}};
 vm.runInNewContext(auth+';this.renderAuth=renderAuth;',context);
 context.renderAuth(mode);
 return {elements,submit:()=>elements.authForm.onsubmit({preventDefault(){}}),calls:()=>calls};
}
for(const mode of ['login','signup']){
 test('Recovery439 '+mode+' rejects malformed email before Supabase request',async()=>{
  for(const email of ['', 'no-at-sign', 'a@b', 'a b@example.com','@example.com']){
   const h=harness(mode,email);await h.submit();
   assert.equal(h.calls(),0,email);
   assert.match(h.elements.authMsg.textContent,/valid email address/i);
   assert.equal(h.elements.authBtn.disabled,false);
  }
 });
 test('Recovery439 '+mode+' accepts trimmed valid email',async()=>{
  const h=harness(mode,' synthetic@example.invalid ');
  await h.submit();assert.equal(h.calls(),1);
  assert.equal(h.elements.authBtn.disabled,false);
 });
}
