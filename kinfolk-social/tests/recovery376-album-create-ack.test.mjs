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
    error=null,throwAfterCommit=false,switchAfterCommit=false}=options;
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
  const calls=[],notices=[];
  const document={getElementById:id=>id==='albumForm'?form:null,contains:el=>el===button};
  const sb={from:table=>{
    assert.equal(table,'photo_albums');
    return {insert:(row,opts)=>{
      calls.push({type:'insert',row,requestedCount:opts?.count});
      return {select:()=>({single:async()=>{
        if(switchAfterCommit)state.user.id='synthetic-B';
        if(throwAfterCommit)throw new Error('synthetic response lost after commit');
        return {error,count,data:{id,owner_id:owner}};
      }})};
    }};
  }};
  const requireAlbumSession=(account,editor)=>{
    if(state.user?.id!==account||editor!==form||!editor.isConnected)
      throw new Error('Account or album editor changed during upload.');
  };
  const create=vm.runInNewContext('let busy=false;'+handler+';hardCreate',{
    state,document,sb,requireAlbumSession,validate:()=>{},
    addOne:async()=>{calls.push({type:'photo-upload'})},
    closeModal:()=>calls.push({type:'close'}),
    renderApp:async()=>calls.push({type:'render'}),
    tell:(message,kind)=>notices.push({message,kind}),
    console:{warn:()=>{}}
  },{timeout:2000});
  return {run:()=>create({preventDefault(){}}),calls,notices,state,button};
}
const byType=(h,type)=>h.calls.filter(x=>x.type===type);
const failed=h=>{assert.equal(byType(h,'photo-upload').length,0);assert.equal(byType(h,'close').length,0);assert.equal(byType(h,'render').length,0);assert.equal(h.button.disabled,false)};

test('confirmed one-row owned album proceeds to photo upload and success',async()=>{
  const h=harness();
  await h.run();
  assert.equal(byType(h,'insert')[0].requestedCount,'exact');
  assert.equal(byType(h,'insert')[0].row.owner_id,'synthetic-A');
  assert.equal(byType(h,'photo-upload').length,1);
  assert.equal(byType(h,'render').length,1);
  assert.equal(h.notices.at(-1).message,'Album created');
  assert.equal(h.state.profileTab,'photos');
  assert.equal(h.button.disabled,false);
});
test('zero affected rows never starts photo upload',async()=>{
  const h=harness({count:0});await h.run();failed(h);
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
});
test('account switch after insert prevents photo upload or stale success',async()=>{
  const h=harness({switchAfterCommit:true});await h.run();
  assert.equal(byType(h,'photo-upload').length,0);
  assert.equal(byType(h,'render').length,0);
  assert.equal(h.notices.length,0);
});
