import test from 'node:test';
import assert from 'node:assert/strict';
import { ALPHA_REF } from '../scripts/alpha-backend-config.mjs';
import { jwtSubject, verifyTwoUserRls, PRIVATE_TABLES } from '../scripts/verify-two-user-rls.mjs';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const jwt=id=>'h.'+Buffer.from(JSON.stringify({sub:id,role:'authenticated'})).toString('base64url')+'.s';
const tokenA=jwt(A),tokenB=jwt(B),config={projectRef:ALPHA_REF,url:'https://'+ALPHA_REF+'.supabase.co',key:'sb_publishable_synthetic_test',offlineStub:false};
const opts={tokenA,tokenB,idA:A,idB:B};
function mock({cross=false,anon=false,missing=false,denyCrossStatus=0,denyAnonymous=false}={}){
  return async(url,init)=>{
    assert.equal(init.method,'GET');assert.equal(init.body,undefined);
    assert.equal(init.redirect,'manual');assert.ok(url.startsWith(config.url+'/rest/v1/'));
    const owner=new URL(url).searchParams.get('user_id').slice(3);
    const own=init.headers.Authorization==='Bearer '+jwt(owner);
    if(denyCrossStatus&&init.headers.Authorization&&!own)return {status:denyCrossStatus,headers:{get:()=>''},json:async()=>[]};
    if(denyAnonymous&&!init.headers.Authorization)return {status:403,headers:{get:()=>''},json:async()=>[]};
    const rows=own&&!missing||!own&&((init.headers.Authorization&&cross)||(!init.headers.Authorization&&anon))?[{user_id:owner}]:[];
    return {status:200,headers:{get:()=> 'application/json'},json:async()=>rows};
  };
}
test('GET-only checks five owner fixtures, cross-account directions and anonymous access',async()=>{
  let calls=0;const fetchImpl=async(...args)=>{calls++;return mock()(...args)};
  assert.deepEqual(await verifyTwoUserRls(config,{...opts,fetchImpl}),{projectRef:ALPHA_REF,checkedTables:5,readOnly:true});
  assert.equal(calls,PRIVATE_TABLES.length*6);
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
test('authenticated cross-account HTTP 401 or 403 cannot count as RLS isolation',async()=>{
  for(const denyCrossStatus of [401,403]){
    await assert.rejects(
      verifyTwoUserRls(config,{...opts,tables:['user_settings'],fetchImpl:mock({denyCrossStatus})}),
      new RegExp('RLS probe HTTP '+denyCrossStatus+' for user_settings')
    );
  }
});
test('anonymous HTTP 403 denial is valid only after authenticated cross-account reads succeed',async()=>{
  const result=await verifyTwoUserRls(config,{...opts,tables:['user_settings'],fetchImpl:mock({denyAnonymous:true})});
  assert.equal(result.checkedTables,1);
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

test('anonymous access to second owner fails independently',async()=>{
  const fetchImpl=async(url,init)=>{
    const owner=new URL(url).searchParams.get('user_id').slice(3);
    const own=init.headers.Authorization==='Bearer '+jwt(owner);
    const exposed=!init.headers.Authorization&&owner===B;
    return {status:200,headers:{get:()=> 'application/json'},json:async()=>own||exposed?[{user_id:owner}]:[]};
  };
  await assert.rejects(verifyTwoUserRls(config,{...opts,tables:['user_settings'],fetchImpl}),/Anonymous RLS exposure/);
});

test('RLS hard deadline rejects an abort-ignoring fetch instead of hanging',async()=>{
  let signal,release;
  const pending=new Promise(resolve=>{release=resolve});
  await assert.rejects(
    verifyTwoUserRls(config,{...opts,tables:['user_settings'],timeoutMs:15,
      fetchImpl:async(_url,init)=>{signal=init.signal;return pending}}),
    /RLS probe timed out for user_settings/
  );
  assert.equal(signal.aborted,true);
  release({status:200,headers:{get:()=> 'application/json'},json:async()=>[{user_id:A}]});
});

test('RLS hard deadline covers a stalled JSON reader as well as fetch',async()=>{
  let signal,release;
  const pendingBody=new Promise(resolve=>{release=resolve});
  await assert.rejects(
    verifyTwoUserRls(config,{...opts,tables:['user_settings'],timeoutMs:15,
      fetchImpl:async(_url,init)=>{signal=init.signal;return {
        status:200,headers:{get:()=> 'application/json'},json:()=>pendingBody
      }}}),
    /RLS probe timed out for user_settings/
  );
  assert.equal(signal.aborted,true);
  release([{user_id:A}]);
});

test('invalid RLS timeouts fail before any backend request',async()=>{
  let calls=0;
  for(const timeoutMs of [0,-1,1.5,Infinity,NaN,60001]){
    await assert.rejects(
      verifyTwoUserRls(config,{...opts,tables:['user_settings'],timeoutMs,
        fetchImpl:async()=>{calls++;return mock()()}}),
      /RLS probe timeout must be/
    );
  }
  assert.equal(calls,0);
});

test('expired or malformed JWT expiry cannot establish real RLS privacy evidence',async()=>{
  const withExp=exp=>'h.'+Buffer.from(JSON.stringify({sub:A,role:'authenticated',exp})).toString('base64url')+'.s';
  let calls=0;
  const fetchImpl=async()=>{calls++;throw Error('unexpected network')};
  for(const exp of [0,-1,'9999999999',1.5,Math.floor(Date.now()/1000)-1]){
    await assert.rejects(verifyTwoUserRls(config,{...opts,tokenA:withExp(exp),fetchImpl}),/expired or has invalid expiry/);
  }
  assert.equal(calls,0);
  assert.equal(jwtSubject(withExp(Math.floor(Date.now()/1000)+3600)),A);
});

test('future or malformed JWT not-before cannot establish two-account privacy evidence',async()=>{
  const withNbf=nbf=>'h.'+Buffer.from(JSON.stringify({sub:A,role:'authenticated',nbf})).toString('base64url')+'.s';
  const now=Math.floor(Date.now()/1000);
  let calls=0;
  const fetchImpl=async()=>{calls++;throw Error('unexpected network')};
  for(const nbf of [now+3600,'0',1.5,null]){
    await assert.rejects(verifyTwoUserRls(config,{...opts,tokenA:withNbf(nbf),fetchImpl}),/not yet valid or has invalid not-before/);
  }
  assert.equal(calls,0);
  assert.equal(jwtSubject(withNbf(now-60)),A);
});
