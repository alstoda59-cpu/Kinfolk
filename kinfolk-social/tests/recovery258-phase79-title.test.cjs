// Exercises the actual Phase79 script with a synthetic signup DOM and auth client.
// No network, accounts, or production credentials.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','kinfolk-phase79.js'),'utf8');

function harness(titleText='Create Account',authOverrides={}){
  const nodes=[];
  const element=(tag)=>({
    tagName:tag.toUpperCase(),isConnected:true,children:[],style:{},dataset:{},
    appendChild(child){this.children.push(child);nodes.push(child);return child},
    append(...children){children.forEach(c=>this.appendChild(c))},
    setAttribute(name,value){this[name]=value},
    remove(){this.isConnected=false;const i=nodes.indexOf(this);if(i>=0)nodes.splice(i,1)}
  });
  const title={textContent:titleText};
  const btn={disabled:false,textContent:'Create account'};
  const fields={
    '.kf73Title':title,'.kf73Primary':btn,
    '#kf73Name':{value:'Synthetic Test'},
    '#kf73Email':{value:'synthetic@example.invalid'},
    '#kf73Password':{value:'StrongTestPassword123!'},
    '#kf79Birthdate':{value:'2000-01-01'},
    '#kf217Username':{value:'synthetic_test'},
    '#kf217ConfirmPassword':{value:'StrongTestPassword123!'},
    '#kf73Stay':{checked:false},
    '#kf219Private':{checked:true}
  };
  const form={
    id:'authForm',dataset:{kf73:'1'},isConnected:true,
    querySelector(selector){
      if(selector==='#kf221Verification')return nodes.find(n=>n.id==='kf221Verification'&&n.isConnected)||null;
      if(selector==='.kf73Msg')return nodes.find(n=>n.className==='kf73Msg'&&n.isConnected)||null;
      return fields[selector]||null;
    },
    querySelectorAll(){return []},
    appendChild(child){nodes.push(child);return child}
  };
  let submit,signups=[],resends=[];
  const resendTimeouts=[];
  const sb={auth:{
    async signUp(payload){signups.push(payload);return authOverrides.signUp?authOverrides.signUp(payload):{data:{user:{id:'synthetic-id'},session:null},error:null}},
    async resend(payload){resends.push(payload);return authOverrides.resend?authOverrides.resend(payload):{error:null}}
  }};
  const document={
    head:{appendChild(){}},documentElement:{},
    createElement:element,
    addEventListener(name,handler){if(name==='submit')submit=handler},
    querySelector(){return null}
  };
  vm.runInNewContext(source,{
    window:{},document,sb,location:{origin:'https://alpha.example.invalid'},URL,Date,
    MutationObserver:class{observe(){}},
    setTimeout(fn,ms){if(ms===20000)resendTimeouts.push(fn);return 1},clearTimeout(){},console:{info(){},warn(){}}
  },{timeout:3000});
  function event(){return{target:form,prevented:false,stopped:false,
    preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true}}}
  return {title,form,btn,fields,nodes,signups,resends,event,submit:e=>submit(e),expireResend:()=>{for(const fn of resendTimeouts.splice(0))fn()}};
}

test('alternate Create Account heading submits a real Phase79 signup and shows verification',async()=>{
  const h=harness();
  const e=h.event();
  await h.submit(e);
  assert.equal(e.prevented,true);
  assert.equal(e.stopped,true);
  assert.equal(h.signups.length,1);
  assert.equal(h.signups[0].email,'synthetic@example.invalid');
  assert.equal(h.signups[0].options.data.username,'synthetic_test');
  assert.equal(h.form.querySelector('#kf221Verification')?.children[0]?.textContent,'Verify your email');
  assert.match(h.form.querySelector('.kf73Msg')?.textContent||'',/check your email/i);
});

test('original Create your Kinfolk heading retains the signup path',async()=>{
  const h=harness('Create your Kinfolk account');
  await h.submit(h.event());
  assert.equal(h.signups.length,1);
});

test('Welcome back login is never captured by the signup submit handler',async()=>{
  const h=harness('Welcome back'),e=h.event();
  await h.submit(e);
  assert.equal(e.prevented,false);
  assert.equal(h.signups.length,0);
});

test('async signup completion cannot overwrite login after heading changes',async()=>{
  let resolve;
  const pending=new Promise(r=>resolve=r);
  const h=harness('Create Account',{signUp:()=>pending}),e=h.event();
  const operation=h.submit(e);
  assert.equal(h.signups.length,1);
  h.title.textContent='Welcome back';
  resolve({data:{user:{id:'synthetic-id'},session:null},error:null});
  await operation;
  assert.equal(h.form.querySelector('#kf221Verification'),null);
  assert.equal(h.form.querySelector('.kf73Msg'),null);
});

test('alternate-title email verification resend remains available',async()=>{
  const h=harness();
  await h.submit(h.event());
  const panel=h.form.querySelector('#kf221Verification');
  const resend=panel.children.find(n=>n.textContent==='Resend verification email');
  assert.ok(resend);
  await resend.onclick();
  assert.equal(h.resends.length,1);
  assert.equal(h.resends[0].type,'signup');
  assert.equal(h.resends[0].email,'synthetic@example.invalid');
});

test('Phase79 mounts and protects every async branch using the same signup-title predicate',()=>{
  assert.match(source,/function mountSignupGate\(\)[\s\S]*?if\(!isSignupTitle\(title\)\)/);
  assert.match(source,/const current=\(\)=>[\s\S]*?isSignupTitle\(form\.querySelector\('\.kf73Title'\)\?\.textContent\)/);
  assert.equal((source.match(/isSignupTitle\(signupTitle\?\.textContent\)/g)||[]).length,6);
  assert.equal((source.match(/\.includes\('create your kinfolk'\)/g)||[]).length,1);
});

test('alternate heading still enforces 13+ signup and blocks underage requests',async()=>{
  const h=harness();
  const birthday=h.form.querySelector('#kf79Birthdate');
  birthday.value='2020-01-01';
  const e=h.event();
  await h.submit(e);
  assert.equal(e.prevented,true);
  assert.equal(h.signups.length,0);
  assert.match(h.form.querySelector('.kf73Msg')?.textContent||'',/ages 13 and older/i);
});

test('signup response without a created user never claims email verification success',async()=>{
  const h=harness('Create Account',{signUp:async()=>({data:{user:null,session:null},error:null})});
  await h.submit(h.event());
  assert.equal(h.signups.length,1);
  assert.equal(h.form.querySelector('#kf221Verification'),null);
  assert.match(h.form.querySelector('.kf73Msg')?.textContent||'',/could not confirm account creation/i);
  assert.equal(h.btn.disabled,false);
});

test('a session belonging to a different account cannot inherit signup persistence',async()=>{
  const h=harness('Create Account',{signUp:async()=>({
    data:{user:{id:'created-account'},session:{user:{id:'different-account'}}},error:null
  })});
  await h.submit(h.event());
  assert.equal(h.form.querySelector('#kf221Verification'),null);
  assert.match(h.form.querySelector('.kf73Msg')?.textContent||'',/session did not match/i);
  assert.equal(h.btn.disabled,false);
});

test('a signup session without a user identity fails closed',async()=>{
  const h=harness('Create Account',{signUp:async()=>({
    data:{user:{id:'created-account'},session:{user:null}},error:null
  })});
  await h.submit(h.event());
  assert.match(h.form.querySelector('.kf73Msg')?.textContent||'',/session did not match/i);
  assert.equal(h.form.querySelector('#kf221Verification'),null);
});

test('signup refuses a returned user email belonging to another address',async()=>{
  const h=harness('Create Account',{signUp:async()=>({
    data:{user:{id:'synthetic-id',email:'other@example.invalid'},session:null},error:null
  })});
  await h.submit(h.event());
  assert.equal(h.form.querySelector('#kf221Verification'),null);
  assert.match(h.form.querySelector('.kf73Msg')?.textContent||'',/different email account/i);
  assert.equal(h.btn.disabled,false);
});

test('signup refuses a same-id session whose email differs from the submitted address',async()=>{
  const h=harness('Create Account',{signUp:async()=>({
    data:{user:{id:'synthetic-id',email:'synthetic@example.invalid'},session:{user:{id:'synthetic-id',email:'other@example.invalid'}}},error:null
  })});
  await h.submit(h.event());
  assert.equal(h.form.querySelector('#kf221Verification'),null);
  assert.match(h.form.querySelector('.kf73Msg')?.textContent||'',/session did not match/i);
  assert.equal(h.btn.disabled,false);
});

test('signup accepts case-normalized matching response email and uses neutral verification copy',async()=>{
  const h=harness('Create Account',{signUp:async()=>({
    data:{user:{id:'synthetic-id',email:'SYNTHETIC@EXAMPLE.INVALID'},session:null},error:null
  })});
  await h.submit(h.event());
  const panel=h.form.querySelector('#kf221Verification');
  assert.ok(panel);
  assert.match(panel.children[1].textContent,/if verification is required/i);
  assert.match(h.form.querySelector('.kf73Msg')?.textContent||'',/if verification is required/i);
});


test('transient verification resend failure permits immediate retry',async()=>{
  let calls=0;
  const h=harness('Create Account',{resend:async()=>({error:++calls===1?{status:503,message:'Service unavailable'}:null})});
  await h.submit(h.event());
  const panel=h.form.querySelector('#kf221Verification');
  const resend=panel.children.find(n=>n.textContent==='Resend verification email');
  await resend.onclick();
  assert.equal(resend.disabled,false);
  assert.match(panel.children[3].textContent,/could not request/i);
  await resend.onclick();
  assert.equal(h.resends.length,2);
  assert.match(panel.children[3].textContent,/new email has been requested/i);
});

test('verification resend rate-limit response retains cooldown',async()=>{
  const h=harness('Create Account',{resend:async()=>({error:{status:429,message:'Too many requests'}})});
  await h.submit(h.event());
  const panel=h.form.querySelector('#kf221Verification');
  const resend=panel.children.find(n=>n.textContent==='Resend verification email');
  await resend.onclick();
  assert.match(panel.children[3].textContent,/too many email requests/i);
  await resend.onclick();
  assert.equal(h.resends.length,1);
  assert.match(panel.children[3].textContent,/wait a minute/i);
});

test('stalled verification resend releases mobile button but retains cooldown',async()=>{
  const h=harness('Create Account',{resend:()=>new Promise(()=>{})});
  await h.submit(h.event());
  const panel=h.form.querySelector('#kf221Verification');
  const resend=panel.children.find(n=>n.textContent==='Resend verification email');
  const operation=resend.onclick();
  assert.equal(resend.disabled,true);
  assert.equal(h.resends.length,1);
  h.expireResend();
  await operation;
  assert.equal(resend.disabled,false);
  assert.match(panel.children[3].textContent,/may still arrive/i);
  await resend.onclick();
  assert.equal(h.resends.length,1);
  assert.match(panel.children[3].textContent,/wait a minute/i);
});

test('malformed resend success response does not falsely claim email was requested',async()=>{
  const h=harness('Create Account',{resend:async()=>null});
  await h.submit(h.event());
  const panel=h.form.querySelector('#kf221Verification');
  const resend=panel.children.find(n=>n.textContent==='Resend verification email');
  await resend.onclick();
  assert.match(panel.children[3].textContent,/could not request/i);
  await resend.onclick();
  assert.equal(h.resends.length,2);
});

test('changing signup email invalidates old verification resend controls',async()=>{
  const h=harness();
  await h.submit(h.event());
  const panel=h.form.querySelector('#kf221Verification');
  const resend=panel.children.find(n=>n.textContent==='Resend verification email');
  h.fields['#kf73Email'].value='new@example.invalid';
  await resend.onclick();
  assert.equal(h.resends.length,0);
});
