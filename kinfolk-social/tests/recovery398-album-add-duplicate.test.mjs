import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Source-execute the effective Add Photos handler with synthetic sessions and
// upload results. Never contact live Supabase or use real member accounts.
const source=readFileSync(new URL('../kinfolk-phase106.js',import.meta.url),'utf8');
const start=source.indexOf('async function hardAddSubmit(');
const end=source.indexOf('let albumViewRequest=0;',start);
assert.ok(start>=0&&end>start,'effective Add Photos handler must exist');
const handler=source.slice(start,end);

function harness(options={}){
  const {fileCount=2,failAt=0,viewFailure=false,validationFailure=false,switchAt=0}=options;
  const button={disabled:false,textContent:'Upload photos'};
  const inputs={
    '#albumAddFiles':{files:Array.from({length:fileCount},(_,i)=>({name:'synthetic-'+i+'.png',type:'image/png',size:42}))},
    '#albumAddProgress':{textContent:''}
  };
  const form={id:'albumAddForm',isConnected:true,querySelector:key=>key==='button'?button:inputs[key]};
  const state={user:{id:'synthetic-A'}},calls=[],notices=[];
  let ctx;
  ctx={
    state,kf129Epoch:1,
    document:{getElementById:key=>key==='albumAddForm'?form:null,contains:node=>node===button},
    requireAlbumSession:(id,editor,epoch)=>{
      if(id!==state.user?.id||editor!==form||epoch!==ctx.kf129Epoch)
        throw Error('Account or album editor changed during upload.');
    },
    validate:()=>{if(validationFailure)throw Error('Synthetic validation failure')},
    addOne:async()=>{
      calls.push('upload');
      if(switchAt&&calls.filter(x=>x==='upload').length===switchAt)ctx.kf129Epoch++;
      if(failAt&&calls.filter(x=>x==='upload').length===failAt)
        throw Error('Synthetic response lost after possible commit');
    },
    window:{viewAlbum:async()=>{calls.push('view');if(viewFailure)throw Error('Synthetic viewer failed')}},
    tell:(message,kind)=>notices.push({message,kind}),
    console:{warn:()=>{}}
  };
  const run=vm.runInNewContext('let busy=false;'+handler+';hardAddSubmit',ctx,{timeout:2000});
  return {submit:()=>run('album-1',{preventDefault(){}}),button,calls,notices,ctx,form};
}
const uploads=h=>h.calls.filter(x=>x==='upload').length;

test('second photo failure cannot replay a successfully saved first photo',async()=>{
  const h=harness({failAt:2});
  await h.submit();
  assert.equal(uploads(h),2);
  assert.equal(h.button.disabled,true);
  assert.match(h.button.textContent,/Reopen album/);
  assert.match(h.notices.at(-1).message,/partially completed/);
  await h.submit();
  assert.equal(uploads(h),2);
  assert.match(h.notices.at(-1).message,/may already have been added/);
});

test('lost response for first photo blocks blind repeat on same form',async()=>{
  const h=harness({failAt:1});
  await h.submit();
  await h.submit();
  assert.equal(uploads(h),1);
  assert.equal(h.button.disabled,true);
  assert.match(h.notices.at(-1).message,/Reopen this album/);
});

test('successful uploads followed by failed album viewer do not replay files',async()=>{
  const h=harness({viewFailure:true});
  await h.submit();
  await h.submit();
  assert.equal(uploads(h),2);
  assert.equal(h.calls.filter(x=>x==='view').length,1);
  assert.equal(h.button.disabled,true);
});

test('successful Add Photos cannot be resubmitted from a stale mounted editor',async()=>{
  const h=harness();
  await h.submit();
  assert.equal(h.notices.at(-1).message,'Photos added');
  await h.submit();
  assert.equal(uploads(h),2);
  assert.equal(h.calls.filter(x=>x==='view').length,1);
  assert.equal(h.button.disabled,true);
});

test('pre-upload validation failure remains retryable without a false saved marker',async()=>{
  const h=harness({validationFailure:true});
  await h.submit();
  await h.submit();
  assert.equal(uploads(h),0);
  assert.equal(h.button.disabled,false);
  assert.equal(h.notices.length,2);
  assert.match(h.notices[0].message,/Synthetic validation failure/);
  assert.equal(h.form.__kf106AddOutcome,undefined);
});

test('session change during upload never shows a stale completion or unlocks old editor',async()=>{
  const h=harness({switchAt:1});
  await h.submit();
  assert.equal(uploads(h),1);
  assert.equal(h.notices.length,0);
  assert.equal(h.button.disabled,true);
  assert.equal(h.form.__kf106AddOutcome,undefined);
});
