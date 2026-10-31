'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase106.js','utf8');
const start=source.indexOf('function requireAlbumSession(');
const end=source.indexOf('async function hardCreate(',start);
assert.ok(start>=0&&end>start,'album account guard and upload helper must exist');
const helper=source.slice(start,end);
function harness(behavior){
  const form={id:'albumAddForm',isConnected:true};
  const state={user:{id:'account-A'}},calls=[],warnings=[];
  const document={getElementById:()=>form};
  const sb={
    storage:{from:bucket=>{
      assert.equal(bucket,'kinfolk-media');
      return {
        upload:async path=>{calls.push(['upload',path]);if(behavior==='switch-upload')state.user.id='account-B';return {error:null}},
        remove:async paths=>{calls.push(['remove',...paths]);return {error:null}}
      };
    }},
    from:table=>{
      if(table==='photo_albums')return {
        select:columns=>{
          assert.equal(columns,'id,owner_id');
          return {eq:(column,id)=>{
            assert.equal(column,'id');
            assert.equal(id,'album-1');
            return {maybeSingle:async()=>({error:null,data:{id:'album-1',owner_id:'account-A'}})};
          }};
        }
      };
      assert.equal(table,'album_photos');
      return {insert:async (row,options)=>{
        assert.equal(options?.count,'exact');
        calls.push(['insert',row.owner_id,row.storage_path]);
        if(behavior==='switch-insert')state.user.id='account-B';
        if(behavior==='deny-insert')return {error:new Error('synthetic insert denied'),count:null};
        return {error:null,count:1};
      }};
    }
  };
  const addOne=vm.runInNewContext(helper+'\naddOne',{
    state,document,sb,crypto:{randomUUID:()=> 'synthetic-uuid'},
    safe:name=>name,console:{warn:(...args)=>warnings.push(args)}
  });
  return {addOne,state,form,calls,warnings};
}
const photo={name:'sample.png',type:'image/png'};
test('album upload uses the original account for storage and database owner',async()=>{
  const h=harness('ok');
  const path=await h.addOne('album-1',photo,'account-A',h.form);
  assert.match(path,/^account-A\/albums\/album-1\//);
  assert.equal(h.calls.find(x=>x[0]==='insert')[1],'account-A');
  assert.equal(h.calls.filter(x=>x[0]==='remove').length,0);
});
test('switching accounts during storage upload prevents cross-account photo insert',async()=>{
  const h=harness('switch-upload');
  await assert.rejects(h.addOne('album-1',photo,'account-A',h.form),/Account or album editor changed/);
  assert.equal(h.calls.filter(x=>x[0]==='insert').length,0);
  assert.equal(h.calls.filter(x=>x[0]==='remove').length,1);
});
test('account switch after committed photo insert does not delete referenced media',async()=>{
  const h=harness('switch-insert');
  await assert.rejects(h.addOne('album-1',photo,'account-A',h.form),/Account or album editor changed/);
  assert.equal(h.calls.filter(x=>x[0]==='insert').length,1);
  assert.equal(h.calls.filter(x=>x[0]==='remove').length,0);
});
test('rejected photo database insert removes uncommitted uploaded media',async()=>{
  const h=harness('deny-insert');
  await assert.rejects(h.addOne('album-1',photo,'account-A',h.form),/synthetic insert denied/);
  assert.equal(h.calls.filter(x=>x[0]==='remove').length,1);
});
test('album form checks original account and foreground-only polling',()=>{
  assert.match(source,/const accountId=state\?\.user\?\.id/);
  assert.match(source,/await addOne\(q\.data\.id,files\[i\],accountId,f\)/);
  assert.match(source,/await addOne\(id,files\[i\],accountId,f\)/);
  const match=source.match(/setInterval\(\(\)=>\{if\(document\.visibilityState!=='hidden'\)enforce\(\)\},2000\)/);
  assert.ok(match,'fallback binding must pause when hidden and run every two seconds');
});
