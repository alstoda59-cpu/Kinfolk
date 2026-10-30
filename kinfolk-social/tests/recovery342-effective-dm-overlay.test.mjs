import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Exercise the effective disappearing-message override, not the earlier
// Recovery300 handler that it replaces at runtime.
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('let kfAlphaDmOpenEpoch=0;');
const end=html.indexOf('})();',start);
assert.ok(start>=0&&end>start,'effective DM overlay source exists');
const source=html.slice(start,end);

const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const C='33333333-3333-4333-8333-333333333333';
function deferred(){
 let resolve;
 const promise=new Promise(r=>{resolve=r});
 return {promise,resolve};
}
function harness(){
 const requests=[],writes=[],toasts=[],readMarks=[];
 const state={user:{id:A},profiles:new Map([[B,{display_name:'Friend'}]])};
 const root={innerHTML:''};
 const ctx={state,kf129Epoch:1,kf300MessageRequest:1,window:{},
   kfAlphaCanDm:()=>true,
   toast:(...args)=>toasts.push(args),
   esc:value=>String(value??''),
   fmt:value=>String(value??''),
   modal:(title,body)=>{
     ctx.kf300MessageRequest++;
     root.innerHTML=body;
     const button={disabled:false};
     const form={dataset:{peer:B},button,
       elements:{namedItem:name=>name==='body'?{value:'hello'}:{checked:true}},
       querySelector:()=>button
     };
     ctx.currentForm=form;
   },
   $:selector=>selector==='#dmForm'?ctx.currentForm:null,
   document:{getElementById:id=>id==='dmForm'?ctx.currentForm:null},
   sb:{
     from:table=>{
       if(table==='messages')return {
         select(){return this},or(){return this},order(){return this},
         limit(){const d=deferred();requests.push(d);return d.promise},
         insert(payload){const d=deferred();writes.push({...d,payload});return d.promise}
       };
       if(table==='kinfolk_user_preferences')return {
         select(){return this},eq(){return this},
         maybeSingle:async()=>({data:{disappearing_messages_default:true},error:null})
       };
       throw Error('Unexpected table '+table);
     },
     rpc:async(name,payload)=>{readMarks.push({name,payload});return {error:null}}
   }
 };
 vm.createContext(ctx);
 vm.runInContext(source,ctx,{timeout:1000});
 return {ctx,state,root,requests,writes,toasts,readMarks,
   openDm:peer=>ctx.window.openDm(peer),
   switchSameAccount(){ctx.kf129Epoch++},
   replaceModal(){ctx.kf300MessageRequest++}
 };
}

test('effective DM overlay filters unrelated backend rows before rendering',async()=>{
 const h=harness(),pending=h.openDm(B);
 h.requests.shift().resolve({data:[
   {sender_id:A,receiver_id:B,body:'allowed'},
   {sender_id:C,receiver_id:B,body:'unrelated private message'},
   {sender_id:B,receiver_id:C,body:'other conversation'}
 ],error:null});
 await pending;
 assert.match(h.root.innerHTML,/allowed/);
 assert.doesNotMatch(h.root.innerHTML,/unrelated private message|other conversation/);
 assert.equal(h.readMarks.length,0);
});

test('same-user logout/login epoch invalidates a delayed DM read',async()=>{
 const h=harness(),pending=h.openDm(B);
 h.switchSameAccount();
 h.requests.shift().resolve({data:[{sender_id:A,receiver_id:B,body:'stale'}],error:null});
 await pending;
 assert.equal(h.root.innerHTML,'');
});

test('replaced modal cannot be reopened by an old DM response',async()=>{
 const h=harness(),pending=h.openDm(B);
 h.replaceModal();
 h.requests.shift().resolve({data:[{sender_id:A,receiver_id:B,body:'stale'}],error:null});
 await pending;
 assert.equal(h.root.innerHTML,'');
});

test('unread refresh also filters unrelated rows and marks only this pair',async()=>{
 const h=harness(),pending=h.openDm(B);
 h.requests.shift().resolve({data:[
   {id:'m1',sender_id:B,receiver_id:A,body:'received',first_read_at:null},
   {id:'m2',sender_id:C,receiver_id:A,body:'unrelated unread',first_read_at:null}
 ],error:null});
 // Wait for the read receipt continuation to enqueue the refresh.
 for(let i=0;i<8&&h.requests.length===0;i++)await Promise.resolve();
 assert.equal(h.readMarks.length,1);
 assert.equal(h.readMarks[0].payload.p_message_id,'m1');
 assert.equal(h.requests.length,1);
 h.requests.shift().resolve({data:[
   {sender_id:B,receiver_id:A,body:'received refreshed',first_read_at:'now'},
   {sender_id:C,receiver_id:A,body:'unrelated refreshed'}
 ],error:null});
 await pending;
 assert.match(h.root.innerHTML,/received refreshed/);
 assert.doesNotMatch(h.root.innerHTML,/unrelated refreshed/);
});

test('two taps while DM send is pending create exactly one write',async()=>{
 const h=harness(),pending=h.openDm(B);
 h.requests.shift().resolve({data:[],error:null});await pending;
 const form=h.ctx.currentForm;
 const e={preventDefault(){},currentTarget:form};
 const first=form.onsubmit(e),second=form.onsubmit(e);
 assert.equal(h.writes.length,1);
 assert.equal(form.button.disabled,true);
 assert.equal(form.dataset.kfSending,'1');
 assert.equal(h.writes[0].payload.sender_id,A);
 assert.equal(h.writes[0].payload.receiver_id,B);
 assert.equal(h.writes[0].payload.disappear_after_read,true);
 h.writes.shift().resolve({error:{message:'synthetic storage failure'}});
 await Promise.all([first,second]);
 assert.equal(form.button.disabled,false);
 assert.equal(form.dataset.kfSending,undefined);
 assert.equal(h.toasts.length,1);
});

test('old DM send cannot refresh or show a result after same-user relogin',async()=>{
 const h=harness(),pending=h.openDm(B);
 h.requests.shift().resolve({data:[],error:null});await pending;
 const form=h.ctx.currentForm;
 const sent=form.onsubmit({preventDefault(){},currentTarget:form});
 assert.equal(h.writes.length,1);
 h.switchSameAccount();
 h.writes.shift().resolve({error:null});
 await sent;
 assert.equal(h.requests.length,0);
 assert.equal(h.toasts.length,0);
});

test('successful DM send refreshes only the current conversation',async()=>{
 const h=harness(),pending=h.openDm(B);
 h.requests.shift().resolve({data:[],error:null});await pending;
 const form=h.ctx.currentForm;
 const sent=form.onsubmit({preventDefault(){},currentTarget:form});
 h.writes.shift().resolve({error:null});
 for(let i=0;i<8&&h.requests.length===0;i++)await Promise.resolve();
 assert.equal(h.requests.length,1);
 h.requests.shift().resolve({data:[{sender_id:A,receiver_id:B,body:'hello'}],error:null});
 await sent;
 assert.match(h.root.innerHTML,/hello/);
 assert.equal(h.toasts.length,0);
});
