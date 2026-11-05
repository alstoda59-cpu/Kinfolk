'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const start=source.indexOf('const kf461PendingDeletes=new Set();');
const end=source.indexOf('function sharePost(',start);
assert(start>=0&&end>start,'delete handler present');
const handler=source.slice(start,end);
async function scenario({count=1,error=null,changeAccount=false,throwWrite=false}={}){
 let writes=0,loads=0,renders=0,success=0,warnings=0;
 const state={user:{id:'alice'}};
 const ctx={Set, state,kf129Epoch:1,confirm:()=>true,
 kfAlphaLoadCurrent:(epoch,uid)=>epoch===ctx.kf129Epoch&&uid===state.user?.id,
 sb:{from:(table)=>{assert.equal(table,'posts');return {delete:({count:mode})=>{assert.equal(mode,'exact');return {eq:(column,value)=>{assert.equal(column,'id');assert.equal(value,'post1');return {eq:async(col,user)=>{assert.equal(col,'author_id');assert.equal(user,'alice');writes++;if(changeAccount)state.user={id:'bob'};if(throwWrite)throw Error('network');return {count,error};}}}}}}}},
 loadFeed:async()=>{loads++},renderApp:async()=>{renders++},
 toast:(message,kind)=>{if(kind==='danger')warnings++;else success++}};
 vm.createContext(ctx);vm.runInContext(handler,ctx);
 await ctx.deletePost('post1');await ctx.deletePost('post1');
 return {writes,loads,renders,success,warnings};
}
(async()=>{
 assert.deepEqual(await scenario(),{writes:1,loads:1,renders:1,success:1,warnings:0});
 assert.deepEqual(await scenario({count:0}),{writes:1,loads:0,renders:0,success:0,warnings:1});
 assert.deepEqual(await scenario({count:null}),{writes:1,loads:0,renders:0,success:0,warnings:1});
 assert.deepEqual(await scenario({error:{message:'private'}}),{writes:1,loads:0,renders:0,success:0,warnings:1});
 assert.deepEqual(await scenario({changeAccount:true}),{writes:2,loads:0,renders:0,success:0,warnings:0});
 assert.deepEqual(await scenario({throwWrite:true}),{writes:1,loads:0,renders:0,success:0,warnings:1});
 console.log('Recovery461: six synthetic delete-post scenarios passed');
})().catch(e=>{console.error(e);process.exitCode=1});
