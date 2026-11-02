'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
const start=source.indexOf('let kf406GroupListRequest=0;');
const end=source.indexOf('async function openGroupCreate()',start);
assert.ok(start>=0&&end>start,'effective group-list handler exists');
const code=source.slice(start,end);
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return {promise,resolve,reject}}
function harness(response){
 const messages=[],rendered=[];
 const ctx={state:{user:{id:'owner'}},kf129Epoch:4,kf300MessageRequest:12,
   sb:{from(table){assert.equal(table,'group_conversations');return {select(cols){assert.equal(cols,'*');return {order(col,opts){assert.equal(col,'created_at');assert.equal(opts.ascending,false);return typeof response==='function'?response():response||Promise.resolve({data:[{id:'g1',owner_id:'owner',title:'Friends'}],error:null})}}}}}},
   toast:(message,kind)=>messages.push({message,kind}),
   modal:(title,html)=>{rendered.push({title,html});ctx.kf300MessageRequest++},
   esc:x=>String(x)};
 const openGroups=vm.runInNewContext(code+'\nopenGroups',ctx,{timeout:1000});
 return {ctx,messages,rendered,openGroups};
}
test('Recovery406 shows confirmed group list for unchanged account and modal',async()=>{
 const h=harness();await h.openGroups();assert.equal(h.rendered.length,1);assert.match(h.rendered[0].html,/Friends/);assert.match(h.rendered[0].html,/Owner/);
});
test('Recovery406 ignores list returned after account switch',async()=>{
 const gate=deferred(),h=harness(gate.promise);const pending=h.openGroups();h.ctx.state.user={id:'other'};gate.resolve({data:[{id:'g1',owner_id:'owner',title:'Private'}],error:null});await pending;assert.equal(h.rendered.length,0);
});
test('Recovery406 ignores old list after same account reauthentication',async()=>{
 const gate=deferred(),h=harness(gate.promise);const pending=h.openGroups();h.ctx.kf129Epoch++;gate.resolve({data:[],error:null});await pending;assert.equal(h.rendered.length,0);
});
test('Recovery406 does not replace a newer mobile modal',async()=>{
 const gate=deferred(),h=harness(gate.promise);const pending=h.openGroups();h.ctx.kf300MessageRequest++;gate.resolve({data:[],error:null});await pending;assert.equal(h.rendered.length,0);
});
test('Recovery406 later group list request wins out of order',async()=>{
 const old=deferred(),h=harness(()=>h.calls++===0?old.promise:Promise.resolve({data:[{id:'new',owner_id:'owner',title:'New group'}],error:null}));h.calls=0;
 const first=h.openGroups();await h.openGroups();old.resolve({data:[{id:'old',owner_id:'owner',title:'Old group'}],error:null});await first;assert.equal(h.rendered.length,1);assert.match(h.rendered[0].html,/New group/);
});
test('Recovery406 stale database error does not show to next member',async()=>{
 const gate=deferred(),h=harness(gate.promise);const pending=h.openGroups();h.ctx.state.user={id:'other'};gate.resolve({data:null,error:{message:'owner private error'}});await pending;assert.equal(h.messages.length,0);
});
test('Recovery406 active query rejection is handled without unhandled promise',async()=>{
 const h=harness(Promise.reject(Error('offline')));await h.openGroups();assert.equal(h.rendered.length,0);assert.equal(h.messages.length,1);assert.match(h.messages[0].message,/offline/);
});
test('Recovery406 logged-out user does not query or render groups',async()=>{
 const h=harness(()=>{throw Error('query should not run')});h.ctx.state.user=null;await h.openGroups();assert.equal(h.rendered.length,0);
});
