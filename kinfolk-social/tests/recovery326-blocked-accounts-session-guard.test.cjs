'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'..','kinfolk-phase76.js'),'utf8');
const start=source.indexOf('// Recovery326: keep blocked-account reads');
const end=source.indexOf('// Recovery325: bind password changes',start);
assert.ok(start>=0&&end>start,'active blocked-account handlers exist');
const handler=source.slice(start,end);
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
function deferred(){let resolve;const promise=new Promise(res=>resolve=res);return {promise,resolve};}
function harness(){
  const blockReads=[],profileReads=[],deletes=[],toasts=[];
  let screen=null;
  const ctx={
    state:{user:{id:A}},kf129Epoch:1,
    H:value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'),
    toast:(...args)=>toasts.push(args),
    sub:(title,html)=>{
      if(screen)screen.isConnected=false;
      const list={innerHTML:'Loading…',textContent:'',handlers:{},addEventListener(type,fn){this.handlers[type]=fn;},contains:()=>true};
      screen={title,html,list,isConnected:true,querySelector:selector=>selector==='#kfsBlockedList'?list:null};
      return screen;
    },
    document:{getElementById:id=>id==='kfsSubScreen'?screen:null},
    sb:{from:table=>({
      select:columns=>({
        eq:(field,owner)=>{const gate=deferred();blockReads.push({table,columns,field,owner,...gate});return gate.promise;},
        in:(field,ids)=>{const gate=deferred();profileReads.push({table,columns,field,ids,...gate});return gate.promise;}
      }),
      delete:()=>({eq:(field,owner)=>({eq:(blockedField,id)=>{const gate=deferred();deletes.push({table,field,owner,blockedField,id,...gate});return gate.promise;}})})
    })}
  };
  ctx.window=ctx;
  vm.runInNewContext(handler,ctx,{timeout:1000});
  async function loaded(){
    const pending=ctx.openBlockedAccounts();
    assert.equal(blockReads.length>0,true);
    blockReads.at(-1).resolve({data:[{blocked_id:B}],error:null});
    await new Promise(setImmediate);
    assert.equal(profileReads.length>0,true);
    profileReads.at(-1).resolve({data:[{id:B,username:'testuser',display_name:'Synthetic',avatar_url:''}],error:null});
    await pending;
    return screen;
  }
  return {ctx,blockReads,profileReads,deletes,toasts,loaded,get screen(){return screen;}};
}
test('signed-out member cannot read or unblock accounts',async()=>{
  const h=harness();h.ctx.state.user=null;
  await h.ctx.openBlockedAccounts();await h.ctx.unblockKinfolk(B);
  assert.equal(h.blockReads.length,0);assert.equal(h.deletes.length,0);
  assert.match(h.toasts[0][0],/Sign in/);
});
test('blocked list is pinned to opening account and renders data-bound buttons',async()=>{
  const h=harness(),screen=await h.loaded();
  assert.equal(h.blockReads[0].owner,A);
  assert.deepEqual(Array.from(h.profileReads[0].ids),[B]);
  assert.match(screen.list.innerHTML,/data-blocked-id=/);
  assert.doesNotMatch(screen.list.innerHTML,/onclick=/);
});
test('account switch during block query cannot load profiles or paint new account screen',async()=>{
  const h=harness(),pending=h.ctx.openBlockedAccounts(),old=h.screen;
  h.ctx.state.user={id:B};
  h.blockReads[0].resolve({data:[{blocked_id:B}],error:null});
  await pending;
  assert.equal(h.profileReads.length,0);
  assert.equal(old.list.innerHTML,'Loading…');
});
test('replaced screen ignores delayed profile lookup',async()=>{
  const h=harness(),pending=h.ctx.openBlockedAccounts(),old=h.screen;
  h.blockReads[0].resolve({data:[{blocked_id:B}],error:null});
  await new Promise(setImmediate);
  const newer=h.ctx.openBlockedAccounts();
  h.profileReads[0].resolve({data:[{id:B,username:'stale'}],error:null});
  await pending;
  assert.equal(old.list.innerHTML,'Loading…');
  h.blockReads[1].resolve({data:[],error:null});await newer;
  assert.match(h.screen.list.innerHTML,/no blocked accounts/);
});
test('unlisted id and same-user reactivation cannot issue delete',async()=>{
  const h=harness();await h.loaded();
  await h.ctx.unblockKinfolk(A);
  h.ctx.kf129Epoch++;
  await h.ctx.unblockKinfolk(B);
  assert.equal(h.deletes.length,0);
});
test('duplicate unblocks use pinned owner and only one write',async()=>{
  const h=harness(),screen=await h.loaded(),button={disabled:false};
  const pending=h.ctx.unblockKinfolk(B,undefined,button);
  await h.ctx.unblockKinfolk(B,undefined,button);
  assert.equal(h.deletes.length,1);
  assert.equal(h.deletes[0].owner,A);
  assert.equal(h.deletes[0].id,B);
  assert.equal(button.disabled,true);
  h.ctx.state.user={id:B};
  h.deletes[0].resolve({error:null});await pending;
  assert.equal(h.toasts.length,0);
  assert.equal(h.blockReads.length,1,'stale request must not refresh another account');
  assert.equal(screen.isConnected,true);
});
test('successful unblock refreshes list only for the active session',async()=>{
  const h=harness();await h.loaded();
  const pending=h.ctx.unblockKinfolk(B);
  h.deletes[0].resolve({error:null});
  await new Promise(setImmediate);
  assert.equal(h.toasts[0][0],'Account unblocked');
  assert.equal(h.blockReads.length,2);
  h.blockReads[1].resolve({data:[],error:null});await pending;
  assert.match(h.screen.list.innerHTML,/no blocked accounts/);
});
test('failed unblock restores its control without claiming success',async()=>{
  const h=harness();await h.loaded();const button={disabled:false};
  const pending=h.ctx.unblockKinfolk(B,undefined,button);
  h.deletes[0].resolve({error:{message:'Denied by RLS'}});await pending;
  assert.equal(button.disabled,false);
  assert.equal(h.toasts[0][0],'Denied by RLS');
  assert.equal(h.blockReads.length,1);
});
