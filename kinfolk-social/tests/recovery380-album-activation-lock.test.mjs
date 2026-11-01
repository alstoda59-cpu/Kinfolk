import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Execute the actual Phase106 Create Album / Add Photos handlers with synthetic
// sessions and deferred responses. No live Supabase users or storage writes.
const source=readFileSync(new URL('../kinfolk-phase106.js',import.meta.url),'utf8');
const createStart=source.indexOf('async function hardCreate(');
const addStart=source.indexOf('async function hardAddSubmit(',createStart);
const viewStart=source.indexOf('let albumViewRequest=0;',addStart);
assert.ok(createStart>=0&&addStart>createStart&&viewStart>addStart);
const handlers=source.slice(createStart,viewStart);

function deferred(){
  let resolve;
  const promise=new Promise(r=>{resolve=r});
  return {promise,resolve};
}
function harness(mode){
  const creating=mode==='create';
  const id=creating?'albumForm':'albumAddForm';
  const button={disabled:false,textContent:creating?'Create album':'Upload photos'};
  const fields={
    '#albumTitle':{value:'Synthetic album'},
    '#albumDesc':{value:'Synthetic description'},
    '#albumVisibility':{value:'private'},
    '#albumFiles':{files:[]},
    '#albumAddFiles':{files:[{name:'synthetic.png',type:'image/png',size:4}]},
    '#albumProgress':{textContent:''},
    '#albumAddProgress':{textContent:''}
  };
  const form={id,isConnected:true,querySelector:key=>key==='button'?button:fields[key]};
  const gates=[],calls=[],state={user:{id:'synthetic-A'},profileTab:'home'};
  let ctx;
  ctx={
    state,kf129Epoch:1,
    document:{getElementById:key=>key===id?form:null,contains:node=>node===button},
    requireAlbumSession:(account,editor,epoch)=>{
      if(account!==state.user.id||editor!==form||epoch!==ctx.kf129Epoch)
        throw Error('Account or album editor changed during upload.');
    },
    sb:{from:table=>{
      assert.equal(table,'photo_albums');
      return {insert:()=>({select:()=>({single:()=>{
        const d=deferred();gates.push(d);calls.push('insert');return d.promise;
      }})})};
    }},
    validate:()=>{},
    addOne:async()=>{
      const d=deferred();gates.push(d);calls.push('upload');await d.promise;
    },
    closeModal:()=>calls.push('close'),
    renderApp:async()=>calls.push('render'),
    window:{viewAlbum:async()=>calls.push('view')},
    tell:()=>calls.push('toast'),
    console:{warn:()=>{}}
  };
  const run=vm.runInNewContext('let busy=false;'+handlers+';'+
    (creating?'hardCreate':'hardAddSubmit'),ctx,{timeout:2000});
  return {
    ctx,gates,calls,button,
    submit:()=>creating?run({preventDefault(){}}):run('synthetic-album',{preventDefault(){}}),
    resolve:index=>gates[index].resolve(creating
      ?{count:1,error:null,data:{id:'synthetic-album',owner_id:'synthetic-A'}}
      :undefined)
  };
}

test('Create Album stays one-shot across reactivation while INSERT response is pending',async()=>{
  const h=harness('create');
  const old=h.submit();
  assert.equal(h.gates.length,1);
  await h.submit(); // same activation cannot send another INSERT
  h.ctx.kf129Epoch++;
  await h.submit(); // a fresh activation still cannot replay an uncertain INSERT
  assert.equal(h.gates.length,1);
  h.resolve(0);
  await old; // stale response cannot hydrate the new activation
  assert.equal(h.button.disabled,true);
  await h.submit();
  assert.equal(h.gates.length,1,'original editor must never duplicate an uncertain album');
  assert.equal(h.calls.at(-1),'toast');
});

for(const mode of ['add']){
  test(mode+' permits a fresh auth activation while the old album request is pending',async()=>{
    const h=harness(mode);
    const old=h.submit();
    assert.equal(h.gates.length,1);
    await h.submit(); // same-activation duplicate is ignored
    assert.equal(h.gates.length,1);
    h.ctx.kf129Epoch++;
    const fresh=h.submit();
    assert.equal(h.gates.length,2,'new activation must not inherit an old busy lock');

    h.resolve(0);
    await old;
    await h.submit(); // old finally must not clear the fresh activation's lock
    assert.equal(h.gates.length,2,'stale finally must not permit duplicate writes');
    assert.equal(h.button.disabled,true,'fresh operation remains pending');

    h.resolve(1);
    await fresh;
    assert.equal(h.button.disabled,mode==='add',
      'completed Add Photos editor stays locked; Create Album closes normally');
    const next=h.submit();
    // Both forms are deliberately left mounted by this synthetic fixture.
    // Neither may replay a confirmed album or photo upload after completion.
    assert.equal(h.gates.length,2,'committed album/photo form cannot repeat writes');
    assert.equal(h.calls.at(-1),'toast');
    await next;
  });
}
