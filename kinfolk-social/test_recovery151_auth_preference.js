/* Recovery151: synthetic auth event + login preference ordering regression.
 * Executes extracted production functions with mocked Supabase and storage.
 * No live users, backend requests, or physical devices are involved.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const phase=fs.readFileSync(path.join(__dirname,'kinfolk-phase95.js'),'utf8');
function extract(src,from,to){const a=src.indexOf(from),b=src.indexOf(to,a+from.length);assert.ok(a>=0&&b>a,'source region exists: '+from);return src.slice(a,b)}
const helper=extract(html,'async function kf129RestorableSession()','window.kf129Retry=');
const boot=extract(html,'async function boot()','async function hydrateUser()');
const save=extract(phase,'function saveStay(stay)','function unlock(pass)');
const adopt=extract(phase,'async function adopt(tokens)','let loginBusy=false');
const login=phase.indexOf('const tokens=await tokenLogin(email,password);');
const pref=phase.indexOf('const restoreStay=saveStay(stay);');
assert.ok(login>=0&&pref>login,'save preference after successful credentials but BEFORE setSession');
async function eventCase({stay=true,tab=false,stale=false,event='SIGNED_IN'}={}){
  let current=null,listener=null,signouts=0;
  const queued=[],activations=[];
  const user={user:{id:'synthetic-A'}};
  const sb={auth:{
    getSession:async()=>({data:{session:current},error:null}),
    signOut:async()=>{signouts++;current=null;return {error:null}},
    onAuthStateChange:cb=>{listener=cb}
  }};
  const runBoot=new Function('sb','localStorage','sessionStorage','window','kf129ActivateSession','kf129Error','kf129ReadyUid','document','setTimeout','console',helper+boot+';return boot;')(
    sb,{getItem:()=>stay?'1':'0'},{getItem:()=>tab?'1':null},{},
    async value=>{activations.push(value)},error=>{throw Error(error)},null,
    {querySelector:()=>null},fn=>{queued.push(fn)},console
  );
  await runBoot();
  activations.length=0;
  current=stale?{user:{id:'synthetic-B'}}:user;
  listener(event,user);
  while(queued.length)await queued.shift()();
  return {activations,signouts};
}
(async()=>{
  let result=await eventCase();
  assert.equal(result.activations.length,1,'persistent sign-in activates');
  assert.equal(result.activations[0].user.id,'synthetic-A');
  result=await eventCase({stay:false,tab:true});
  assert.equal(result.activations.length,1,'nonpersistent original tab activates');
  result=await eventCase({stay:false,tab:false});
  assert.equal(result.activations.length,0,'cross-tab sign-in not activated');
  assert.equal(result.signouts,1,'cross-tab session signed out');
  result=await eventCase({stale:true});
  assert.equal(result.activations.length,0,'stale event cannot activate different account');
  result=await eventCase({event:'USER_UPDATED'});
  assert.equal(result.activations.length,1,'profile updates preserve authenticated session');
  const stored={},seen=[];
  const sb={auth:{
    setSession:async()=>{seen.push({...stored});return {data:{session:{user:{id:'synthetic-A'}}},error:null}},
    getSession:async()=>({data:{session:{user:{id:'synthetic-A'}}}})
  }};
  const prefNames="const PREF1='kinfolk_stay_logged_in_v1',PREF2='kinfolk_stay_logged_in',TAB='kinfolk_session_tab';";
  const functions=new Function('sb','localStorage','sessionStorage','console','setTimeout','Date',prefNames+save+adopt+';return {saveStay,adopt};')(
    sb,{getItem:k=>stored[k]??null,setItem:(k,v)=>{stored[k]=v},removeItem:k=>{delete stored[k]}}, 
    {getItem:k=>stored[k]??null,setItem:(k,v)=>{stored[k]=v},removeItem:k=>{delete stored[k]}},
    console,setTimeout,Date
  );
  const syntheticTokens={access_token:'synthetic',refresh_token:'synthetic',user:{id:'synthetic-A'}};
  functions.saveStay(false);await functions.adopt(syntheticTokens);
  assert.equal(seen[0].kinfolk_stay_logged_in_v1,'0','nonpersistent preference exists at setSession');
  assert.equal(seen[0].kinfolk_session_tab,'1','original-tab marker exists at setSession');
  functions.saveStay(true);await functions.adopt(syntheticTokens);
  assert.equal(seen[1].kinfolk_stay_logged_in_v1,'1','persistent preference exists at setSession');
  assert.equal(seen[1].kinfolk_session_tab,undefined,'persistent login removes tab-only marker');
  console.log('PASS Recovery151: 7 synthetic scenarios, login ordering and storage/event assertions');
})().catch(error=>{console.error(error);process.exitCode=1});
