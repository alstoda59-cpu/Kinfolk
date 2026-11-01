import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Source-execute the effective mobile signup error guard. Synthetic only.
const source=readFileSync(new URL('../kinfolk-phase79.js',import.meta.url),'utf8');
const handler=source.slice(source.indexOf('async function handleSignup('));
const start=handler.lastIndexOf('}catch(err){');
const end=handler.indexOf('const raw=err?.message||String(err)',start);
assert.ok(start>=0&&end>start,'effective signup catch guard found');
const guard=handler.slice(start+'}catch(err){'.length,end);

function exercise({sent=true,unchanged=false,connected=true,titleCurrent=true}={}){
  const messages=[];
  const title={textContent:'Create account'};
  const btn={disabled:true,textContent:'Creating account…'};
  const form={isConnected:connected,querySelector:()=>titleCurrent?title:{textContent:'Log in'}};
  const context={
    form,signupTitle:title,signupRequestSent:sent,signupSnapshot:{},
    signupInputsUnchanged:()=>unchanged,isSignupTitle:value=>value==='Create account',
    show:(_form,message)=>messages.push(message),btn,Date:{now:()=>1234}
  };
  const outcome=vm.runInNewContext(
    '(()=>{let signupRetryAt=0;const run=()=>{'+guard+'return "continued"};return {result:run(),retryAt:signupRetryAt}})()',
    context,{timeout:1000}
  );
  return {result:outcome.result,retryAt:outcome.retryAt,messages,btn};
}

test('old signup error cannot overwrite edited mobile account details',()=>{
  const result=exercise({sent:true,unchanged:false});
  assert.equal(result.result,undefined);
  assert.equal(result.retryAt,61234);
  assert.match(result.messages[0],/original email/);
  assert.equal(result.btn.disabled,false);
  assert.equal(result.btn.textContent,'Create account');
});

test('preflight failures are not mislabeled as a submitted account',()=>{
  const result=exercise({sent:false,unchanged:false});
  assert.equal(result.result,'continued');
  assert.equal(result.retryAt,0);
  assert.equal(result.messages.length,0);
});

test('errors for unchanged signup details retain normal handling',()=>{
  const result=exercise({sent:true,unchanged:true});
  assert.equal(result.result,'continued');
  assert.equal(result.retryAt,0);
  assert.equal(result.messages.length,0);
});

test('navigated or detached forms never receive stale signup errors',()=>{
  for(const args of [{connected:false},{titleCurrent:false}]){
    const result=exercise(args);
    assert.equal(result.result,undefined);
    assert.equal(result.retryAt,0);
    assert.equal(result.messages.length,0);
  }
});

test('the effective signup marks the request sent immediately before Auth call',()=>{
  const sent=handler.indexOf('signupRequestSent=true;');
  const call=handler.indexOf('sb.auth.signUp({',sent);
  const preflight=handler.indexOf('await requireNoActiveSignupAccount();');
  assert.ok(preflight>=0&&sent>preflight&&call>sent);
  assert.match(handler.slice(0,sent),/let signupRequestSent=false;/);
});
