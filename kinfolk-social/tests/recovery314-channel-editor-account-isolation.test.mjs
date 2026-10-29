import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('// Recovery314: keep channel creation');
const end=html.indexOf('async function openChannel(id){',start);
assert.ok(start>=0&&end>start,'extract the actual channel editor from Kinfolk');
const source=html.slice(start,end);
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}};
async function waitFor(check){
  for(let i=0;i<60;i++){if(check())return;await new Promise(resolve=>setImmediate(resolve))}
  assert.fail('expected async stage not reached');
}
function harness(options={}){
  const calls={uploads:[],removals:[],writes:[],toasts:[],closed:0,loaded:0,rendered:0};
  const button={disabled:false};
  const fields={
    '#channelTitle':{value:'Synthetic Channel'},
    '#channelSlug':{value:'synthetic_channel'},
    '#channelDesc':{value:'A channel for synthetic test members'},
    '#channelAvatar':{files:options.avatar?[{name:'avatar.png'}]:[]},
    '#channelBanner':{files:[]}
  };
  const form={isConnected:true,dataset:{},querySelector(s){return s.startsWith('button[')?button:fields[s]||null}};
  let currentForm=form;
  const ctx={
    kf129Epoch:1,
    state:{user:{id:A},channels:[{id:'chan-a',owner_id:A},{id:'chan-b',owner_id:B}]},
    document:{getElementById:id=>id==='channelForm'?currentForm:null},
    kfAlphaLoadCurrent:(epoch,uid)=>!!uid&&epoch===ctx.kf129Epoch&&ctx.state.user?.id===uid,
    crypto:{randomUUID:()=> 'synthetic-uuid'},
    safeName:s=>s,
    toast:(...args)=>calls.toasts.push(args),
    closeModal:()=>{calls.closed++;form.isConnected=false;currentForm=null},
    loadChannels:async()=>{calls.loaded++;if(options.failRefresh)throw Error('refresh failed')},
    renderApp:async()=>{calls.rendered++},
    sb:{
      storage:{from(bucket){assert.equal(bucket,'kinfolk-media');return {
        upload(mediaPath,file,opts){calls.uploads.push({mediaPath,file,opts});return options.uploadResponse??{error:null}},
        remove(paths){calls.removals.push(...paths);return {error:null}}
      }}},
      from(table){assert.equal(table,'kinfolk_pages');return {
        insert(row){return makeQuery('insert',row)},
        update(row){return makeQuery('update',row)}
      }}
    }
  };
  function makeQuery(kind,row){
    const record={kind,row,eqs:[]};calls.writes.push(record);
    return {
      eq(field,value){record.eqs.push([field,value]);return this},
      select(columns){assert.equal(columns,'id,owner_id');return this},
      maybeSingle(){return options.writeResponse??{data:{id:kind==='insert'?'chan-created':'chan-a',owner_id:A},error:null}}
    };
  }
  const save=vm.runInNewContext(source+';saveChannel',ctx);
  return {
    ctx,form,fields,button,calls,
    save:(id=null)=>save({preventDefault(){},currentTarget:form},id),
    switchUser:()=>{ctx.kf129Epoch++;ctx.state.user={id:B}},
    newEpoch:()=>{ctx.kf129Epoch++},
    replaceModal:()=>{form.isConnected=false;currentForm={}}
  };
}
test('create channel uses initiating owner and waits for confirmed database row',async()=>{
  const h=harness();
  assert.equal(await h.save(),true);
  assert.equal(h.calls.writes.length,1);
  assert.equal(h.calls.writes[0].kind,'insert');
  assert.equal(h.calls.writes[0].row.owner_id,A);
  assert.equal(h.calls.closed,1);
  assert.equal(h.calls.loaded,1);
  assert.equal(h.calls.rendered,1);
  assert.equal(h.calls.toasts[0][0],'Channel created');
});
test('owned channel edit includes both id and owner filters, never changes owner',async()=>{
  const h=harness();
  assert.equal(await h.save('chan-a'),true);
  const w=h.calls.writes[0];
  assert.equal(w.kind,'update');
  assert.equal(w.row.owner_id,undefined);
  assert.deepEqual(w.eqs,[['id','chan-a'],['owner_id',A]]);
  assert.equal(h.calls.toasts[0][0],'Channel updated');
});
test('forged other-member channel id is rejected before any backend call',async()=>{
  const h=harness();
  assert.equal(await h.save('chan-b'),false);
  assert.equal(h.calls.writes.length,0);
  assert.equal(h.calls.uploads.length,0);
  assert.equal(h.calls.closed,0);
});
test('account switch while avatar uploads blocks metadata writes and stale UI',async()=>{
  const gate=deferred(),h=harness({avatar:true,uploadResponse:gate.promise});
  const task=h.save();
  assert.equal(h.calls.uploads.length,1);
  assert.ok(h.calls.uploads[0].mediaPath.startsWith(A+'/channels/avatar/'));
  h.switchUser();gate.resolve({error:null});await task;
  assert.equal(h.calls.writes.length,0);
  assert.equal(h.calls.closed,0);
  assert.equal(h.calls.toasts.length,0);
});
test('replaced channel modal cannot complete a pending upload',async()=>{
  const gate=deferred(),h=harness({avatar:true,uploadResponse:gate.promise});
  const task=h.save();h.replaceModal();gate.resolve({error:null});await task;
  assert.equal(h.calls.writes.length,0);
  assert.equal(h.calls.toasts.length,0);
});
test('duplicate submits while an upload is pending make one storage request',async()=>{
  const gate=deferred(),h=harness({avatar:true,uploadResponse:gate.promise});
  const task=h.save();await h.save();assert.equal(h.calls.uploads.length,1);
  gate.resolve({error:null});await task;
  assert.equal(h.calls.writes.length,1);
});
test('account switch while database confirmation is pending never closes a new editor',async()=>{
  const gate=deferred(),h=harness({writeResponse:gate.promise});
  const task=h.save();await waitFor(()=>h.calls.writes.length===1);
  h.switchUser();gate.resolve({data:{id:'chan-created',owner_id:A},error:null});await task;
  assert.equal(h.calls.closed,0);
  assert.equal(h.calls.loaded,0);
  assert.equal(h.calls.toasts.length,0);
});
test('zero-row or wrong-owner confirmation never reports channel creation success',async()=>{
  for(const data of [null,{id:'chan-created',owner_id:B}]){
    const h=harness({writeResponse:{data,error:null}});
    assert.equal(await h.save(),false);
    assert.equal(h.calls.closed,0);
    assert.equal(h.calls.loaded,0);
    assert.ok(h.calls.toasts.some(t=>/not confirmed/.test(t[0])));
  }
});
test('failed refresh after confirmed write preserves uploaded media',async()=>{
  const h=harness({avatar:true,failRefresh:true});
  assert.equal(await h.save(),false);
  assert.equal(h.calls.writes.length,1);
  assert.equal(h.calls.removals.length,0);
  assert.ok(h.calls.toasts.some(t=>/saved, but/.test(t[0])));
});
test('failed database write cleans up uploaded media for current account',async()=>{
  const h=harness({avatar:true,writeResponse:{data:null,error:{message:'RLS denied'}}});
  assert.equal(await h.save(),false);
  assert.equal(h.calls.removals.length,1);
  assert.equal(h.calls.closed,0);
});
