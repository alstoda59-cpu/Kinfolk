'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('kinfolk-social/kinfolk-phase95.js','utf8');
const tokenStart=source.indexOf('async function tokenLogin(');
const tokenEnd=source.indexOf('async function currentAccountId()',tokenStart);
const adoptStart=source.indexOf('async function adopt(tokens)');
const adoptEnd=source.indexOf(' let loginBusy=',adoptStart);
assert.ok(tokenStart>=0&&tokenEnd>tokenStart&&adoptStart>=0&&adoptEnd>adoptStart);
const tokenSource=source.slice(tokenStart,tokenEnd);
const adoptSource=source.slice(adoptStart,adoptEnd);
const response=(email)=>({
  access_token:'synthetic-access',
  refresh_token:'synthetic-refresh',
  user:{id:'synthetic-id',email_confirmed_at:'2026-10-29T12:00:00.000Z',...(email===undefined?{}:{email})}
});
const tokenHarness=payload=>vm.runInNewContext(tokenSource+'\n tokenLogin',{
  SUPABASE_URL:'https://example.invalid',
  ANON_KEY:'synthetic-publishable-key',
  friendly:msg=>String(msg||'Login failed'),
  AbortController,
  fetch:async()=>({ok:true,status:200,json:async()=>payload}),
  setTimeout:()=>1,clearTimeout:()=>{}
});
const adoptHarness=(session,active=session)=>vm.runInNewContext(adoptSource+'\n adopt',{
  sb:{auth:{
    setSession:async()=>({data:{session},error:null}),
    getSession:async()=>({data:{session:active},error:null})
  }},
  setTimeout:()=>1
});
const session=(email)=>({user:{id:'synthetic-id',email,email_confirmed_at:'2026-10-29T12:00:00.000Z'}});
test('token response with different email cannot be adopted',async()=>{
  await assert.rejects(tokenHarness(response('other@example.test'))('qa@example.test','synthetic-password'),/different email account/);
});
test('token response without email fails closed',async()=>{
  await assert.rejects(tokenHarness(response(undefined))('qa@example.test','synthetic-password'),/different email account/);
});
test('token response email comparison normalizes casing',async()=>{
  const result=await tokenHarness(response('QA@EXAMPLE.TEST'))('qa@example.test','synthetic-password');
  assert.equal(result.user.id,'synthetic-id');
});
test('adopt rejects same-id session for another email',async()=>{
  await assert.rejects(adoptHarness(session('other@example.test'))(response('qa@example.test')),/authenticated email does not match/);
});
test('adopt rejects active session with changed email after setSession',async()=>{
  await assert.rejects(adoptHarness(session('qa@example.test'),session('other@example.test'))(response('qa@example.test')),/active email changed/);
});
test('adopt permits a verified same-id same-email session',async()=>{
  const result=await adoptHarness(session('QA@EXAMPLE.TEST'))(response('qa@example.test'));
  assert.equal(result.user.id,'synthetic-id');
});
test('login guards email and password edits across async boundaries',()=>{
  assert.match(source,/const sameLoginInputs=\(\)=>String\(form\.querySelector\('#kf73Email'\)/);
  assert.match(source,/String\(\(form\.querySelector\('#kf73Password'\)/);
  assert.equal((source.match(/if\(!sameLoginInputs\(\)\)throw new Error/g)||[]).length,5);
});
