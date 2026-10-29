'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'..','kinfolk-phase76.js'),'utf8');
const start=source.indexOf('// Recovery327: pin notification settings reads');
const end=source.indexOf('window.openKinfolkHelp=function()',start);
assert.ok(start>=0&&end>start,'active Recovery327 notification handler exists');
const handler=source.slice(start,end);
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const keys=['email_friend_requests','email_messages','email_group_activity','email_post_activity','marketing_email'];
const ids=['ndFriend','ndMessages','ndGroups','ndPosts','ndMarketing'];
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {resolve,promise};}
function harness(){
  const reads=[],writes=[],toasts=[],closed=[];
  let screen=null;
  const ctx={
    state:{user:{id:A}},kf129Epoch:1,
    toast:(...args)=>toasts.push(args),
    closeKfsSub:()=>{closed.push(true);if(screen)screen.isConnected=false;},
    sub:(title,html)=>{
      if(screen){screen.isConnected=false;screen.body.isConnected=false;}
      const body={isConnected:true,html,form:null,textContent:'',querySelector(selector){
        return selector==='#kfsNotifDetailForm'?this.form:null;
      }};
      Object.defineProperty(body,'innerHTML',{get(){return this.html;},set(value){
        this.html=value;
        if(!value.includes('id="kfsNotifDetailForm"'))return;
        const inputs=Object.fromEntries(ids.map(id=>[id,{checked:new RegExp('id="'+id+'"[^>]*checked').test(value)}]));
        const button={disabled:false,textContent:'Save notifications'};
        this.form={onsubmit:null,inputs,button,querySelector(sel){
          if(sel==='button[type="submit"]')return button;
          return inputs[sel.slice(1)]||null;
        }};
      }});
      screen={title,isConnected:true,body,querySelector:sel=>sel==='#kfsNotifDetailBody'?body:null};
      return screen;
    },
    document:{getElementById:id=>id==='kfsSubScreen'?screen:null},
    sb:{from:table=>({
      select:columns=>({eq:(field,accountId)=>({maybeSingle:()=>{
        const d=deferred();reads.push({table,columns,field,accountId,...d});return d.promise;
      }})}),
      upsert:(submitted,options)=>({select:columns=>({single:()=>{
        const d=deferred();writes.push({table,submitted,options,columns,...d});return d.promise;
      }})})
    })}
  };
  ctx.window=ctx;
  vm.runInNewContext(handler,ctx,{timeout:1000});
  async function loaded(values={}){
    const pending=ctx.openNotificationDetails();
    assert.equal(reads.length>0,true);
    reads.at(-1).resolve({data:{user_id:ctx.state.user.id,...values},error:null});
    await pending;
    return screen.body.form;
  }
  return {ctx,reads,writes,toasts,closed,loaded,get screen(){return screen;}};
}
async function submit(form){
  const event={preventDefault(){}};
  return form.onsubmit(event);
}
test('signed-out users cannot query notification preferences',async()=>{
  const h=harness();h.ctx.state.user=null;
  await h.ctx.openNotificationDetails();
  assert.equal(h.reads.length,0);
  assert.match(h.toasts[0][0],/Sign in/);
});
test('notification reads pin the opening user and preserve saved checkboxes',async()=>{
  const h=harness(),form=await h.loaded({email_friend_requests:false,email_messages:true});
  assert.equal(h.reads[0].accountId,A);
  assert.equal(h.reads[0].field,'user_id');
  assert.equal(form.inputs.ndFriend.checked,false);
  assert.equal(form.inputs.ndMessages.checked,true);
});
test('account switch before read returns cannot show previous account preferences',async()=>{
  const h=harness(),pending=h.ctx.openNotificationDetails(),old=h.screen;
  h.ctx.state.user={id:B};
  h.reads[0].resolve({data:{user_id:A,email_messages:true},error:null});
  await pending;
  assert.equal(old.body.form,null);
});
test('same-account reactivation invalidates delayed read',async()=>{
  const h=harness(),pending=h.ctx.openNotificationDetails();
  h.ctx.kf129Epoch++;
  h.reads[0].resolve({data:{user_id:A},error:null});await pending;
  assert.equal(h.screen.body.form,null);
});
test('replaced notification screen cannot be repainted by older response',async()=>{
  const h=harness(),first=h.ctx.openNotificationDetails(),old=h.screen;
  const second=h.ctx.openNotificationDetails();
  h.reads[0].resolve({data:{user_id:A},error:null});await first;
  assert.equal(old.body.form,null);
  h.reads[1].resolve({data:{user_id:A},error:null});await second;
  assert.ok(h.screen.body.form);
});
test('wrong-account preference read fails closed',async()=>{
  const h=harness(),pending=h.ctx.openNotificationDetails();
  h.reads[0].resolve({data:{user_id:B,email_messages:true},error:null});await pending;
  assert.equal(h.screen.body.form,null);
  assert.match(h.screen.body.textContent,/did not match/);
});
test('form cannot save after account switch',async()=>{
  const h=harness(),form=await h.loaded();
  h.ctx.state.user={id:B};
  await submit(form);assert.equal(h.writes.length,0);
});
test('duplicate submit sends one account-scoped snapshot',async()=>{
  const h=harness(),form=await h.loaded();
  form.inputs.ndMessages.checked=true;
  const first=submit(form),second=submit(form);
  assert.equal(h.writes.length,1);
  assert.equal(h.writes[0].submitted.user_id,A);
  assert.equal(h.writes[0].submitted.email_messages,true);
  assert.equal(form.button.disabled,true);
  h.writes[0].resolve({data:{...h.writes[0].submitted},error:null});
  await Promise.all([first,second]);
  assert.deepEqual(h.toasts[0],['Notification settings saved','good']);
  assert.equal(h.closed.length,1);
});
test('zero-row and wrong-account upserts never claim success',async()=>{
  for(const saved of [null,{user_id:B}]){
    const h=harness(),form=await h.loaded(),pending=submit(form);
    h.writes[0].resolve({data:saved,error:null});await pending;
    assert.equal(h.closed.length,0);
    assert.match(h.toasts[0][0],/could not be confirmed/);
    assert.equal(form.button.disabled,false);
  }
});
test('mismatched returned preference value is not treated as saved',async()=>{
  const h=harness(),form=await h.loaded(),pending=submit(form);
  h.writes[0].resolve({data:{...h.writes[0].submitted,email_messages:true},error:null});
  await pending;
  assert.equal(h.closed.length,0);
  assert.match(h.toasts[0][0],/could not be confirmed/);
});
test('late upsert after account switch cannot toast or close another account screen',async()=>{
  const h=harness(),form=await h.loaded(),pending=submit(form);
  h.ctx.state.user={id:B};
  h.writes[0].resolve({data:{...h.writes[0].submitted},error:null});await pending;
  assert.equal(h.toasts.length,0);
  assert.equal(h.closed.length,0);
});
test('backend error preserves retry without success',async()=>{
  const h=harness(),form=await h.loaded(),pending=submit(form);
  h.writes[0].resolve({data:null,error:{message:'Denied by RLS'}});await pending;
  assert.equal(form.button.disabled,false);
  assert.equal(h.toasts[0][0],'Denied by RLS');
  assert.equal(h.closed.length,0);
});
