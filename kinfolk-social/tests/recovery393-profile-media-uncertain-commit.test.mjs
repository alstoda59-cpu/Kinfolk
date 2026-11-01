import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../kinfolk-phase100.js',import.meta.url),'utf8');
const start=source.indexOf('    profileWriteMayHaveCommitted=true;');
const end=source.indexOf('    // The database update may finish',start);
assert.ok(start>0&&end>start,'effective profile database write block exists');
const actualWrite=source.slice(start,end);

// Execute the real Phase100 database-write block, including its uncertainty
// bookkeeping. The Supabase client is synthetic; no network or accounts.
async function runProfileWrite(result,{reject=false}={}){
  const calls=[];
  const sb={from(table){
    calls.push(table);
    assert.equal(table,'profiles');
    return {update(values,opts){
      assert.deepEqual(values,{avatar_url:'user/avatars/new.jpg'});
      assert.equal(opts.count,'exact');
      return {eq(field,id){
        assert.equal(field,'id');
        assert.equal(id,'synthetic-user');
        return reject?Promise.reject(new Error('Connection lost')):Promise.resolve(result);
      }};
    }};
  }};
  const context={sb,po:{avatar_url:'user/avatars/new.jpg'},accountId:'synthetic-user'};
  const code='(async()=>{let profileWriteMayHaveCommitted=false;try{'+actualWrite+
    'return {success:true,mayCommit:profileWriteMayHaveCommitted}}catch(error){return {success:false,mayCommit:profileWriteMayHaveCommitted,message:error.message}}})()';
  const outcome=await vm.runInNewContext(code,context,{timeout:1000});
  assert.deepEqual(calls,['profiles']);
  return outcome;
}

test('successful profile write retains referenced uploaded media',async()=>{
  const r=await runProfileWrite({error:null,count:1});
  assert.equal(r.success,true);
  assert.equal(r.mayCommit,true);
});
test('explicit zero-row response permits unreferenced media cleanup',async()=>{
  const r=await runProfileWrite({error:null,count:0});
  assert.equal(r.success,false);
  assert.equal(r.mayCommit,false);
});
test('network rejection after dispatch preserves potentially referenced media',async()=>{
  const r=await runProfileWrite(null,{reject:true});
  assert.equal(r.success,false);
  assert.equal(r.mayCommit,true);
});
test('PostgREST error response does not prove a profile write was rolled back',async()=>{
  const r=await runProfileWrite({error:{message:'Request failed'},count:0});
  assert.equal(r.success,false);
  assert.equal(r.mayCommit,true);
});
test('missing or unexpected row count fails closed without deleting uploaded media',async()=>{
  for(const count of [undefined,null,2]){
    const r=await runProfileWrite({error:null,count});
    assert.equal(r.success,false);
    assert.equal(r.mayCommit,true);
  }
});
test('cleanup only runs before profile dispatch or after explicit zero-row acknowledgment',()=>{
  const extras=source.indexOf("if(x.count!==1)throw new Error");
  assert.ok(extras>0&&extras<start);
  assert.match(source,/let profileWriteMayHaveCommitted=false;/);
  assert.match(source,/if\(!profileSaved&&!profileWriteMayHaveCommitted\)await removeUploaded\(uploaded\);/);
  assert.ok(source.indexOf('profileWriteMayHaveCommitted=true;',extras)<source.indexOf("const p=await sb.from('profiles')",extras));
});
