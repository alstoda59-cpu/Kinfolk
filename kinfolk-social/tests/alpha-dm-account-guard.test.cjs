'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const begin=html.indexOf('let kfAlphaDmOpenEpoch=0;window.openDm=async function(peer){');
const end=html.indexOf('};})();',begin);
assert.ok(begin>=0&&end>begin,'Active DM override exists');
const install=new Function('window','state','kfAlphaCanDm','toast','sb','modal','$','esc','document','kf129Epoch','kf300MessageRequest',html.slice(begin,end+2));
const uid='11111111-1111-4111-8111-111111111111';
const peer='22222222-2222-4222-8222-222222222222';
const other='33333333-3333-4333-8333-333333333333';

function harness(options={}){
 const state={user:{id:uid},friendRequests:[{sender_id:uid,receiver_id:peer,status:'accepted'}],profiles:new Map([[peer,{display_name:'Synthetic Friend'}]])};
 const calls={queries:0,modals:0,inserts:[],toasts:[],marks:0};
 let currentForm;
 const canDm=id=>!!state.user&&state.friendRequests.some(r=>r.status==='accepted'&&((r.sender_id===state.user.id&&r.receiver_id===id)||(r.receiver_id===state.user.id&&r.sender_id===id)));
 const sb={
  from(table){
   if(table==='messages'){
    const query={select(){return query},or(){return query},order(){return query},limit(){calls.queries++;return options.query?options.query(calls.queries):Promise.resolve({data:[],error:null})},insert(row){calls.inserts.push(row);return Promise.resolve({error:null})}};
    return query;
   }
   if(table==='kinfolk_user_preferences'){
    const query={select(){return query},eq(){return query},maybeSingle(){return Promise.resolve({data:{disappearing_messages_default:false},error:null})}};
    return query;
   }
   throw new Error('Unexpected table: '+table);
  },
  rpc(){calls.marks++;return Promise.resolve({data:null,error:null})}
 };
 const window={};
 const modal=()=>{calls.modals++;currentForm={dataset:{peer},elements:{namedItem(name){return name==='body'?{value:'Synthetic message'}:{checked:true}}},querySelector(){return {disabled:false}}}};
 const document={getElementById(){return currentForm}};
 install(window,state,canDm,(...args)=>calls.toasts.push(args),sb,modal,()=>currentForm,value=>value,document,1,1);
 return {window,state,calls,getForm:()=>currentForm,setForm:value=>{currentForm=value}};
}
function submit(form){return form.onsubmit({preventDefault(){},currentTarget:form})}

test('invalid peer cannot enter PostgREST conversation filter',async()=>{
 const h=harness();
 await h.window.openDm('x'.repeat(36));
 assert.equal(h.calls.queries,0);
 assert.equal(h.calls.toasts.length,1);
});
test('account switch during message query cannot open previous account conversation',async()=>{
 let resolve;
 const waiting=new Promise(r=>{resolve=r});
 const h=harness({query:()=>waiting});
 const pending=h.window.openDm(peer);
 h.state.user={id:other};
 resolve({data:[],error:null});
 await pending;
 assert.equal(h.calls.modals,0);
});
test('account switch after opening DM prevents send',async()=>{
 const h=harness();
 await h.window.openDm(peer);
 const form=h.getForm();
 h.state.user={id:other};
 await submit(form);
 assert.equal(h.calls.inserts.length,0);
});
test('friendship revoked after opening DM prevents send',async()=>{
 const h=harness();
 await h.window.openDm(peer);
 const form=h.getForm();
 h.state.friendRequests=[];
 await submit(form);
 assert.equal(h.calls.inserts.length,0);
});
test('replaced conversation form cannot send stale message',async()=>{
 const h=harness();
 await h.window.openDm(peer);
 const form=h.getForm();
 h.setForm({dataset:{peer},elements:form.elements});
 await submit(form);
 assert.equal(h.calls.inserts.length,0);
});
test('valid friend message uses original viewer identity and refreshes conversation',async()=>{
 const h=harness();
 await h.window.openDm(peer);
 await submit(h.getForm());
 assert.equal(h.calls.inserts.length,1);
 assert.equal(h.calls.inserts[0].sender_id,uid);
 assert.equal(h.calls.inserts[0].receiver_id,peer);
 assert.equal(h.calls.modals,2);
});
test('a later DM open supersedes the first pending response',async()=>{
 let resolve;
 const waiting=new Promise(r=>{resolve=r});
 const h=harness({query:n=>n===1?waiting:Promise.resolve({data:[],error:null})});
 const first=h.window.openDm(peer);
 await h.window.openDm(peer);
 resolve({data:[],error:null});
 await first;
 assert.equal(h.calls.modals,1);
});
