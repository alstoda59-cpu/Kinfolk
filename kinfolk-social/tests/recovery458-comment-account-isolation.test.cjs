'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const start=html.indexOf('async function addComment(e,pid){');
const end=html.indexOf('\nasync function deletePost(',start);
assert(start>=0&&end>start,'effective comment handler present');
const source=html.slice(start,end);
async function run(name,response,{switchAccount=false}={}){
 let resolveInsert,toastCalls=[],loads=0,renders=0,button={disabled:false};
 let epoch=1,user={id:'a'},inserted=null;
 const form={dataset:{},isConnected:true,elements:{namedItem:()=>({value:'hello'})},querySelector:()=>button};
 const ctx={state:{get user(){return user}},get kf129Epoch(){return epoch},
 kfAlphaLoadCurrent:(e,id)=>e===epoch&&id===user?.id,
 sb:{from:table=>{assert.equal(table,'comments');return {insert:(row,opts)=>{
  inserted={row,opts};return new Promise(resolve=>{resolveInsert=resolve});
 }}}},
 toast:(s)=>toastCalls.push(s),loadFeed:async()=>{loads++},renderApp:async()=>{renders++},
 $:()=>({classList:{remove:()=>{}}})};
 vm.runInNewContext(source+'\nthis.runComment=addComment;',ctx);
 const task=ctx.runComment({preventDefault(){},currentTarget:form},'post1');
 assert.equal(button.disabled,true,name);
 if(switchAccount){epoch=2;user={id:'b'}}
 resolveInsert(response);
 await task;
 assert.equal(inserted.row.author_id,'a',name);
 assert.equal(inserted.opts.count,'exact',name);
 if(switchAccount){assert.equal(loads,0,name);assert.equal(renders,0,name)}
 else if(!response.error&&response.count===1){assert.equal(loads,1,name);assert.equal(renders,1,name)}
 else {assert.equal(loads,0,name);assert.equal(renders,0,name)}
 if(!switchAccount&&response.count===0&&!response.error){
  assert.equal(button.disabled,false,name);
  assert.equal(form.dataset.kfCommentSending,undefined,name);
 }else assert.equal(button.disabled,true,name);
}
(async()=>{
 await run('confirmed insert',{error:null,count:1});
 await run('explicit zero rows',{error:null,count:0});
 await run('uncertain network failure',{error:new Error('offline'),count:null});
 await run('missing count',{error:null,count:null});
 await run('stale account response',{error:null,count:1},{switchAccount:true});
 console.log('Recovery458: five synthetic comment submission scenarios passed');
})().catch(e=>{console.error(e);process.exitCode=1});
