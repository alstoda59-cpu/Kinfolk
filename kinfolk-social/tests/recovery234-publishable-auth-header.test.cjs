'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

// Execute the real Phase95 password-token request with synthetic responses.
// Supabase publishable keys identify the client on "apikey"; they are not
// JWTs and must never be sent as Authorization: Bearer <publishable key>.
const source=fs.readFileSync('kinfolk-social/kinfolk-phase95.js','utf8');
const start=source.indexOf('async function tokenLogin(');
const end=source.indexOf('async function currentAccountId()',start);
assert.ok(start>=0&&end>start,'Phase95 tokenLogin must exist');
const tokenSource=source.slice(start,end);
const key='sb_publishable_synthetic_auth_header_key';
const url='https://synthetic.invalid';
function harness(fetch){
  return vm.runInNewContext(tokenSource+'\n tokenLogin',{
    SUPABASE_URL:url,ANON_KEY:key,AbortController,fetch,
    setTimeout,clearTimeout,
    friendly:(raw)=>String(raw||'Login failed')
  });
}
test('password login sends publishable key in apikey, never as a bearer token',async()=>{
  let called=0;
  const login=harness(async(requestUrl,options)=>{
    called++;
    assert.equal(requestUrl,url+'/auth/v1/token?grant_type=password');
    assert.equal(options.method,'POST');
    assert.equal(options.cache,'no-store');
    assert.equal(options.headers.apikey,key);
    assert.equal(options.headers['Content-Type'],'application/json');
    assert.equal(Object.keys(options.headers).some(k=>k.toLowerCase()==='authorization'),false,
      'publishable key is not a user JWT');
    assert.deepEqual(JSON.parse(options.body),{email:'qa@example.test',password:'synthetic-password'});
    assert.ok(options.signal instanceof AbortSignal);
    return {ok:true,status:200,json:async()=>({
      access_token:'synthetic-user-jwt',refresh_token:'synthetic-refresh',user:{id:'synthetic-user',email:'qa@example.test'}
    })};
  });
  const result=await login('qa@example.test','synthetic-password');
  assert.equal(called,1);
  assert.equal(result.user.id,'synthetic-user');
});
test('authentication rejection remains a failure with publishable-only header',async()=>{
  const login=harness(async(_url,options)=>{
    assert.equal(options.headers.apikey,key);
    assert.equal(options.headers.Authorization,undefined);
    return {ok:false,status:401,json:async()=>({error_description:'Invalid login credentials'})};
  });
  await assert.rejects(login('qa@example.test','wrong'),/Invalid login credentials/);
});
