import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Execute the effective Phase115 deletion handler, not a rewritten mock.
const source=readFileSync(new URL('../kinfolk-phase115.js',import.meta.url),'utf8');
const start=source.indexOf("const BUCKETS=");
const end=source.indexOf("function mount(){",start);
assert.ok(start>0&&end>start,'Phase115 account deletion source is present');
assert.match(source,/Recovery347: account deletion must never continue/);
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}}
async function flush(){for(let i=0;i<16;i++)await Promise.resolve()}
function harness(){
  const calls={auth:0,rpc:[],lists:[],removes:[],signOut:0,redirects:[]};
  const overlay={dataset:{kf115Owner:'account-a',kf115Epoch:'1'},isConnected:true,remove(){this.isConnected=false}};
  const button={disabled:false},status={textContent:''},app={style:{pointerEvents:'',visibility:''}};
  const elements={'kf115-confirm':button,'kf115-delete-overlay':overlay,'kf115-status':status,app};
  const ctx={
    state:{user:{id:'account-a'}},kf129Epoch:1,
    document:{getElementById:id=>elements[id]||null,body:{style:{}}},
    location:{origin:'https://localhost',replace:url=>calls.redirects.push(url)},
    setTimeout:fn=>{fn();return 1},
    window:{},
    sb:{
      auth:{
        async getSession(){
          calls.auth++;
          if(ctx.authGate)return ctx.authGate.promise;
          return {data:{session:{user:{id:'account-a'},access_token:ctx.token,refresh_token:ctx.refreshToken}},error:null};
        },
        async signOut(){calls.signOut++;return {error:null}}
      },
      rpc(name,args){
        calls.rpc.push(args.p_confirm);
        if(args.p_confirm==='CHECK'&&ctx.checkGate)return ctx.checkGate.promise;
        if(args.p_confirm==='DELETE'&&ctx.deleteGate)return ctx.deleteGate.promise;
        return Promise.resolve({data:args.p_confirm==='CHECK'?{ready:true}:{deleted:true},error:null});
      },
      storage:{from:bucket=>({
        list(prefix){
          calls.lists.push({bucket,prefix});
          if(ctx.listGate&&bucket==='kinfolk-media')return ctx.listGate.promise;
          if(ctx.mediaPaths?.[bucket])return Promise.resolve({data:ctx.mediaPaths[bucket].map((name,i)=>({name,id:String(i+1)})),error:null});
          return Promise.resolve({data:[],error:null});
        },
        remove(paths){
          calls.removes.push({bucket,paths});
          if(ctx.removeGate)return ctx.removeGate.promise;
          return Promise.resolve({error:null});
        }
      })}
    },
    token:'token-a',refreshToken:'refresh-a',
    authGate:null,checkGate:null,listGate:null,removeGate:null,deleteGate:null,mediaPaths:{}
  };
  vm.createContext(ctx);
  vm.runInContext(source.slice(start,end)+'\nthis.runDeletion=doDelete;this.closeDeletion=closeModal;',ctx,{timeout:1000});
  return {ctx,calls,overlay,button,status,elements,
    switchAccount:(id='account-b')=>{ctx.state.user={id};ctx.kf129Epoch++},
    replaceModal:()=>{const replacement={...overlay,dataset:{...overlay.dataset}};elements['kf115-delete-overlay']=replacement}
  };
}
test('valid same-session deletion checks Auth before CHECK, media, and DELETE',async()=>{
  const h=harness();await h.ctx.runDeletion();
  assert.deepEqual(h.calls.rpc,['CHECK','DELETE']);
  assert.equal(h.calls.lists.length,3);
  assert.ok(h.calls.auth>=8);
  assert.equal(h.calls.signOut,1);
  assert.deepEqual(h.calls.redirects,['https://localhost']);
});
test('an old deletion dialog cannot delete the newly logged-in account',async()=>{
  const h=harness();h.switchAccount();await h.ctx.runDeletion();
  assert.deepEqual(h.calls.rpc,[]);
  assert.equal(h.calls.auth,0);
  assert.match(h.status.textContent,/login changed/i);
});
test('account switch during CHECK stops all media and DELETE calls',async()=>{
  const h=harness();h.ctx.checkGate=deferred();
  const task=h.ctx.runDeletion();await flush();
  assert.deepEqual(h.calls.rpc,['CHECK']);
  h.switchAccount();
  h.ctx.checkGate.resolve({data:{ready:true},error:null});
  await task;
  assert.equal(h.calls.lists.length,0);
  assert.equal(h.calls.signOut,0);
});
test('same-user relogin during CHECK is rejected by session epoch',async()=>{
  const h=harness();h.ctx.checkGate=deferred();
  const task=h.ctx.runDeletion();await flush();
  h.switchAccount('account-a');h.ctx.checkGate.resolve({data:{ready:true},error:null});
  await task;
  assert.deepEqual(h.calls.rpc,['CHECK']);
  assert.equal(h.calls.lists.length,0);
});
test('token refresh during CHECK requires a new deletion confirmation',async()=>{
  const h=harness();h.ctx.checkGate=deferred();
  const task=h.ctx.runDeletion();await flush();
  h.ctx.token='token-refreshed';h.ctx.checkGate.resolve({data:{ready:true},error:null});
  await task;
  assert.deepEqual(h.calls.rpc,['CHECK']);
  assert.match(h.status.textContent,/refreshed/i);
  assert.equal(h.button.disabled,false);
});
test('replaced deletion dialog cannot authorize old asynchronous work',async()=>{
  const h=harness();h.ctx.checkGate=deferred();
  const task=h.ctx.runDeletion();await flush();
  h.replaceModal();h.ctx.checkGate.resolve({data:{ready:true},error:null});
  await task;
  assert.deepEqual(h.calls.rpc,['CHECK']);
  assert.equal(h.calls.lists.length,0);
});
test('account switch during media enumeration prevents any file deletion',async()=>{
  const h=harness();h.ctx.listGate=deferred();
  const task=h.ctx.runDeletion();await flush();
  assert.equal(h.calls.lists.length,1);
  h.switchAccount();
  h.ctx.listGate.resolve({data:[{name:'private.jpg',id:'1'}],error:null});
  await task;
  assert.equal(h.calls.removes.length,0);
  assert.deepEqual(h.calls.rpc,['CHECK']);
});
test('account switch during storage removal prevents further buckets or final DELETE',async()=>{
  const h=harness();h.ctx.mediaPaths={'kinfolk-media':['private.jpg']};h.ctx.removeGate=deferred();
  const task=h.ctx.runDeletion();await flush();
  assert.equal(h.calls.removes.length,1);
  assert.equal(h.calls.removes[0].paths[0],'account-a/private.jpg');
  h.switchAccount();h.ctx.removeGate.resolve({error:null});
  await task;
  assert.deepEqual(h.calls.rpc,['CHECK']);
  assert.equal(h.calls.lists.length,1);
});
test('duplicate Delete taps and modal closing cannot overlap an active request',async()=>{
  const h=harness();h.ctx.checkGate=deferred();
  const first=h.ctx.runDeletion();await flush();
  await h.ctx.runDeletion();h.ctx.closeDeletion();
  assert.deepEqual(h.calls.rpc,['CHECK']);
  assert.equal(h.overlay.isConnected,true);
  h.ctx.checkGate.resolve({data:{ready:true},error:null});await first;
  assert.deepEqual(h.calls.rpc,['CHECK','DELETE']);
});
test('backend CHECK failure does not remove media and permits retry',async()=>{
  const h=harness();h.ctx.checkGate=deferred();
  const task=h.ctx.runDeletion();await flush();
  h.ctx.checkGate.resolve({error:{message:'Synthetic backend denied'},data:null});await task;
  assert.equal(h.button.disabled,false);
  assert.match(h.status.textContent,/Synthetic backend denied/);
  assert.equal(h.calls.removes.length,0);
  assert.deepEqual(h.calls.rpc,['CHECK']);
});
test('account switch during final DELETE never signs out the new account',async()=>{
  const h=harness();h.ctx.deleteGate=deferred();
  const task=h.ctx.runDeletion();await flush();
  assert.deepEqual(h.calls.rpc,['CHECK','DELETE']);
  h.switchAccount();
  h.ctx.deleteGate.resolve({data:{deleted:true},error:null});await task;
  assert.equal(h.calls.signOut,0);
  assert.equal(h.calls.redirects.length,0);
});
test('an Auth user mismatch stops before CHECK and never deletes media',async()=>{
  const h=harness();h.ctx.authGate=deferred();
  const task=h.ctx.runDeletion();await flush();
  h.ctx.authGate.resolve({data:{session:{user:{id:'account-b'},access_token:'other'}},error:null});
  await task;
  assert.deepEqual(h.calls.rpc,[]);
  assert.equal(h.calls.removes.length,0);
  assert.equal(h.button.disabled,false);
});
