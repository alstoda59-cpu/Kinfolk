// Recovery454: synthetic-only SIGNED_OUT identity regression. No network or real accounts.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'index.html'),'utf8');
function extract(start,end){const a=html.indexOf(start);const b=html.indexOf(end,a+start.length);assert(a>=0&&b>a,'authentication function missing');return html.slice(a,b)}
const source=extract('function kf338ConfirmedSession(session){','async function kf338RejectUnconfirmedSession')+'\n'+extract('async function kf286HandleSignedOutEvent(){','async function boot(){');
async function run(session,readyUid,shouldClear,sessionError=null){
 let cleared=0;
 const context={sb:{auth:{getSession:async()=>({data:{session},error:sessionError})}},kf129ReadyUid:readyUid,kf129ActivateSession:async()=>{cleared++},kf129Timeout:async(p)=>p,console};
 vm.createContext(context);
 vm.runInContext(source,context);
 const result=await context.kf286HandleSignedOutEvent();
 assert.equal(result,shouldClear);
 assert.equal(cleared,shouldClear?1:0);
}
(async()=>{
 const confirmed=id=>({access_token:'synthetic-token',user:{id,email_confirmed_at:'2026-11-04T00:00:00Z'}});
 await run(confirmed('account-a'),'account-a',false);
 await run(confirmed('account-b'),'account-a',true);
 await run({user:{id:'account-a'}},'account-a',true);
 await run(null,'account-a',true);
 await run(confirmed('account-a'),'account-a',true,new Error('Synthetic auth failure'));
 await run(confirmed('account-a'),null,true);
 await run({access_token:' ',user:{id:'account-a',email_confirmed_at:'2026-11-04'}},'account-a',true);
 console.log('Recovery454 SIGNED_OUT identity regression: 7/7 passed');
})().catch(e=>{console.error(e);process.exitCode=1});
