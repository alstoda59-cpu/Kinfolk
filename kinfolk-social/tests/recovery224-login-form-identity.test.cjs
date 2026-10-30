'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase95.js','utf8');

// Full Phase95 login handler, synthetic SDK/storage/DOM. No real network, users,
// database writes, mobile WebView or account credentials.
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}}
function fixture(stage='token'){
 const hold=deferred(),prefs=new Map(),tab=new Map(),timers=[];
 let session=null,tokenCalls=0,signouts=0,activations=0,adoptions=0;
 const user={id:'qa-user',email:'first@example.test'};
 const store=map=>({
   getItem:k=>map.get(k)??null,
   setItem:(k,v)=>map.set(k,String(v)),
   removeItem:k=>map.delete(k)
 });
 const fields={
   '.kf73Title':{textContent:'Welcome back'},
   '#kf73Email':{value:'first@example.test'},
   '#kf73Password':{value:'password9',removeAttribute(){},autocomplete:''},
   '#kf73Stay':{checked:true},
   '.kf73Primary':{disabled:false,textContent:'Log in'}
 };
 const form={isConnected:true,onsubmit:null,__kf95Handler:null,
   querySelector:s=>fields[s]||null,
   appendChild:n=>{fields['.kf73Msg']=n}
 };
 const document={
   documentElement:{},visibilityState:'visible',
   querySelector:s=>s==='#authForm[data-kf73="1"]'?form:null,
   getElementById:s=>s==='authForm'?form:null,
   createElement:()=>({style:{},textContent:''})
 };
 const auth={
   async getSession(){return {data:{session},error:null}},
   async setSession(){
     adoptions++;
     if(stage==='adopt'&&adoptions===1)await hold.promise;
     user.email=fields['#kf73Email'].value;
     session={user,access_token:'fake',refresh_token:'fake'};
     return {data:{session},error:null};
   },
   async signOut(options){assert.equal(options.scope,'local');signouts++;session=null;return {error:null}}
 };
 const window={kf129ActivateSession:async value=>{assert.equal(value.user.id,user.id);activations++}};
 const fetch=async()=>{
   tokenCalls++;
   if((stage==='token'||stage==='token-error')&&tokenCalls===1)await hold.promise;
   if(stage==='token-error'&&tokenCalls===1)
     return {ok:false,status:400,json:async()=>({error_description:'Invalid login credentials'})};
   return {ok:true,status:200,json:async()=>({access_token:'fake',refresh_token:'fake',user:{id:user.id,email:fields['#kf73Email'].value,email_confirmed_at:'2026-10-29T12:00:00.000Z'}})};
 };
 class AbortControllerStub{constructor(){this.signal={aborted:false}}abort(){this.signal.aborted=true}}
 const ctx={window,document,sb:{auth},fetch,localStorage:store(prefs),sessionStorage:store(tab),
   AbortController:AbortControllerStub,MutationObserver:class{observe(){}},
   setTimeout(fn,delay){if(delay===0)timers.push(fn);return 1},
   clearTimeout(){},setInterval(){},console:{log(){},warn(){}}};
 vm.runInNewContext(source,ctx,{filename:'kinfolk-phase95.js'});
 for(const fn of timers)fn();
 assert.equal(typeof form.onsubmit,'function','production login handler bound');
 const submit=()=>form.onsubmit({preventDefault(){},stopImmediatePropagation(){}});
 const remount=()=>{
   fields['.kf73Title']={textContent:'Create your Kinfolk'};
   fields['.kf73Title']={textContent:'Welcome back'};
   fields['.kf73Email']={value:'second@example.test'};
   fields['.kf73Password']={value:'password9',removeAttribute(){},autocomplete:''};
   fields['.kf73Stay']={checked:true};
   fields['.kf73Primary']={disabled:false,textContent:'Log in'};
   delete fields['.kf73Msg'];
 };
 return {submit,remount,hold,prefs,tab,fields,
   get tokenCalls(){return tokenCalls},get adoptions(){return adoptions},
   get activations(){return activations},get signouts(){return signouts},
   get session(){return session}
 };
}
async function until(fn){
 for(let i=0;i<50&&!fn();i++)await Promise.resolve();
 assert.ok(fn(),'deferred stage not reached');
}

test('old login token success cannot activate after Login -> Signup -> Login',async()=>{
 const f=fixture('token'),first=f.submit();
 await until(()=>f.tokenCalls===1);
 f.remount();
 await f.submit();
 assert.equal(f.tokenCalls,1,'busy lock prevents second token request');
 assert.match(f.fields['.kf73Msg'].textContent,/previous login attempt/i);
 f.hold.resolve();await first;
 assert.equal(f.activations,0);
 assert.equal(f.adoptions,0);
 assert.equal(f.prefs.size,0,'old login cannot persist preference');
 assert.match(f.fields['.kf73Msg'].textContent,/previous login attempt/i);
 await f.submit();
 assert.equal(f.tokenCalls,2);
 assert.equal(f.activations,1,'new login may succeed after old request finishes');
});

test('old login token error cannot repaint a new login screen',async()=>{
 const f=fixture('token-error'),first=f.submit();
 await until(()=>f.tokenCalls===1);
 f.remount();
 await f.submit();
 const note=f.fields['.kf73Msg'].textContent;
 f.hold.resolve();await first;
 assert.equal(f.fields['.kf73Msg'].textContent,note);
 assert.equal(f.activations,0);
 assert.equal(f.prefs.size,0);
 await f.submit();
 assert.equal(f.activations,1);
});

test('navigation during session adoption restores preference and signs out only adopted account',async()=>{
 const f=fixture('adopt'),first=f.submit();
 await until(()=>f.adoptions===1);
 assert.equal(f.prefs.get('kinfolk_stay_logged_in_v1'),'1','choice set before session adoption');
 f.remount();
 await f.submit();
 assert.equal(f.adoptions,1,'new login blocked during adoption');
 f.hold.resolve();await first;
 assert.equal(f.activations,0,'stale adoption must not open main app');
 assert.equal(f.prefs.size,0,'stale adoption restores previous preference');
 assert.equal(f.signouts,1,'stale adopted session cleaned up locally');
 assert.equal(f.session,null);
 await f.submit();
 assert.equal(f.activations,1,'new login works after cleanup');
});
