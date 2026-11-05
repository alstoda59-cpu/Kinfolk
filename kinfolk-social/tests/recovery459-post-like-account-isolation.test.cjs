'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const start=html.indexOf('const kf459PendingLikes=new Set();');
const end=html.indexOf('\nasync function addComment(',start);
assert(start>=0&&end>start,'Recovery459 handler exists');
const source=html.slice(start,end);
async function scenario({switchAccount=false,error=null,duplicate=false,count=1}={}){
 let uid='account-a',epoch=1,resolveQuery,loads=0,renders=0,writes=0,toasts=[];
 const ctx={
 state:{get user(){return {id:uid}},likes:new Map()},
 get kf129Epoch(){return epoch},
 kfAlphaLoadCurrent:(e,id)=>e===epoch&&id===uid,
 sb:{from:(table)=>{assert.equal(table,'post_likes');return {insert:(row)=>{assert.equal(row.user_id,'account-a');writes++;return new Promise(r=>resolveQuery=r)}}}},
 toast:(msg)=>toasts.push(msg),loadFeed:async()=>{loads++},renderApp:async()=>{renders++}
 };
 vm.runInNewContext(source+'\nthis.runLike=toggleLike;this.pendingLikes=kf459PendingLikes;',ctx);
 const first=ctx.runLike('post-a');
 if(duplicate)await ctx.runLike('post-a');
 assert.equal(writes,1,'one in-flight mutation per account and post');
 if(switchAccount){uid='account-b';epoch++;}
 resolveQuery({error,count});
 await first;
 assert.equal(loads,switchAccount||error||count!==1?0:1);
 assert.equal(renders,switchAccount||error?0:1);
 assert.equal(toasts.length,switchAccount?0:error||count!==1?1:0);
 assert.equal(ctx.pendingLikes.size,0,'pending request released');
}
(async()=>{
 await scenario();
 await scenario({duplicate:true});
 await scenario({switchAccount:true});
 await scenario({error:new Error('denied')});
 await scenario({count:0});
 await scenario({count:null});
 console.log('Recovery459: six source-executed synthetic like scenarios passed');
})().catch(e=>{console.error(e);process.exitCode=1});
