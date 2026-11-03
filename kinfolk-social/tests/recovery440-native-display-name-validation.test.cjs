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
function harness(displayName){
 const elements={app:{innerHTML:''},loginTab:{},signupTab:{},authForm:{isConnected:true},authBtn:{disabled:false},authMsg:{textContent:'',className:'danger'},email:{value:'synthetic@example.invalid'},password:{value:'synthetic-long-password'},username:{value:'Tester_123'},displayName:{value:displayName}};
 const requests=[];
 const sb={auth:{signUp:async payload=>{requests.push(payload);return {data:{session:null},error:null}}}};
 const $=selector=>elements[selector.slice(1)];
 const context={$,sb,document:{getElementById:id=>elements[id]},location:{origin:'capacitor://localhost'},kfAlphaSignupRedirectOptions:()=>({}),toast:()=>{}};
 vm.runInNewContext(auth+';this.renderAuth=renderAuth;',context);
 context.renderAuth('signup');
 return {elements,requests,submit:()=>elements.authForm.onsubmit({preventDefault(){}})};
}
test('Recovery440 rejects oversized native display name before Supabase',async()=>{
 const h=harness('X'.repeat(51));await h.submit();
 assert.equal(h.requests.length,0);assert.match(h.elements.authMsg.textContent,/display name/i);
 assert.equal(h.elements.authBtn.disabled,false);
});
test('Recovery440 rejects control characters before Supabase',async()=>{
 const h=harness('Tester\nInjected');await h.submit();
 assert.equal(h.requests.length,0);assert.match(h.elements.authMsg.textContent,/display name/i);
});
test('Recovery440 accepts 50-character display name and preserves metadata',async()=>{
 const h=harness('Z'.repeat(50));await h.submit();
 assert.equal(h.requests.length,1);
 assert.equal(h.requests[0].options.data.display_name,'Z'.repeat(50));
 assert.equal(h.elements.authBtn.disabled,false);
});
test('Recovery440 empty display name falls back to valid username',async()=>{
 const h=harness('   ');await h.submit();
 assert.equal(h.requests.length,1);
 assert.equal(h.requests[0].options.data.display_name,'Tester_123');
});
