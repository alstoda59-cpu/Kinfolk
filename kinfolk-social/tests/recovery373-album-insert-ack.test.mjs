import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Execute the actual Phase106 album upload helper with synthetic PostgREST
// responses. No real accounts, storage writes or Supabase connection.
const source=readFileSync(new URL('../kinfolk-phase106.js',import.meta.url),'utf8');
const start=source.indexOf('function requireAlbumSession(');
const end=source.indexOf('async function hardCreate(',start);
assert.ok(start>=0&&end>start,'effective album upload helper must exist');
const helper=source.slice(start,end);

function harness(options={}){
  const count=Object.prototype.hasOwnProperty.call(options,'count')?options.count:1;
  const {error=null,throwDuringInsert=false,switchAfterInsert=false,albumOwner='synthetic-owner-A',albumId='synthetic-album',missingAlbum=false,albumError=null,switchDuringLookup=false}=options;
  const form={id:'albumAddForm',isConnected:true};
  const state={user:{id:'synthetic-owner-A'}};
  const calls=[];
  const sb={
    storage:{from:bucket=>{
      assert.equal(bucket,'kinfolk-media');
      return {
        upload:async(path,file,options)=>{
          calls.push({type:'upload',path});
          assert.equal(options.upsert,false);
          return {error:null};
        },
        remove:async paths=>{
          calls.push({type:'remove',paths:[...paths]});
          return {error:null};
        }
      };
    }},
    from:table=>{
      if(table==='photo_albums')return {
        select:columns=>{
          assert.equal(columns,'id,owner_id');
          return {eq:(column,id)=>{
            assert.equal(column,'id');
            assert.equal(id,'synthetic-album');
            return {maybeSingle:async()=>{
              calls.push({type:'album-lookup'});
              if(switchDuringLookup)state.user.id='synthetic-owner-B';
              return {error:albumError,data:missingAlbum?null:{id:albumId,owner_id:albumOwner}};
            }};
          }};
        }
      };
      assert.equal(table,'album_photos');
      return {insert:async(row,options)=>{
        calls.push({type:'insert',row,requestedCount:options?.count});
        if(switchAfterInsert)state.user.id='synthetic-owner-B';
        if(throwDuringInsert)throw new Error('synthetic network dropped after insert');
        return {error,count};
      }};
    }
  };
  const addOne=vm.runInNewContext(helper+'\naddOne',{
    state,document:{getElementById:()=>form},sb,
    crypto:{randomUUID:()=> 'synthetic-uuid'},
    safe:name=>name,console:{warn:()=>{}}
  },{timeout:2000});
  const run=()=>addOne('synthetic-album', {name:'synthetic.png',type:'image/png'}, 'synthetic-owner-A',form);
  return {run,calls,state};
}
const byType=(h,type)=>h.calls.filter(call=>call.type===type);

test('one acknowledged album row links media and requests exact count',async()=>{
  const h=harness();
  const path=await h.run();
  assert.match(path,/^synthetic-owner-A\/albums\/synthetic-album\//);
  assert.equal(byType(h,'insert').length,1);
  assert.equal(byType(h,'insert')[0].requestedCount,'exact');
  assert.equal(byType(h,'remove').length,0);
});
test('zero affected rows rejects false success and cleans unlinked upload',async()=>{
  const h=harness({count:0});
  await assert.rejects(h.run(),/Album photo was not saved/);
  assert.equal(byType(h,'remove').length,1);
  assert.equal(byType(h,'remove')[0].paths[0],byType(h,'upload')[0].path);
});
test('missing count fails closed but never deletes possibly linked media',async()=>{
  const h=harness({count:undefined});
  await assert.rejects(h.run(),/could not be confirmed/);
  assert.equal(byType(h,'remove').length,0);
});
test('null count fails closed but preserves ambiguous media',async()=>{
  const h=harness({count:null});
  await assert.rejects(h.run(),/could not be confirmed/);
  assert.equal(byType(h,'remove').length,0);
});
test('unexpected multirow acknowledgment is not reported as success',async()=>{
  const h=harness({count:2});
  await assert.rejects(h.run(),/could not be confirmed/);
  assert.equal(byType(h,'remove').length,0);
});
test('PostgREST insert error preserves possibly committed media',async()=>{
  const h=harness({error:new Error('synthetic RLS or transport failure'),count:null});
  await assert.rejects(h.run(),/could not be confirmed/);
  assert.equal(byType(h,'remove').length,0);
  assert.equal(byType(h,'upload').length,1);
});
test('thrown insert network failure preserves possibly committed media',async()=>{
  const h=harness({throwDuringInsert:true});
  await assert.rejects(h.run(),/synthetic network dropped after insert/);
  assert.equal(byType(h,'remove').length,0);
  assert.equal(byType(h,'insert').length,1);
});
test('account switch after confirmed insert never deletes linked media',async()=>{
  const h=harness({switchAfterInsert:true});
  await assert.rejects(h.run(),/Account or album editor changed/);
  assert.equal(byType(h,'remove').length,0);
});

test('ownership lookup happens before storage upload or insert',async()=>{
  const h=harness();
  await h.run();
  assert.deepEqual(h.calls.map(call=>call.type).slice(0,3),['album-lookup','upload','insert']);
});
test('foreign-owned album cannot cause speculative storage writes',async()=>{
  const h=harness({albumOwner:'synthetic-owner-B'});
  await assert.rejects(h.run(),/not owned by this account/);
  assert.equal(byType(h,'upload').length,0);
  assert.equal(byType(h,'insert').length,0);
});
test('missing album fails before any storage writes',async()=>{
  const h=harness({missingAlbum:true});
  await assert.rejects(h.run(),/Album is unavailable/);
  assert.equal(byType(h,'upload').length,0);
});
test('mismatched album identifier fails before upload',async()=>{
  const h=harness({albumId:'different-album'});
  await assert.rejects(h.run(),/Album is unavailable/);
  assert.equal(byType(h,'upload').length,0);
});
test('album lookup errors do not create orphan media',async()=>{
  const h=harness({albumError:new Error('synthetic album RLS denied')});
  await assert.rejects(h.run(),/synthetic album RLS denied/);
  assert.equal(byType(h,'upload').length,0);
});
test('account switch during ownership lookup stops upload',async()=>{
  const h=harness({switchDuringLookup:true});
  await assert.rejects(h.run(),/Account or album editor changed/);
  assert.equal(byType(h,'upload').length,0);
});
