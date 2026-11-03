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
function harness(username){
 const elements={app:{innerHTML:''},loginTab:{},signupTab:{},authForm:{isConnected:true},authBtn:{disabled:false},authMsg:{textContent:'',className:'danger'},email:{value:'synthetic@example.invalid'},password:{value:'synthetic-long-password'},username:{value:username},displayName:{value:'Test Member'}};
 let calls=0;
 const sb={auth:{signUp:async()=>{calls++;return {data:{session:null},error:null}}}};
 const $=selector=>elements[selector.slice(1)];
 const context={$,sb,document:{getElementById:id=>elements[id]},location:{origin:'capacitor://localhost'},kfAlphaSignupRedirectOptions:()=>({}),toast:()=>{}};
 vm.runInNewContext(auth+';this.renderAuth=renderAuth;',context);
 context.renderAuth('signup');
 return {elements,submit:()=>elements.authForm.onsubmit({preventDefault(){}}),calls:()=>calls};
}
test('Recovery438 invalid usernames are blocked before native Supabase signup',async()=>{
 for(const username of ['ab','a'.repeat(25),'bad space','bad-hyphen','bad.dot','ééé']){
  const h=harness(username);
  await h.submit();
  assert.equal(h.calls(),0,username);
  assert.match(h.elements.authMsg.textContent,/Username must be/);
  assert.equal(h.elements.authBtn.disabled,false);
 }
});
test('Recovery438 valid usernames still reach signup',async()=>{
 for(const username of ['abc','Name_123','Z'.repeat(24)]){
  const h=harness(username);
  await h.submit();
  assert.equal(h.calls(),1,username);
  assert.match(h.elements.authMsg.textContent,/check your email/i);
 }
});
