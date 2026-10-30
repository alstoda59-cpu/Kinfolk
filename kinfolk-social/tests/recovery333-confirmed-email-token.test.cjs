'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'..','kinfolk-phase95.js'),'utf8');
const start=source.indexOf('async function tokenLogin(');
const end=source.indexOf('async function currentAccountId(',start);
assert.ok(start>=0&&end>start,'effective Phase95 password-token login exists');
const helper=source.slice(start,end)+';globalThis.__tokenLogin=tokenLogin;';
const email='synthetic@example.invalid';
const confirmed='2026-10-29T12:00:00.000Z';
function response(userOverrides={},payloadOverrides={}){
  return {access_token:'synthetic-access',refresh_token:'synthetic-refresh',
    user:{id:'synthetic-user-1',email,email_confirmed_at:confirmed,...userOverrides},...payloadOverrides};
}
function harness(payload=response(),status=200){
  const requests=[];
  const context={
    SUPABASE_URL:'https://synthetic.invalid',ANON_KEY:'synthetic-publishable',
    AbortController,setTimeout,clearTimeout,
    friendly:(message)=>message,
    fetch:async(url,options)=>{
      requests.push({url,options});
      return {ok:status>=200&&status<300,status,json:async()=>payload};
    }
  };
  vm.runInNewContext(helper,context,{timeout:1000});
  return {login:context.__tokenLogin,requests};
}

test('verified email token is accepted without changing the password flow',async()=>{
  const h=harness();
  const result=await h.login(email,'synthetic-password');
  assert.equal(result.user.id,'synthetic-user-1');
  assert.equal(h.requests.length,1);
  assert.equal(h.requests[0].options.method,'POST');
  assert.match(h.requests[0].url,/\/auth\/v1\/token\?grant_type=password$/);
});
for(const [name,value] of [['missing',undefined],['null',null],['empty',''],['whitespace','  ']]){
  test('unconfirmed email token is rejected: '+name,async()=>{
    const user={email_confirmed_at:value};
    const h=harness(response(user));
    await assert.rejects(h.login(email,'synthetic-password'),/email still needs to be confirmed/i);
    assert.equal(h.requests.length,1);
  });
}
test('verified token for a different email is rejected before session adoption',async()=>{
  const h=harness(response({email:'different@example.invalid'}));
  await assert.rejects(h.login(email,'synthetic-password'),/different email account/i);
});
test('incomplete token is rejected even if email is verified',async()=>{
  const h=harness(response({}, {refresh_token:null}));
  await assert.rejects(h.login(email,'synthetic-password'),/incomplete login session/i);
});
test('email matching remains case insensitive',async()=>{
  const h=harness(response({email:'SYNTHETIC@EXAMPLE.INVALID'}));
  const result=await h.login(email,'synthetic-password');
  assert.equal(result.user.id,'synthetic-user-1');
});
