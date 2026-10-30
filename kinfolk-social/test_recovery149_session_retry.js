/* Recovery149: offline regression for session restoration and Retry policy. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const a=html.indexOf('function kf339RestoreAllowed(){');
const b=html.indexOf('async function boot()',a);
assert.ok(a>0&&b>a,'extract real restoration helper and Retry handler');
const actual=html.slice(a,b);
assert.match(html,/async function boot\(\)\{\s*try\{\s*await kf129ActivateSession\(await kf129RestorableSession\(\)\)/,'boot must enforce restoration policy');
function setup({stay=true,tab=false,blockedLocal=false,blockedTab=false,session=true,signOutError=false}={}){
  const calls={signOut:[],activate:[],errors:[]};
  const value=session?{user:{id:'synthetic-user'}}:null;
  const sb={auth:{getSession:async()=>({data:{session:value},error:null}),signOut:async opts=>{calls.signOut.push(opts);return {error:signOutError?new Error('signout failed'):null}}}};
  const localStorage={getItem:key=>{if(blockedLocal)throw Error('local blocked');return stay?'1':'0'}};
  const sessionStorage={getItem:key=>{if(blockedTab)throw Error('tab blocked');return tab?'1':null}};
  const window={};
  const ctx={sb,localStorage,sessionStorage,window,kf129ActivateSession:async s=>calls.activate.push(s),kf129Error:e=>calls.errors.push(e),String};
  const helper=vm.runInNewContext(actual+';kf129RestorableSession',ctx);
  return {helper,window,calls,value};
}
(async()=>{
  let t=setup();assert.equal(await t.helper(),t.value,'persistent session restored');assert.equal(t.calls.signOut.length,0);
  t=setup({stay:false,tab:true});assert.equal(await t.helper(),t.value,'unchecked Stay Logged In allows original tab');
  t=setup({stay:false,tab:false});assert.equal(await t.helper(),null,'unchecked Stay Logged In rejects new tab');assert.equal(t.calls.signOut.length,1);assert.equal(t.calls.signOut[0].scope,'local');
  t=setup({stay:false,tab:false});await t.window.kf129Retry();assert.equal(t.calls.activate[0],null,'Retry cannot bypass nonpersistent session policy');assert.equal(t.calls.signOut.length,1);
  t=setup({blockedLocal:true,tab:false});assert.equal(await t.helper(),null,'blocked local storage fails closed');
  t=setup({blockedLocal:true,tab:true});assert.equal(await t.helper(),t.value,'existing tab survives local storage restriction');
  t=setup({stay:false,blockedTab:true});assert.equal(await t.helper(),null,'blocked session storage cannot restore a new tab');
  t=setup({session:false});assert.equal(await t.helper(),null,'signed-out visitor remains signed out');assert.equal(t.calls.signOut.length,0);
  t=setup({stay:false,signOutError:true});await assert.rejects(t.helper(),/signout failed/,'sign-out failure is not silently ignored');
  console.log('PASS: boot and retry share session policy, same-tab refresh, new-tab sign-out, storage failure, and error handling');
})().catch(e=>{console.error(e);process.exitCode=1});
