'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const start=html.indexOf('async function kf338RejectUnconfirmedSession(');
const end=html.indexOf('\nasync function kf129ActivateSession(',start);
assert(start>=0&&end>start,'effective cleanup handler exists');
const source=html.slice(start,end);
async function check(name,active,expectedClears,expectedSignouts,error=null){
 let clears=0,signouts=0;
 const ctx={sb:{auth:{
  getSession:async()=>({data:{session:active},error}),
  signOut:async({scope})=>{assert.equal(scope,'local');signouts++;return {error:null}}
 }},kf129ActivateSession:async s=>{assert.equal(s,null);clears++},
 kf338ConfirmedSession:s=>!!(s?.access_token&&s?.user?.email_confirmed_at),
 console:{warn:()=>{}}};
 vm.runInNewContext(source+'\nthis.cleanup=kf338RejectUnconfirmedSession;',ctx);
 await ctx.cleanup({user:{id:'member'},access_token:'old'});
 assert.equal(clears,expectedClears,name+' clears');
 assert.equal(signouts,expectedSignouts,name+' signouts');
}
(async()=>{
 await check('matching unconfirmed token',{user:{id:'member'},access_token:'old'},1,1);
 await check('new token same member',{user:{id:'member'},access_token:'new'},0,0);
 await check('new account',{user:{id:'other'},access_token:'new'},0,0);
 await check('confirmed replacement',{user:{id:'member',email_confirmed_at:'today'},access_token:'old'},0,0);
 await check('no active session',null,1,0);
 await check('session lookup error',null,1,0,new Error('offline'));
 console.log('Recovery457: six synthetic UI isolation scenarios passed');
})().catch(e=>{console.error(e);process.exitCode=1});
