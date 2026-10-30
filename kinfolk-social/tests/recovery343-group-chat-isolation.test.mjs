import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Execute the real group-chat handler extracted from the mobile application.
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('// Recovery343: group chats must remain bound');
const end=html.indexOf('\nfunction modal(title,body){',start);
assert.ok(start>=0&&end>start,'Recovery343 group-chat handler exists');
const source=html.slice(start,end);
const A='account-a',B='account-b',G='group-one',OTHER='group-two';
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}}
function harness(){
 const groupReads=[],messageReads=[],writes=[],toasts=[],loaded=[];
 const root={innerHTML:''},state={user:{id:A},profiles:new Map([[A,{display_name:'Alice'}],[B,{display_name:'Bob'}]])};
 const ctx={
   state,kf129Epoch:1,kf300MessageRequest:1,toast:(...args)=>toasts.push(args),
   esc:value=>String(value??''),loadProfiles:async ids=>{loaded.push([...ids])},
   modal:(title,body)=>{
     ctx.kf300MessageRequest++;
     root.innerHTML=body;
     const button={disabled:false};
     const group=body.match(/data-group="([^"]+)"/)?.[1];
     ctx.form={dataset:{group},button,
       elements:{namedItem:name=>name==='body'?{value:'hello group'}:null},
       querySelector:()=>button};
   },
   $:selector=>selector==='#groupMsgForm'?ctx.form:null,
   sb:{from:table=>{
     if(table==='group_conversations')return {
       select(){return this},eq(){return this},
       single(){const d=deferred();groupReads.push(d);return d.promise}
     };
     if(table==='group_messages')return {
       select(){return this},eq(){return this},order(){return this},
       limit(){const d=deferred();messageReads.push(d);return d.promise},
       insert(payload){const d=deferred();writes.push({...d,payload});return d.promise}
     };
     throw Error('Unexpected table '+table);
   }}
 };
 vm.createContext(ctx);
 vm.runInContext(source+'\nthis.handlers={openGroup};',ctx,{timeout:1000});
 const settle=(id=G,messages=[])=>{
   assert.ok(groupReads.length&&messageReads.length,'group and messages queried');
   groupReads.shift().resolve({data:{id,title:'Friends'},error:null});
   messageReads.shift().resolve({data:messages,error:null});
 };
 return {ctx,state,root,groupReads,messageReads,writes,toasts,loaded,settle,
   openGroup:id=>ctx.handlers.openGroup(id),
   switchAccount:(uid=A)=>{state.user={id:uid};ctx.kf129Epoch++},
   replaceModal:()=>{ctx.kf300MessageRequest++}
 };
}
const message=(conversation_id,body,sender_id=B)=>({conversation_id,body,sender_id});

test('group chat excludes unrelated messages from overbroad backend response',async()=>{
 const h=harness(),pending=h.openGroup(G);
 h.settle(G,[message(G,'visible'),message(OTHER,'private other group')]);
 await pending;
 assert.match(h.root.innerHTML,/visible/);
 assert.doesNotMatch(h.root.innerHTML,/private other group/);
 assert.equal(h.loaded.length,1);
 assert.equal(h.loaded[0].length,1);
});

test('group response from another account never opens private chat',async()=>{
 const h=harness(),pending=h.openGroup(G);
 h.switchAccount('another-account');
 h.settle(G,[message(G,'stale secret')]);await pending;
 assert.equal(h.root.innerHTML,'');
 assert.equal(h.loaded.length,0);
});

test('same-user relogin epoch invalidates old group response',async()=>{
 const h=harness(),pending=h.openGroup(G);
 h.switchAccount(A);
 h.settle(G,[message(G,'stale')]);await pending;
 assert.equal(h.root.innerHTML,'');
});

test('closing or replacing a modal blocks delayed group render',async()=>{
 const h=harness(),pending=h.openGroup(G);
 h.replaceModal();h.settle(G,[message(G,'stale')]);await pending;
 assert.equal(h.root.innerHTML,'');
});

test('opening a newer group invalidates older request',async()=>{
 const h=harness(),first=h.openGroup(G),second=h.openGroup(OTHER);
 h.groupReads[1].resolve({data:{id:OTHER,title:'New group'},error:null});
 h.messageReads[1].resolve({data:[message(OTHER,'new message')],error:null});
 await second;
 h.groupReads[0].resolve({data:{id:G,title:'Old group'},error:null});
 h.messageReads[0].resolve({data:[message(G,'old message')],error:null});
 await first;
 assert.match(h.root.innerHTML,/new message/);
 assert.doesNotMatch(h.root.innerHTML,/old message/);
});

test('mismatched group record cannot render another group',async()=>{
 const h=harness(),pending=h.openGroup(G);
 h.groupReads.shift().resolve({data:{id:OTHER,title:'Wrong group'},error:null});
 h.messageReads.shift().resolve({data:[message(G,'secret')],error:null});
 await pending;
 assert.equal(h.root.innerHTML,'');
 assert.equal(h.toasts.length,1);
});

test('duplicate group send taps issue one write and restore failed form',async()=>{
 const h=harness(),opening=h.openGroup(G);h.settle();await opening;
 const form=h.ctx.form,event={preventDefault(){},currentTarget:form};
 const first=form.onsubmit(event),second=form.onsubmit(event);
 assert.equal(h.writes.length,1);
 assert.equal(form.dataset.kfSending,'1');
 assert.equal(form.button.disabled,true);
 assert.equal(h.writes[0].payload.sender_id,A);
 assert.equal(h.writes[0].payload.conversation_id,G);
 h.writes.shift().resolve({error:{message:'synthetic denied'}});
 await Promise.all([first,second]);
 assert.equal(form.dataset.kfSending,undefined);
 assert.equal(form.button.disabled,false);
 assert.equal(h.toasts[0][0],'synthetic denied');
});

test('stale group send cannot reopen chat after same-user relogin',async()=>{
 const h=harness(),opening=h.openGroup(G);h.settle();await opening;
 const form=h.ctx.form,send=form.onsubmit({preventDefault(){}});
 assert.equal(h.writes.length,1);
 h.switchAccount(A);
 h.writes.shift().resolve({error:null});await send;
 assert.equal(h.groupReads.length,0);
 assert.equal(h.toasts.length,0);
});

test('successful group send refreshes only current group',async()=>{
 const h=harness(),opening=h.openGroup(G);h.settle();await opening;
 const form=h.ctx.form,send=form.onsubmit({preventDefault(){}});
 h.writes.shift().resolve({error:null});
 for(let i=0;i<10&&h.groupReads.length===0;i++)await Promise.resolve();
 assert.equal(h.groupReads.length,1);
 h.settle(G,[message(G,'refreshed'),message(OTHER,'hidden')]);
 await send;
 assert.match(h.root.innerHTML,/refreshed/);
 assert.doesNotMatch(h.root.innerHTML,/hidden/);
});
