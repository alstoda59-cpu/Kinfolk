import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Execute the effective mobile Create Album handler, not a reimplementation.
// All identities, database results and uploads are synthetic.
const source=readFileSync(new URL('../kinfolk-phase106.js',import.meta.url),'utf8');
const start=source.indexOf('async function hardCreate(');
const end=source.indexOf('async function hardAddSubmit(',start);
assert.ok(start>=0&&end>start,'effective album create handler must exist');
const handler=source.slice(start,end);

function harness(options={}){
  const {owner='synthetic-A',id='synthetic-album',
    error=null,throwAfterCommit=false,switchAfterCommit=false,reactivateAfterCommit=false,
    photoFailure=false,renderFailure=false,validationFailure=false}=options;
  const count=Object.hasOwn(options,'count')?options.count:1;
  const button={disabled:false,textContent:'Create album'};
  const inputs={
    '#albumTitle':{value:'A family album'},
    '#albumDesc':{value:'Photos'},
    '#albumVisibility':{value:'private'},
    '#albumFiles':{files:[{name:'synthetic.png',type:'image/png',size:42}]},
    '#albumProgress':{textContent:''}
  };
  const form={id:'albumForm',isConnected:true,querySelector:s=>s==='button'?button:inputs[s]};
  const state={user:{id:'synthetic-A'},profileTab:'home'};
  const calls=[],notices=[];let ctx;
  const document={getElementById:id=>id==='albumForm'?form:null,contains:el=>el===button};
  const sb={from:table=>{
    assert.equal(table,'photo_albums');
    return {insert:(row,opts)=>{
      calls.push({type:'insert',row,requestedCount:opts?.count});
      return {select:()=>({single:async()=>{
        if(switchAfterCommit)state.user.id='synthetic-B';
        if(reactivateAfterCommit)ctx.kf129Epoch++;
        if(throwAfterCommit)throw new Error('synthetic response lost after commit');
        return {error,count,data:{id,owner_id:owner}};
      }})};
    }};
  }};
  const requireAlbumSession=(account,editor)=>{
    if(state.user?.id!==account||editor!==form||!editor.isConnected)
      throw new Error('Account or album editor changed during upload.');
  };
  ctx={
    state,document,sb,kf129Epoch:1,requireAlbumSession:(account,editor,activation)=>{
      requireAlbumSession(account,editor);
      if(ctx.kf129Epoch!==activation)throw new Error('Account or album editor changed during upload.');
    },validate:()=>{if(validationFailure)throw Error('Synthetic validation failed')},
    addOne:async()=>{calls.push({type:'photo-upload'});if(photoFailure)throw new Error('synthetic photo upload failed')},
    closeModal:()=>calls.push({type:'close'}),
    renderApp:async()=>{calls.push({type:'render'});if(renderFailure)throw new Error('synthetic render failed')},
    tell:(message,kind)=>notices.push({message,kind}),
    console:{warn:()=>{}}
  };
  const create=vm.runInNewContext('let busy=false;'+handler+';hardCreate',ctx,{timeout:2000});
  return {run:()=>create({preventDefault(){}}),calls,notices,state,button,form};
}
const byType=(h,type)=>h.calls.filter(x=>x.type===type);
const failed=(h,locked=true)=>{assert.equal(byType(h,'photo-upload').length,0);assert.equal(byType(h,'close').length,0);assert.equal(byType(h,'render').length,0);assert.equal(h.button.disabled,locked)};

test('confirmed one-row owned album proceeds to photo upload and success',async()=>{
  const h=harness();
  await h.run();
  assert.equal(byType(h,'insert')[0].requestedCount,'exact');
  assert.equal(byType(h,'insert')[0].row.owner_id,'synthetic-A');
  assert.equal(byType(h,'photo-upload').length,1);
  assert.equal(byType(h,'render').length,1);
  assert.equal(h.notices.at(-1).message,'Album created');
  assert.equal(h.state.profileTab,'photos');
  assert.equal(h.button.disabled,true);
});
test('zero affected rows never starts photo upload',async()=>{
  const h=harness({count:0});await h.run();failed(h,false);
  assert.match(h.notices[0].message,/Refresh your albums before retrying/);
});
test('missing count is not mistaken for a saved album',async()=>{
  const h=harness({count:undefined});await h.run();failed(h);
  assert.match(h.notices[0].message,/could not be confirmed/);
});
test('multirow count fails closed',async()=>{
  const h=harness({count:2});await h.run();failed(h);
});
test('foreign-owned returned album cannot receive the member photos',async()=>{
  const h=harness({owner:'synthetic-B'});await h.run();failed(h);
});
test('missing album identifier cannot trigger photo upload',async()=>{
  const h=harness({id:null});await h.run();failed(h);
});
test('PostgREST error after possible commit warns to refresh, not blindly retry',async()=>{
  const h=harness({error:new Error('synthetic response error')});await h.run();failed(h);
  assert.match(h.notices[0].message,/Refresh your albums before retrying/);
});
test('thrown response failure after possible commit never starts uploads',async()=>{
  const h=harness({throwAfterCommit:true});await h.run();failed(h);
  assert.match(h.notices[0].message,/Refresh your albums before retrying/);
});
test('account switch after insert prevents photo upload or stale success',async()=>{
  const h=harness({switchAfterCommit:true});await h.run();
  assert.equal(byType(h,'photo-upload').length,0);
  assert.equal(byType(h,'render').length,0);
  assert.equal(h.notices.length,0);
});

test('same-user session reactivation after album insert prevents stale upload or success',async()=>{
  const h=harness({reactivateAfterCommit:true});await h.run();
  assert.equal(byType(h,'photo-upload').length,0);
  assert.equal(byType(h,'close').length,0);
  assert.equal(byType(h,'render').length,0);
  assert.equal(h.button.disabled,true); // The old session's editor must not be unlocked.
  assert.equal(byType(h,'insert').length,1);
  assert.equal(h.notices.length,0);
});

test('verified album remains created when its first photo upload fails; warn against duplicate creation',async()=>{
  const h=harness({photoFailure:true});
  await h.run();
  assert.equal(byType(h,'insert').length,1);
  assert.equal(byType(h,'photo-upload').length,1);
  assert.equal(byType(h,'close').length,0);
  assert.equal(byType(h,'render').length,0);
  assert.equal(h.button.disabled,true);
  assert.match(h.button.textContent,/Album created/);
  assert.equal(h.notices.length,1);
  assert.match(h.notices[0].message,/Album created/);
  assert.match(h.notices[0].message,/check this album/);
  assert.match(h.notices[0].message,/Do not create it again/);
  assert.doesNotMatch(h.notices[0].message,/synthetic photo upload failed/);
});

test('confirmed album is not mislabeled a failed creation when opening Photos fails',async()=>{
  const h=harness({renderFailure:true});
  await h.run();
  assert.equal(byType(h,'insert').length,1);
  assert.equal(byType(h,'photo-upload').length,1);
  assert.equal(byType(h,'close').length,1);
  assert.equal(byType(h,'render').length,1);
  // This synthetic closeModal only records a call; it leaves the form mounted.
  // The handler must still describe the confirmed album rather than a failed creation.
  assert.equal(h.notices.length,1);
  assert.match(h.notices[0].message,/Album created/);
  assert.match(h.notices[0].message,/Do not create it again/);
});


test('partial photo failure cannot insert the same album twice from the mounted form',async()=>{
  const h=harness({photoFailure:true});
  await h.run();
  await h.run(); // Synthetic second submit, even if another event invokes the handler.
  assert.equal(byType(h,'insert').length,1);
  assert.equal(byType(h,'photo-upload').length,1);
  assert.equal(h.button.disabled,true);
  assert.equal(h.notices.length,2);
  assert.match(h.notices[1].message,/already created/);
  assert.match(h.notices[1].message,/Open Photos/);
});

test('failed Photos render after committed album cannot trigger a duplicate insert',async()=>{
  const h=harness({renderFailure:true});
  await h.run();
  await h.run();
  assert.equal(byType(h,'insert').length,1);
  assert.equal(byType(h,'render').length,1);
  assert.equal(h.button.disabled,true);
  assert.match(h.notices.at(-1).message,/already created/);
});

test('confirmed successful album cannot be reinserted by a stale mounted form',async()=>{
  // closeModal in this synthetic fixture leaves the original form mounted.
  const h=harness();
  await h.run();
  await h.run();
  assert.equal(byType(h,'insert').length,1);
  assert.equal(byType(h,'photo-upload').length,1);
  assert.match(h.notices.at(-1).message,/already created/);
});

// Recovery399: a dropped or ambiguous Create Album response can follow a
// committed INSERT. Reusing the same mounted form must not duplicate it.
test('lost Create Album response locks the exact form against duplicate INSERT',async()=>{
  const h=harness({throwAfterCommit:true});
  await h.run();await h.run();
  assert.equal(byType(h,'insert').length,1);
  assert.equal(h.button.disabled,true);
  assert.match(h.button.textContent,/Check Photos/);
  assert.match(h.notices.at(-1).message,/may already have completed/);
  assert.equal(h.form.__kf106CreateUncertain.accountId,'synthetic-A');
});
test('PostgREST error after potential commit also blocks repeat Create Album',async()=>{
  const h=harness({error:new Error('synthetic response lost')});
  await h.run();await h.run();
  assert.equal(byType(h,'insert').length,1);
  assert.equal(h.button.disabled,true);
});
test('missing affected-row count cannot replay uncertain album creation',async()=>{
  const h=harness({count:undefined});
  await h.run();await h.run();
  assert.equal(byType(h,'insert').length,1);
  assert.equal(h.button.disabled,true);
});
test('authoritative zero-row acknowledgement clears uncertainty and allows retry',async()=>{
  const h=harness({count:0});
  await h.run();await h.run();
  assert.equal(byType(h,'insert').length,2);
  assert.equal(h.button.disabled,false);
  assert.equal(h.form.__kf106CreateUncertain,undefined);
});
test('preflight validation errors do not lock Create Album or dispatch INSERT',async()=>{
  const h=harness({validationFailure:true});
  await h.run();await h.run();
  assert.equal(byType(h,'insert').length,0);
  assert.equal(h.button.disabled,false);
  assert.equal(h.form.__kf106CreateUncertain,undefined);
  assert.match(h.notices.at(-1).message,/Synthetic validation failed/);
});
