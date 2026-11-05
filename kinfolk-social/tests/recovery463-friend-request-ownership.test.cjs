'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const start=html.indexOf('const kf463FriendPending=new Set();');
const end=html.indexOf('async function renderNotifications(',start);
assert(start>=0&&end>start,'friendship handlers must exist');
const code=html.slice(start,end);
const calls=[];
let resolveWrite;
const deferred=()=>new Promise(resolve=>{resolveWrite=resolve});
let write=()=>deferred(),epoch=1,uid='alice',renders=0,loads=0;
const request={id:'r1',sender_id:'bob',receiver_id:'alice',status:'pending'};
const state={user:{id:uid},friendRequests:[request]};
const sb={from(table){assert.equal(table,'friend_requests');return {
 insert(payload){calls.push(['insert',payload]);return write()},
 update(payload,opts){calls.push(['update',payload,opts]);const filters=[];const q={eq(k,v){filters.push([k,v]);if(filters.length===3){calls.push(['filters',filters]);return write()}return q}};return q}
}}};
const ctx={state,sb,toast:()=>{},kf129Epoch:epoch,kfAlphaLoadCurrent:(e,u)=>e===epoch&&u===uid,loadFriendRequests:async()=>{loads++},renderApp:async()=>{renders++},Set,Promise};
vm.createContext(ctx);vm.runInContext(code,ctx);
(async()=>{
 let pending=ctx.sendFriend('dana');
 assert.equal(calls[0][1].sender_id,'alice');
 await ctx.sendFriend('dana');assert.equal(calls.length,1,'duplicate request suppressed');
 uid='charlie';state.user={id:uid};epoch++;
 resolveWrite({error:null});await pending;
 assert.equal(renders,0,'old account cannot refresh new UI');
 uid='alice';state.user={id:uid};epoch++;
 write=async()=>({error:null,count:1});
 await ctx.acceptFriend('r1');
 assert.equal(calls[1][0],'update');
 assert.deepEqual(calls[2][1],[['id','r1'],['receiver_id','alice'],['status','pending']]);
 assert.equal(renders,1);
 uid='charlie';state.user={id:uid};epoch++;
 await ctx.acceptFriend('r1');assert.equal(calls.length,3,'nonrecipient cannot accept');
 console.log('Recovery463 synthetic friendship isolation checks passed');
})().catch(e=>{console.error(e);process.exitCode=1});
