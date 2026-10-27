import test from 'node:test';
import assert from 'node:assert/strict';
import { ALPHA_REF } from '../scripts/alpha-backend-config.mjs';
import { jwtSubject, verifyTwoUserRls, PRIVATE_TABLES } from '../scripts/verify-two-user-rls.mjs';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const jwt=id=>'h.'+Buffer.from(JSON.stringify({sub:id,role:'authenticated'})).toString('base64url')+'.s';
const tokenA=jwt(A),tokenB=jwt(B),config={projectRef:ALPHA_REF,url:'https://'+ALPHA_REF+'.supabase.co',key:'sb_publishable_synthetic_test',offlineStub:false};
const opts={tokenA,tokenB,idA:A,idB:B};
function mock({cross=false,anon=false,missing=false,deny=false}={}){
  return async(url,init)=>{
    assert.equal(init.method,'GET');assert.equal(init.body,undefined);
    assert.equal(init.redirect,'manual');assert.ok(url.startsWith(config.url+'/rest/v1/'));
    const owner=new URL(url).searchParams.get('user_id').slice(3);
    const own=init.headers.Authorization==='Bearer '+jwt(owner);
    if(deny&&!own)return {status:403,headers:{get:()=>''},json:async()=>[]};
    const rows=own&&!missing||!own&&((init.headers.Authorization&&cross)||(!init.headers.Authorization&&anon))?[{user_id:owner}]:[];
    return {status:200,headers:{get:()=> 'application/json'},json:async()=>rows};
  };
}
test('GET-only checks five owner fixtures, cross-account directions and anonymous access',async()=>{
  let calls=0;const fetchImpl=async(...args)=>{calls++;return mock()(...args)};
  assert.deepEqual(await verifyTwoUserRls(config,{...opts,fetchImpl}),{projectRef:ALPHA_REF,checkedTables:5,readOnly:true});
  assert.equal(calls,PRIVATE_TABLES.length*5);
});
test('empty owner fixtures cannot produce false privacy pass',async()=>{
  await assert.rejects(verifyTwoUserRls(config,{...opts,tables:['user_settings'],fetchImpl:mock({missing:true})}),/fixture missing/);
});
test('cross-account exposure fails',async()=>{
  await assert.rejects(verifyTwoUserRls(config,{...opts,tables:['user_settings'],fetchImpl:mock({cross:true})}),/Cross-account/);
});
test('anonymous exposure fails',async()=>{
  await assert.rejects(verifyTwoUserRls(config,{...opts,tables:['user_settings'],fetchImpl:mock({anon:true})}),/Anonymous/);
});
test('explicit HTTP denial is accepted only for non-owner requests',async()=>{
  assert.equal((await verifyTwoUserRls(config,{...opts,tables:['user_settings'],fetchImpl:mock({deny:true})})).checkedTables,1);
});
test('foreign or offline backends rejected before network',async()=>{
  let calls=0;const fetchImpl=async()=>{calls++;throw Error('unexpected')};
  for(const bad of [{...config,offlineStub:true},{...config,url:'https://example.com'},{...config,projectRef:'zojajuzmfjpvubzibzgg'}])
    await assert.rejects(verifyTwoUserRls(bad,{...opts,fetchImpl}),/isolated/);
  assert.equal(calls,0);
});
test('distinct designated authenticated subjects and known tables required',async()=>{
  assert.equal(jwtSubject(tokenA),A);
  for(const bad of [{...opts,tokenB:tokenA},{...opts,idB:A},{...opts,tokenA:'invalid'}])
    await assert.rejects(verifyTwoUserRls(config,{...bad,fetchImpl:mock()}));
  await assert.rejects(verifyTwoUserRls(config,{...opts,tables:['profiles'],fetchImpl:mock()}),/owner-private/);
});
