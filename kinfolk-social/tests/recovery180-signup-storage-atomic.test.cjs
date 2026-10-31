'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase79.js','utf8');
function run({stay=false,confirmed=true,deny='' }={}){
 let submit,msg,signouts=0,failed=false,sessionReads=0;
 const values=new Map([['kinfolk_stay_logged_in_v1','1'],['kinfolk_stay_logged_in','1'],['kinfolk_session_tab','1']]);
 const store={getItem:k=>values.get(k)??null,setItem:(k,v)=>{if(k===deny&&!failed){failed=true;throw Error('Storage denied')}values.set(k,v)},removeItem:k=>{if(k===deny&&!failed){failed=true;throw Error('Storage denied')}values.delete(k)}};
 const fields={'.kf73Title':{textContent:'Create your Kinfolk'},'#kf73Name':{value:'QA'},'#kf73Email':{value:'qa@example.test'},'#kf73Password':{value:'testpass2026!'},'#kf79Birthdate':{value:'1990-01-01'},'#kf73Stay':{checked:stay},'.kf73Primary':{disabled:false,textContent:'Create account'}};
 const form={querySelectorAll(){return []},id:'authForm',isConnected:true,dataset:{kf73:'1'},querySelector:k=>k==='.kf73Msg'?msg:fields[k]||null,appendChild:x=>{if(x.className==='kf73Msg')msg=x}};
 const document={head:{appendChild(){}},documentElement:{},createElement:()=>({style:{},setAttribute(){},append(){},remove(){}}),addEventListener:(type,fn)=>{if(type==='submit')submit=fn}};
 const sb={auth:{getSession:async()=>({data:{session:sessionReads++===0?null:(confirmed?{access_token:'synthetic-signup-token',user:{id:'qa',email:'qa@example.test',email_confirmed_at:'2026-10-30T00:00:00Z'}}:null)},error:null}),signUp:async()=>({data:{user:{id:'qa',email:'qa@example.test',email_confirmed_at:'2026-10-30T00:00:00Z'},session:confirmed?{access_token:'synthetic-signup-token',user:{id:'qa',email:'qa@example.test',email_confirmed_at:'2026-10-30T00:00:00Z'}}:null},error:null}),signOut:async()=>{signouts++;return {error:null}}}};
 vm.runInNewContext(source,{window:{},document,sb,URL,Date,console,location:{origin:'https://qa.example.test'},localStorage:store,sessionStorage:store,MutationObserver:class{observe(){}},setTimeout(){},clearTimeout(){}});
 return {values,get signouts(){return signouts},async submit(){await submit({target:form,preventDefault(){},stopImmediatePropagation(){}});return msg?.textContent||''}};
}
test('partial preference write failure restores prior choice and signs out',async()=>{
 const f=run({deny:'kinfolk_stay_logged_in'});
 assert.match(await f.submit(),/could not save/);
 assert.equal(f.values.get('kinfolk_stay_logged_in_v1'),'1');
 assert.equal(f.signouts,1);
});
test('tab marker failure restores prior choice and signs out',async()=>{
 const f=run({deny:'kinfolk_session_tab'});
 assert.match(await f.submit(),/Enable browser storage/);
 assert.equal(f.values.get('kinfolk_stay_logged_in_v1'),'1');
 assert.equal(f.signouts,1);
});
test('unconfirmed signup does not write preferences',async()=>{
 const f=run({confirmed:false,deny:'kinfolk_stay_logged_in_v1'});
 assert.match(await f.submit(),/check your email/i);
 assert.equal(f.signouts,0);
});
test('successful one-tab signup writes the marker',async()=>{
 const f=run();
 assert.match(await f.submit(),/Opening Kinfolk/);
 assert.equal(f.values.get('kinfolk_stay_logged_in_v1'),'0');
 assert.equal(f.values.get('kinfolk_session_tab'),'1');
 assert.equal(f.signouts,0);
});
