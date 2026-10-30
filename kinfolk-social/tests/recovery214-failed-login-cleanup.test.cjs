'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase95.js','utf8');
// Synthetic auth only. Never calls a live backend.
const start=source.indexOf('async function clearFailedLoginSession(');
const end=source.indexOf('async function adopt(tokens)',start);
assert.ok(start>=0&&end>start,'cleanup helper must be present');
const helper=source.slice(start,end);
function fixture({active='new-user',starting=null,fail=false,sessionError=false,available=true}={}){
 const calls=[],warnings=[];
 const sb={auth:{...(available?{async getSession(){if(sessionError)throw Error('synthetic session lookup failed');return {data:{session:{user:{id:active},access_token:'synthetic-access'}},error:null}},async signOut(options){calls.push(options);return fail?{error:Error('synthetic failure')}:{error:null}}}:{})}};
 const getAccount=async()=>{if(sessionError)throw Error('synthetic session lookup failed');return active};
 const clear=new Function('sb','currentAccountId','console',helper+';return clearFailedLoginSession;')(sb,getAccount,{warn:(...args)=>warnings.push(args)});
 return {clear,calls,warnings,starting};
}
test('failed login clears only its newly adopted local session',async()=>{
 const f=fixture();await f.clear('new-user',null,'synthetic-access');
 assert.equal(f.calls.length,1);
 assert.equal(f.calls[0].scope,'local');
});
test('does not sign out another account after an account switch',async()=>{
 const f=fixture({active:'different-user'});await f.clear('new-user',null,'synthetic-access');
 assert.equal(f.calls.length,0);
});
test('does not sign out an account that existed before login',async()=>{
 const f=fixture({starting:'old-user'});await f.clear('new-user','old-user','synthetic-access');
 assert.equal(f.calls.length,0);
});
test('cleanup failures are logged without masking the original login error',async()=>{
 for(const config of [{fail:true},{sessionError:true}]){
   const f=fixture(config);await f.clear('new-user',null,'synthetic-access');
   assert.equal(f.warnings.length,1);
 }
});
test('adoption and activation failures invoke guarded cleanup after restoring preference',()=>{
 const a=source.indexOf('catch(adoptError)');
 const b=source.indexOf('catch(activationError)');
 assert.ok(a>=0&&b>a);
 for(const [start,stop,marker] of [[a,b,'await clearFailedLoginSession(adoptError?.adoptedSessionId||tokens.user.id,startingAccount,adoptError?.adoptedSessionToken||tokens.access_token)'],[b,source.indexOf('if(form.isConnected',b),'await clearFailedLoginSession(session?.user?.id,startingAccount,session?.access_token)']]){
   const block=source.slice(start,stop);
   assert.ok(block.indexOf('restoreStay()')>=0&&block.indexOf(marker)>block.indexOf('restoreStay()'));
 }
});
