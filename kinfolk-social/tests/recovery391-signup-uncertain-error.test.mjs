import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Execute the effective mobile signup catch branch, not a reimplemented helper.
// Synthetic errors only; no Supabase accounts or email requests are created.
const source=readFileSync(new URL('../kinfolk-phase79.js',import.meta.url),'utf8');
const handler=source.slice(source.indexOf('async function handleSignup('));
const marker='// Recovery391: a transport timeout or server error after signUp was';
const start=handler.indexOf(marker);
const end=handler.indexOf('let message=raw;',start);
assert.ok(start>=0&&end>start,'effective uncertain-signup guard found');
const guard=handler.slice(start,end);

function exercise({sent=true,status,code='',raw='Unknown signup failure'}={}){
  const messages=[];
  const btn={disabled:true,textContent:'Creating account…'};
  const form={};
  const context={
    signupRequestSent:sent,err:status===undefined?{}:{status},
    code,raw,low:raw.toLowerCase(),form,btn,
    Date:{now:()=>2000},
    show:(_form,message)=>messages.push(message)
  };
  const outcome=vm.runInNewContext(
    '(()=>{let signupRetryAt=0;const run=()=>{'+guard+'return "normal-error-handling"};return {result:run(),retryAt:signupRetryAt}})()',
    context,{timeout:1000}
  );
  return {result:outcome.result,retryAt:outcome.retryAt,messages,btn};
}

test('sent signup with ambiguous network error is cooled down, not immediately retried',()=>{
  for(const options of [
    {raw:'Failed to fetch'},
    {raw:'Network request failed',status:0},
    {raw:'Connection reset by peer'},
    {raw:'Transport rejected',code:'fetch_error'},
    {raw:'Gateway unavailable',status:503},
    {raw:'Request expired',status:408}
  ]){
    const result=exercise(options);
    assert.equal(result.result,undefined);
    assert.equal(result.retryAt,62000);
    assert.match(result.messages[0],/could not confirm whether the account was created/i);
    assert.match(result.messages[0],/original email inbox/);
    assert.equal(result.btn.disabled,false);
    assert.equal(result.btn.textContent,'Create account');
  }
});

test('known validation and rate-limit errors keep normal correction guidance',()=>{
  for(const options of [
    {raw:'Email address invalid',status:400,code:'email_address_invalid'},
    {raw:'Too many requests',status:429,code:'over_request_rate_limit'},
    {raw:'Not authorized',status:401},
    {raw:'Failed to fetch',status:400},
    {raw:'Unknown signup failure'}
  ]){
    const result=exercise(options);
    assert.equal(result.result,'normal-error-handling');
    assert.equal(result.retryAt,0);
    assert.deepEqual(result.messages,[]);
  }
});

test('preflight network failures do not imply an account creation attempt',()=>{
  const result=exercise({sent:false,raw:'Failed to fetch',status:503});
  assert.equal(result.result,'normal-error-handling');
  assert.equal(result.retryAt,0);
  assert.deepEqual(result.messages,[]);
});

test('uncertain-response guard is after Auth dispatch and before generic error display',()=>{
  const sent=handler.indexOf('signupRequestSent=true;');
  const call=handler.indexOf('sb.auth.signUp({',sent);
  const catchStart=handler.lastIndexOf('}catch(err){',start);
  const normalMessage=handler.indexOf('let message=raw;',start);
  assert.ok(sent>=0&&call>sent&&catchStart>call&&start>catchStart&&normalMessage>end-1);
});
