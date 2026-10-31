import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Exercise the exact submitted-email and error paths from Kinfolk Phase79.
// Synthetic only: no network, Supabase or stored credentials.
const source=readFileSync(new URL('../kinfolk-phase79.js',import.meta.url),'utf8');
const handler=source.slice(source.indexOf('async function handleSignup('));
const matchAt=handler.indexOf('const matchesSubmittedEmail=value=>');
const matchEnd=handler.indexOf('if(!matchesSubmittedEmail(data.user.email))',matchAt);
assert.ok(matchAt>=0&&matchEnd>matchAt,'effective signup identity match found');
const matchSource=handler.slice(matchAt,matchEnd);
function emailMatch(email='Test.User@Example.invalid'){
  return vm.runInNewContext('(()=>{const email='+JSON.stringify(email)+';'+matchSource+';return matchesSubmittedEmail})()',{}, {timeout:1000});
}

const errorStart=handler.indexOf('const raw=err?.message||String(err),low=raw.toLowerCase();');
const errorEnd=handler.indexOf('show(form,message);',errorStart);
assert.ok(errorStart>=0&&errorEnd>errorStart,'signup failure rendering found');
const errorSource=handler.slice(errorStart,errorEnd+'show(form,message);'.length);
function errorMessage(err){
  let message;
  const show=(form,text)=>{message=text};
  const form={};
  vm.runInNewContext('(()=>{'+errorSource+'})()',{err,show,form}, {timeout:1000});
  return message;
}

test('accepted signup must return an explicit email identity',()=>{
  const matches=emailMatch();
  for(const value of [undefined,null,'',0,{},false]){
    assert.equal(matches(value),false);
  }
});
test('signup response email match is trimmed and case insensitive',()=>{
  const matches=emailMatch();
  assert.equal(matches('  test.user@EXAMPLE.INVALID  '),true);
  assert.equal(matches('another.user@example.invalid'),false);
  assert.equal(matches('test.user@other.invalid'),false);
});
test('signup checks response user email before trusting returned session',()=>{
  const userCheck=handler.indexOf('if(!matchesSubmittedEmail(data.user.email))');
  const sessionCheck=handler.indexOf('if(data.session&&(data.session.user?.id!==data.user.id||!matchesSubmittedEmail(data.session.user?.email)))');
  const verify=handler.indexOf('if(data?.session&&!signupSessionEmailConfirmed(data))');
  assert.ok(userCheck>=0&&sessionCheck>userCheck&&verify>sessionCheck);
});
test('actual Supabase invalid email code gives a useful retry instruction',()=>{
  assert.equal(errorMessage({code:'email_address_invalid',message:'Email address is invalid'}),'Enter a valid email address that can receive a verification link.');
  assert.equal(errorMessage({error_code:'email_address_invalid',message:'unspecified'}),'Enter a valid email address that can receive a verification link.');
});
test('signup rate limiting does not recommend hammering Auth',()=>{
  const expected='Too many account or email requests. Please wait before trying again.';
  assert.equal(errorMessage({code:'over_email_send_rate_limit',message:'Too many emails'}),expected);
  assert.equal(errorMessage({status:429,message:'Request limit reached'}),expected);
});
test('birthday, duplicate username and unrelated errors preserve existing behavior',()=>{
  assert.equal(errorMessage(new Error('Birthday is required for alpha signup')),'Enter your birthday to create a Kinfolk account.');
  assert.equal(errorMessage(new Error('username already taken')),'That username is already taken. Choose a different username.');
  assert.equal(errorMessage(new Error('synthetic network unavailable')),'synthetic network unavailable');
});
