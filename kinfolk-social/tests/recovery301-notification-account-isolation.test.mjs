import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const readStart=html.indexOf('// Recovery301: notification reads and writes');
const readEnd=html.indexOf('function renderAuth(',readStart);
const writeStart=html.indexOf('async function markAllRead(){',readEnd);
const writeEnd=html.indexOf('async function openProfile(',writeStart);
assert.ok(readStart>=0&&readEnd>readStart&&writeStart>readEnd&&writeEnd>writeStart,
  'Extract actual notification handlers from committed application source');
const actual=html.slice(readStart,readEnd)+'\n'+html.slice(writeStart,writeEnd);

function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}}
function harness(){
 const reads=[],writes=[],profileLoads=[],renders=[],toasts=[],warnings=[];
 const state={user:{id:'A'},view:'notifications',notifications:[]};
 const ctx={
  state,kf129Epoch:1,
  kfAlphaLoadCurrent:(epoch,uid)=>!!uid&&epoch===ctx.kf129Epoch&&state.user?.id===uid,
  loadProfiles:async ids=>{profileLoads.push([...ids])},
  renderApp:async()=>{renders.push(state.view)},
  toast:(...args)=>toasts.push(args),
  console:{warn:(...args)=>warnings.push(args)},
  sb:{from:table=>{
   assert.equal(table,'notifications');
   const req={table,recipient:null,ids:null,payload:null};
   const query={
    select(){return this},
    update(payload){req.payload=payload;return this},
    eq(column,value){assert.equal(column,'recipient_id');req.recipient=value;return this},
    order(){return this},
    limit(){const d=deferred();reads.push({...req,...d});return d.promise},
    in(column,ids){assert.equal(column,'id');req.ids=ids;const d=deferred();writes.push({...req,...d});return d.promise}
   };
   return query;
  }}
 };
 vm.createContext(ctx);
 vm.runInContext(actual+'\nthis.handlers={loadNotifications,markAllRead};',ctx,{timeout:1000});
 return {...ctx.handlers,ctx,state,reads,writes,profileLoads,renders,toasts,warnings,
  switchAccount(uid){state.user={id:uid};ctx.kf129Epoch++}};
}
const note=(recipient_id,id='n1')=>({id,recipient_id,actor_id:'actor-'+id,read_at:null});

test('notification query explicitly scopes recipient to active user',async()=>{
 const h=harness(),p=h.loadNotifications();
 assert.equal(h.reads[0].recipient,'A');
 h.reads[0].resolve({data:[note('A')]});
 await p;
 assert.equal(h.state.notifications.length,1);
 assert.deepEqual(h.profileLoads,[['actor-n1']]);
});
test('overbroad backend results cannot expose another recipient',async()=>{
 const h=harness(),p=h.loadNotifications();
 h.reads[0].resolve({data:[note('B','secret'),note('A','visible')]});
 await p;
 assert.deepEqual(h.state.notifications.map(n=>n.id),['visible']);
 assert.deepEqual(h.profileLoads,[['actor-visible']]);
});
test('stale read cannot overwrite next account or load its actors',async()=>{
 const h=harness(),a=h.loadNotifications();
 h.switchAccount('B');const b=h.loadNotifications();
 h.reads[1].resolve({data:[note('B','b')]});await b;
 h.reads[0].resolve({data:[note('A','a')]});await a;
 assert.deepEqual(h.state.notifications.map(n=>n.id),['b']);
 assert.deepEqual(h.profileLoads,[['actor-b']]);
});
test('older same-session request cannot overwrite newer notification load',async()=>{
 const h=harness(),a=h.loadNotifications(),b=h.loadNotifications();
 h.reads[1].resolve({data:[note('A','new')]});await b;
 h.reads[0].resolve({data:[note('A','old')]});await a;
 assert.deepEqual(h.state.notifications.map(n=>n.id),['new']);
});
test('mark-read only writes current recipient IDs and never includes foreign rows',async()=>{
 const h=harness();h.state.notifications=[note('B','foreign'),note('A','own')];
 const p=h.markAllRead();
 assert.equal(h.writes.length,1);
 assert.equal(h.writes[0].recipient,'A');
 assert.deepEqual(h.writes[0].ids,['own']);
 h.writes[0].resolve({error:null});
 await Promise.resolve();
 assert.equal(h.reads.length,1);
 h.reads[0].resolve({data:[{...note('A','own'),read_at:'now'}]});
 await p;
 assert.equal(h.renders.length,1);
});
test('stale mark-read completion cannot reload or render another account',async()=>{
 const h=harness();h.state.notifications=[note('A')];
 const p=h.markAllRead();
 h.switchAccount('B');h.state.notifications=[note('B','b')];
 h.writes[0].resolve({error:null});await p;
 assert.equal(h.reads.length,0);
 assert.equal(h.renders.length,0);
 assert.equal(h.toasts.length,0);
});
test('duplicate mark-read clicks are suppressed while a write is pending',async()=>{
 const h=harness();h.state.notifications=[note('A')];
 const a=h.markAllRead(),b=h.markAllRead();
 assert.equal(h.writes.length,1);
 await b;
 h.writes[0].resolve({error:null});await Promise.resolve();
 h.reads[0].resolve({data:[]});await a;
});
test('failed mark-read preserves unread state and surfaces an error',async()=>{
 const h=harness();h.state.notifications=[note('A')];
 const p=h.markAllRead();h.writes[0].resolve({error:{message:'permission denied'}});await p;
 assert.equal(h.state.notifications.length,1);
 assert.equal(h.reads.length,0);
 assert.equal(h.renders.length,0);
 assert.equal(h.toasts[0][0],'permission denied');
});
test('mark-read completion never navigates back to notifications',async()=>{
 const h=harness();h.state.notifications=[note('A')];
 const p=h.markAllRead();h.state.view='home';h.writes[0].resolve({error:null});
 await Promise.resolve();h.reads[0].resolve({data:[]});await p;
 assert.equal(h.renders.length,0);
});
