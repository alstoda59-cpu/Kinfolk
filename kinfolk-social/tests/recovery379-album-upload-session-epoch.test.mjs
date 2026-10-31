import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Source-executed synthetic checks. No live Supabase accounts or storage writes.
const source=readFileSync(new URL('../kinfolk-phase106.js',import.meta.url),'utf8');
const helperStart=source.indexOf('function requireAlbumSession(');
const createStart=source.indexOf('async function hardCreate(',helperStart);
const addStart=source.indexOf('async function hardAddSubmit(',createStart);
const viewerStart=source.indexOf('let albumViewRequest=0;',addStart);
assert.ok(helperStart>=0&&createStart>helperStart&&addStart>createStart&&viewerStart>addStart);
const helper=source.slice(helperStart,createStart);
const addHandler=source.slice(addStart,viewerStart);

function uploadHarness(interruption){
  const form={id:'albumAddForm',isConnected:true};
  const state={user:{id:'synthetic-A'}};
  const calls=[];
  let ctx;
  const interrupt=stage=>{if(interruption===stage)ctx.kf129Epoch++};
  const sb={
    from:table=>{
      if(table==='photo_albums')return {select:()=>({eq:()=>({maybeSingle:async()=>{
        calls.push('lookup');interrupt('lookup');
        return {data:{id:'album-1',owner_id:'synthetic-A'},error:null};
      }})})};
      assert.equal(table,'album_photos');
      return {insert:async()=>{
        calls.push('insert');interrupt('insert');
        return {count:1,error:null};
      }};
    },
    storage:{from:()=>({
      upload:async()=>{calls.push('upload');interrupt('upload');return {error:null}},
      remove:async()=>{calls.push('remove');return {error:null}}
    })}
  };
  ctx={state,kf129Epoch:1,sb,document:{getElementById:()=>form},
    crypto:{randomUUID:()=> 'synthetic-uuid'},safe:name=>name,console:{warn:()=>{}}};
  const addOne=vm.runInNewContext(helper+';addOne',ctx,{timeout:2000});
  return {run:()=>addOne('album-1',{name:'photo.png',type:'image/png'},'synthetic-A',form,1),calls,ctx};
}
test('same-user reactivation during ownership lookup prevents storage writes',async()=>{
  const h=uploadHarness('lookup');
  await assert.rejects(h.run(),/Account or album editor changed/);
  assert.deepEqual(h.calls,['lookup']);
});
test('same-user reactivation after upload cleans unlinked storage before insert',async()=>{
  const h=uploadHarness('upload');
  await assert.rejects(h.run(),/Account or album editor changed/);
  assert.deepEqual(h.calls,['lookup','upload','remove']);
});
test('same-user reactivation after insert never deletes possibly linked storage',async()=>{
  const h=uploadHarness('insert');
  await assert.rejects(h.run(),/Account or album editor changed/);
  assert.deepEqual(h.calls,['lookup','upload','insert']);
});
test('unchanged session can finish a confirmed owned photo insert',async()=>{
  const h=uploadHarness(null);
  assert.match(await h.run(),/^synthetic-A\/albums\/album-1\//);
  assert.deepEqual(h.calls,['lookup','upload','insert']);
});
function addFormHarness(reactivate){
  const button={disabled:false,textContent:'Upload photos'};
  const fields={'#albumAddFiles':{files:[{name:'photo.png',type:'image/png',size:42}]},
    '#albumAddProgress':{textContent:''}};
  const form={id:'albumAddForm',isConnected:true,querySelector:s=>s==='button'?button:fields[s]};
  const state={user:{id:'synthetic-A'}},calls=[];
  let ctx;
  ctx={state,kf129Epoch:1,document:{getElementById:()=>form,contains:()=>true},
    requireAlbumSession:(id,editor,epoch)=>{
      if(id!==state.user.id||editor!==form||epoch!==ctx.kf129Epoch)throw Error('Account or album editor changed during upload.');
    },
    validate:()=>{},
    addOne:async()=>{calls.push('upload');if(reactivate)ctx.kf129Epoch++},
    window:{viewAlbum:async()=>{calls.push('guarded-view')}},
    tell:()=>calls.push('toast')
  };
  const submit=vm.runInNewContext('let busy=false;'+addHandler+';hardAddSubmit',ctx,{timeout:2000});
  return {run:()=>submit('album-1',{preventDefault(){}}),calls,ctx,button};
}
test('Add Photos does not open viewer or toast after same-user session reactivation',async()=>{
  const h=addFormHarness(true);await h.run();
  assert.deepEqual(h.calls,['upload']);
});
test('Add Photos refreshes through the effective guarded viewer on success',async()=>{
  const h=addFormHarness(false);await h.run();
  assert.deepEqual(h.calls,['upload','guarded-view','toast']);
  assert.equal(h.button.disabled,false);
});
