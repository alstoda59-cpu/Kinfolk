import test from 'node:test';
import assert from 'node:assert/strict';
import {ALPHA_REF} from '../scripts/alpha-backend-config.mjs';
import {PRIVATE_TABLES} from '../scripts/verify-two-user-rls.mjs';
import {requireFunctionalRlsProof} from '../scripts/functional-rls-gate.mjs';

const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const jwt=id=>'h.'+Buffer.from(JSON.stringify({sub:id,role:'authenticated'})).toString('base64url')+'.s';
const tokenA=jwt(A),tokenB=jwt(B);
const config={projectRef:ALPHA_REF,url:'https://'+ALPHA_REF+'.supabase.co',key:'sb_publishable_synthetic_test',offlineStub:false};
const env={KINFOLK_ALPHA_SYNTHETIC_ACCOUNTS_ONLY:'1',KINFOLK_ALPHA_TEST_USER_A_JWT:tokenA,KINFOLK_ALPHA_TEST_USER_B_JWT:tokenB,KINFOLK_ALPHA_TEST_USER_A_ID:A,KINFOLK_ALPHA_TEST_USER_B_ID:B};
function mock({cross=false,anon=false,missing=false}={}){
  const calls=[];
  const fetchImpl=async(url,init)=>{
    calls.push({url,init});
    assert.equal(init.method,'GET');
    assert.equal(init.body,undefined);
    const owner=new URL(url).searchParams.get('user_id').slice(3);
    const bearer=init.headers.Authorization;
    const subject=bearer==='Bearer '+tokenA?A:bearer==='Bearer '+tokenB?B:null;
    const own=subject===owner;
    const exposed=Boolean(subject&&subject!==owner&&cross)||Boolean(!subject&&anon);
    const rows=(own&&!missing||exposed)?[{user_id:owner}]:[];
    return {status:200,headers:{get:()=> 'application/json'},json:async()=>rows};
  };
  return {fetchImpl,calls};
}
test('functional gate executes all real RLS probe paths with read-only synthetic fixtures',async()=>{
  const m=mock();
  const result=await requireFunctionalRlsProof(config,{env,fetchImpl:m.fetchImpl});
  assert.deepEqual(result,{projectRef:ALPHA_REF,checkedTables:PRIVATE_TABLES.length,readOnly:true});
  assert.equal(m.calls.length,PRIVATE_TABLES.length*6);
  assert.ok(m.calls.every(x=>x.url.startsWith(config.url+'/rest/v1/')));
});
test('functional gate refuses missing opt-in or credentials before any network',async()=>{
  const m=mock();
  await assert.rejects(requireFunctionalRlsProof(config,{env:{...env,KINFOLK_ALPHA_SYNTHETIC_ACCOUNTS_ONLY:'0'},fetchImpl:m.fetchImpl}),/opt-in/);
  await assert.rejects(requireFunctionalRlsProof(config,{env:{...env,KINFOLK_ALPHA_TEST_USER_B_JWT:''},fetchImpl:m.fetchImpl}),/JWT/);
  assert.equal(m.calls.length,0);
});
test('functional gate rejects cross-account and anonymous visibility',async()=>{
  await assert.rejects(requireFunctionalRlsProof(config,{env,fetchImpl:mock({cross:true}).fetchImpl}),/Cross-account/);
  await assert.rejects(requireFunctionalRlsProof(config,{env,fetchImpl:mock({anon:true}).fetchImpl}),/Anonymous/);
});
test('functional gate rejects absent owner fixtures and foreign project',async()=>{
  await assert.rejects(requireFunctionalRlsProof(config,{env,fetchImpl:mock({missing:true}).fetchImpl}),/fixture missing/);
  const m=mock();
  await assert.rejects(requireFunctionalRlsProof({...config,projectRef:'zojajuzmfjpvubzibzgg'},{env,fetchImpl:m.fetchImpl}),/isolated/);
  assert.equal(m.calls.length,0);
});
