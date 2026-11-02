import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Recovery346 exercises the effective inline override, not the obsolete earlier addComment.
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('// Recovery346: comment and reply UI belongs');
const end=html.indexOf('  // Recovery418: keep media comment loads',start);
assert.ok(start>=0&&end>start,'effective Recovery346 comment handler exists');
const source=html.slice(start,end);
const A='account-a',B='account-b',P='post-one';
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {resolve,promise}}
function harness(){
 const writes=[],toasts=[],opened=[];
 const input={value:'  hello Kinfolk  ',placeholder:'Write a comment…',focus(){}};
 const button={disabled:false};
 let label=null,activeForm,loads=0,renders=0,refreshGate=null;
 const form={
   dataset:{},isConnected:true,
   elements:{namedItem:name=>name==='body'?input:null},
   querySelector:sel=>{
     if(sel==='[name=body]')return input;
     if(sel==='.replyingTo')return label;
     if(sel.startsWith('button'))return button;
     return null;
   },
   prepend:el=>{label=el}
 };
 activeForm=form;
 const state={user:{id:A},view:'home',profiles:new Map()};
 const ctx={
   state,kf129Epoch:1,window:null,
   kfAlphaLoadCurrent:(epoch,uid)=>epoch===ctx.kf129Epoch&&state.user?.id===uid,
   document:{
     querySelector:sel=>sel==='#comments-'+P+' .commentForm'?activeForm:null,
     createElement:()=>({
       className:'',innerHTML:'',
       cancel:{onclick:null},
       querySelector(sel){return sel==='button'?this.cancel:null},
       remove(){label=null}
     }),
     getElementById:id=>id==='comments-'+P?{classList:{remove:name=>opened.push(name)}}:null
   },
   toast:(...args)=>toasts.push(args),
   sb:{from:table=>{
     assert.equal(table,'comments');
     return {insert:(payload,options)=>({select:columns=>{
       const d=deferred();writes.push({...d,payload,options,columns});
       return d.promise.then(response=>{
         if(response?.raw)return response.value;
         if(response?.error)return response;
         return {error:null,count:1,data:[{id:'synthetic-comment-row',...payload}]};
       });
     }})};
   }},
   loadFeed:async()=>{loads++;if(refreshGate)await refreshGate.promise},
   renderApp:async()=>{renders++}
 };
 ctx.window=ctx;
 vm.createContext(ctx);
 vm.runInContext(source+'\nthis.handlers={addComment:window.addComment,setPostReply:window.setPostReply};',ctx,{timeout:1000});
 return {
   ctx,state,form,input,button,writes,toasts,opened,
   get loads(){return loads},get renders(){return renders},get label(){return label},
   send:()=>ctx.handlers.addComment({preventDefault(){},currentTarget:form},P),
   reply:id=>ctx.handlers.setPostReply(P,id),
   switchAccount:(uid=B)=>{state.user={id:uid};ctx.kf129Epoch++},
   replaceForm:()=>{activeForm={isConnected:true,dataset:{}}},
   navigate:()=>{state.view='reels'},
   holdRefresh:()=>{refreshGate=deferred();return refreshGate}
 };
}

test('effective comment handler locks duplicate taps, pins sender and refreshes only current post',async()=>{
 const h=harness(),first=h.send(),duplicate=h.send();
 assert.equal(h.writes.length,1);
 assert.equal(h.writes[0].payload.post_id,P);
 assert.equal(h.writes[0].payload.author_id,A);
 assert.equal(h.writes[0].payload.body,'hello Kinfolk');
 assert.equal(h.writes[0].payload.parent_id,null);
 assert.equal(h.button.disabled,true);
 h.writes.shift().resolve({error:null});
 await Promise.all([first,duplicate]);
 assert.equal(h.loads,1);assert.equal(h.renders,1);
 assert.deepEqual(h.opened,['hide']);
 assert.equal(h.button.disabled,false);
 assert.equal(h.form.dataset.kfCommentSending,undefined);
});

test('uncertain backend error locks original comment to prevent duplicate retry',async()=>{
 const h=harness(),first=h.send();
 h.writes.shift().resolve({error:{message:'synthetic lost acknowledgment'}});
 await first;
 assert.match(h.toasts[0][0],/status is uncertain/);
 assert.equal(h.loads,0);assert.equal(h.button.disabled,true);
 await h.send();
 assert.equal(h.writes.length,0);
 assert.equal(h.form.dataset.kfCommentSending,'1');
});

test('logout/account switch during pending write cannot render or expose stale response',async()=>{
 const h=harness(),pending=h.send();
 assert.equal(h.writes[0].payload.author_id,A);
 h.switchAccount(B);
 h.writes.shift().resolve({error:null});await pending;
 assert.equal(h.loads,0);assert.equal(h.renders,0);
 assert.equal(h.opened.length,0);assert.equal(h.toasts.length,0);
});

test('same-user relogin epoch invalidates delayed comment completion',async()=>{
 const h=harness(),pending=h.send();
 h.switchAccount(A);h.writes.shift().resolve({error:null});await pending;
 assert.equal(h.loads,0);assert.equal(h.renders,0);
});

test('replaced post comment form cannot be reopened by delayed send',async()=>{
 const h=harness(),pending=h.send();
 h.replaceForm();h.writes.shift().resolve({error:null});await pending;
 assert.equal(h.loads,0);assert.equal(h.opened.length,0);
});

test('navigation away from Home suppresses delayed comment refresh',async()=>{
 const h=harness(),pending=h.send();
 h.navigate();h.writes.shift().resolve({error:null});await pending;
 assert.equal(h.loads,0);assert.equal(h.renders,0);
});

test('account switch during feed refresh suppresses stale render',async()=>{
 const h=harness(),gate=h.holdRefresh(),pending=h.send();
 h.writes.shift().resolve({error:null});
 for(let i=0;i<10&&h.loads===0;i++)await Promise.resolve();
 assert.equal(h.loads,1);
 h.switchAccount(B);gate.resolve();await pending;
 assert.equal(h.renders,0);assert.equal(h.opened.length,0);
});

test('reply is attached only to same account, epoch and comment form',async()=>{
 const h=harness();h.reply('reply-parent');
 const first=h.send();
 assert.equal(h.writes[0].payload.parent_id,'reply-parent');
 h.writes.shift().resolve({error:null});await first;
 h.input.value='another comment';
 const second=h.send();
 assert.equal(h.writes[0].payload.parent_id,null);
 h.writes.shift().resolve({error:null});await second;
});

test('stale reply parent is not reused after same-user relogin',async()=>{
 const h=harness();h.reply('old-parent');
 h.switchAccount(A);
 const pending=h.send();
 assert.equal(h.writes[0].payload.parent_id,null);
 h.writes.shift().resolve({error:null});await pending;
});

test('Cancel reply clears the pending parent for current form',async()=>{
 const h=harness();h.reply('cancel-parent');
 assert.ok(h.label);h.label.cancel.onclick();
 const pending=h.send();
 assert.equal(h.writes[0].payload.parent_id,null);
 h.writes.shift().resolve({error:null});await pending;
});

test('blank comment never writes or disables form',async()=>{
 const h=harness();h.input.value='   ';
 await h.send();assert.equal(h.writes.length,0);
 assert.equal(h.button.disabled,false);assert.equal(h.loads,0);
});

test('Recovery417 requires exact count and selected identity fields',async()=>{
 const h=harness(),pending=h.send();
 assert.equal(h.writes[0].options.count,'exact');
 assert.match(h.writes[0].columns,/parent_id/);
 h.writes.shift().resolve({error:null});await pending;
 assert.equal(h.input.value,'');
 assert.equal(h.loads,1);
});

test('confirmed zero-row comment insert is safely retryable without clearing text',async()=>{
 const h=harness(),pending=h.send();
 h.writes.shift().resolve({raw:true,value:{count:0,data:[],error:null}});await pending;
 assert.equal(h.button.disabled,false);
 assert.equal(h.form.dataset.kfCommentSending,undefined);
 assert.equal(h.input.value,'  hello Kinfolk  ');
 assert.equal(h.loads,0);
 const retry=h.send();assert.equal(h.writes.length,1);
 h.writes.shift().resolve({error:null});await retry;
 assert.equal(h.loads,1);
});

test('missing count and row acknowledgment keeps the comment locked',async()=>{
 const h=harness(),pending=h.send();
 h.writes.shift().resolve({raw:true,value:{error:null,data:[{id:'row'}]}});await pending;
 assert.equal(h.button.disabled,true);
 assert.equal(h.loads,0);
 assert.match(h.toasts[0][0],/status is uncertain/);
});

test('multi-row acknowledgment is rejected as uncertain',async()=>{
 const h=harness(),pending=h.send();
 h.writes.shift().resolve({raw:true,value:{error:null,count:2,data:[{id:'a'},{id:'b'}]}});await pending;
 assert.equal(h.button.disabled,true);
 assert.equal(h.loads,0);
});

test('mismatched author, post, or parent cannot confirm comment creation',async()=>{
 for(const changed of [
   {author_id:'other-account'},
   {post_id:'another-post'},
   {parent_id:'foreign-parent'},
   {body:'different body'}
 ]){
   const h=harness(),pending=h.send();
   h.writes.shift().resolve({raw:true,value:{
     error:null,count:1,data:[{id:'comment-one',post_id:P,author_id:A,parent_id:null,body:'hello Kinfolk',...changed}]
   }});
   await pending;
   assert.equal(h.button.disabled,true);
   assert.equal(h.loads,0);
 }
});

test('backend throw keeps comment locked when commit outcome is unknown',async()=>{
 const h=harness(),pending=h.send();
 h.writes.shift().resolve({raw:true,value:Promise.reject(Error('connection lost'))});
 await pending;
 assert.equal(h.button.disabled,true);
 assert.equal(h.loads,0);
});

test('isolated alpha migration enforces same-post threaded replies and visible parent',()=>{
 const sql=readFileSync(new URL('../migrations/ALPHA_only_threaded_comment_integrity.sql',import.meta.url),'utf8');
 assert.match(sql,/add column if not exists parent_id uuid/i);
 assert.match(sql,/foreign key\(parent_id, post_id\)/i);
 assert.match(sql,/references public\.comments\(id, post_id\)/i);
 assert.match(sql,/security definer set search_path = ''/i);
 assert.match(sql,/kinfolk_alpha_private\.visible_comment_parent\(comments\.parent_id,comments\.post_id\)/i);
 assert.match(sql,/c\.id=p_parent and c\.post_id=p_post/i);
 assert.match(sql,/kinfolk_alpha_private\.not_blocked\(c\.author_id\)/i);
 assert.match(sql,/never apply to shared live/i);
});
