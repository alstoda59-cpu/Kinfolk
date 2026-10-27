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
  const sb={auth:{
    async signUp(payload){signups.push(payload);return authOverrides.signUp?authOverrides.signUp(payload):{data:{user:{id:'synthetic-id'},session:null},error:null}},
    async resend(payload){resends.push(payload);return {error:null}}
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
    setTimeout(){return 1},clearTimeout(){},console:{info(){},warn(){}}
  },{timeout:3000});
  function event(){return{target:form,prevented:false,stopped:false,
    preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true}}}
  return {title,form,btn,nodes,signups,resends,event,submit:e=>submit(e)};
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
