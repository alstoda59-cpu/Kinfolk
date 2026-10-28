import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('// Recovery300: scope message requests');
const end=html.indexOf('function openAlbumModal()',start);
const modalStart=html.indexOf('function modal(title,body){');
const modalEnd=html.indexOf('// Recovery222:',modalStart);
assert.ok(start>=0&&end>start&&modalStart>=0&&modalEnd>modalStart,'Actual messaging and modal handlers must exist');
const actual=html.slice(start,end)+'\n'+html.slice(modalStart,modalEnd);

function deferred(){
 let resolve;
 const promise=new Promise(r=>{resolve=r});
 return {promise,resolve};
}
function harness(){
 const requests=[],writes=[],toasts=[],loaded=[];
 const state={user:{id:'A'},profiles:new Map([['peer',{display_name:'Peer',username:'peer'}],['other',{display_name:'Other',username:'other'}]]),friendRequests:[]};
 const root={innerHTML:''};
 const button={disabled:false};
 const form={elements:{namedItem:()=>({value:'hello'})},querySelector:()=>button};
 const ctx={
   state,kf129Epoch:1,
   kfAlphaLoadCurrent:(epoch,uid)=>!!uid&&epoch===ctx.kf129Epoch&&state.user?.id===uid,
   kfAlphaCanDm:()=>true,
   loadProfiles:async ids=>{loaded.push(ids)},
   toast:(...args)=>toasts.push(args),
   esc:value=>String(value??''),
   $:selector=>selector==='#modalRoot'?root:selector==='#dmForm'?form:null,
   sb:{from:table=>{
     assert.equal(table,'messages');
     return {
       select(){return this},or(){return this},order(){return this},
       limit(){const d=deferred();requests.push(d);return d.promise},
       insert(payload){const d=deferred();writes.push({...d,payload});return d.promise}
     };
   }}
 };
 vm.createContext(ctx);
 vm.runInContext(actual+'\nthis.__handlers={openMessages,openDm,modal,closeModal};',ctx,{timeout:1000});
 return {ctx,state,root,form,button,requests,writes,toasts,loaded,...ctx.__handlers,
   switchAccount(uid){state.user={id:uid};ctx.kf129Epoch++}};
}

test('DM response from previous login never renders after account switch',async()=>{
 const h=harness(),pending=h.openDm('peer');
 h.switchAccount('B');
 h.requests.shift().resolve({data:[{sender_id:'A',receiver_id:'peer',body:'private message'}]});
 await pending;
 assert.equal(h.root.innerHTML,'');
});

test('newer peer request wins over slower previous conversation',async()=>{
 const h=harness(),old=h.openDm('peer'),latest=h.openDm('other');
 const first=h.requests.shift(),second=h.requests.shift();
 second.resolve({data:[{sender_id:'A',receiver_id:'other',body:'newer conversation'}]});
 await latest;
 first.resolve({data:[{sender_id:'A',receiver_id:'peer',body:'older conversation'}]});
 await old;
 assert.match(h.root.innerHTML,/>newer conversation</);
 assert.doesNotMatch(h.root.innerHTML,/>older conversation</);
});

test('closing or replacing a modal prevents delayed DM reopening',async()=>{
 const h=harness(),pending=h.openDm('peer');
 h.closeModal();
 h.requests.shift().resolve({data:[{sender_id:'A',receiver_id:'peer',body:'should stay closed'}]});
 await pending;
 assert.equal(h.root.innerHTML,'');
});

test('overbroad backend DM response is filtered to initiating pair',async()=>{
 const h=harness(),pending=h.openDm('peer');
 h.requests.shift().resolve({data:[
   {sender_id:'A',receiver_id:'peer',body:'allowed'},
   {sender_id:'C',receiver_id:'other',body:'unrelated private text'}
 ]});
 await pending;
 assert.match(h.root.innerHTML,/>allowed</);
 assert.doesNotMatch(h.root.innerHTML,/unrelated private text/);
});

test('stale DM form cannot submit as a newly signed-in account',async()=>{
 const h=harness(),pending=h.openDm('peer');
 h.requests.shift().resolve({data:[]});
 await pending;
 h.switchAccount('B');
 await h.form.onsubmit({preventDefault(){}});
 assert.equal(h.writes.length,0);
});

test('in-flight DM send uses captured sender and cannot reopen after switch',async()=>{
 const h=harness(),pending=h.openDm('peer');
 h.requests.shift().resolve({data:[]});
 await pending;
 const sent=h.form.onsubmit({preventDefault(){}});
 assert.equal(h.writes.length,1);
 assert.deepEqual({...h.writes[0].payload},{sender_id:'A',receiver_id:'peer',body:'hello'});
 h.switchAccount('B');
 h.writes[0].resolve({error:null});
 await sent;
 assert.equal(h.requests.length,0);
 assert.equal(h.toasts.length,0);
});

test('stale inbox response does not load profiles or open inbox',async()=>{
 const h=harness(),pending=h.openMessages();
 h.switchAccount('B');
 h.requests.shift().resolve({data:[{sender_id:'A',receiver_id:'peer',body:'private'}]});
 await pending;
 assert.equal(h.loaded.length,0);
 assert.equal(h.root.innerHTML,'');
});

test('inbox excludes rows not belonging to current account',async()=>{
 const h=harness(),pending=h.openMessages();
 h.requests.shift().resolve({data:[
   {sender_id:'A',receiver_id:'peer',body:'allowed'},
   {sender_id:'C',receiver_id:'other',body:'unrelated'}
 ]});
 await pending;
 assert.match(h.root.innerHTML,/>Peer</);
 assert.doesNotMatch(h.root.innerHTML,/>Other</);
 assert.equal(h.loaded.length,1);
});
