import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Source-execute the effective mobile catch guard, not a parallel reimplementation.
const source=readFileSync(new URL('../kinfolk-phase79.js',import.meta.url),'utf8');
const handler=source.slice(source.indexOf('async function handleSignup('));
const marker='// An in-flight signup can fail after the user navigates to login.';
const start=handler.indexOf(marker);
const end=handler.indexOf('// If the member edited the signup details',start);
assert.ok(start>=0&&end>start,'effective stale-error navigation guard exists');
const guard=handler.slice(start,end);

function exercise({sent=true,connected=true,replaced=false,login=false}={}){
  const title={textContent:login?'Log in':'Create account'};
  const form={isConnected:connected,querySelector:()=>replaced?{textContent:'Create account'}:title};
  const btn={disabled:true,textContent:'Creating account…'};
  const context={form,signupTitle:title,signupRequestSent:sent,btn,
    isSignupTitle:value=>String(value).toLowerCase()==='create account',
    Date:{now:()=>2000}};
  const result=vm.runInNewContext(
    '(()=>{let signupRetryAt=0;const check=()=>{'+guard+'return "continue-error-handling"};return {value:check(),retryAt:signupRetryAt}})()',
    context,{timeout:1000});
  return {value:result.value,retryAt:result.retryAt,btn};
}

test('dispatched signup error after leaving screen retains cooldown without changing login UI',()=>{
  for(const options of [{connected:false},{replaced:true},{login:true}]){
    const r=exercise(options);
    assert.equal(r.value,undefined);
    assert.equal(r.retryAt,62000);
    assert.equal(r.btn.disabled,true);
    assert.equal(r.btn.textContent,'Creating account…');
  }
});

test('preflight error after leaving screen does not imply an Auth signup request',()=>{
  for(const options of [{connected:false},{replaced:true},{login:true}]){
    const r=exercise({...options,sent:false});
    assert.equal(r.value,undefined);
    assert.equal(r.retryAt,0);
  }
});

test('current signup screen still receives normal error processing',()=>{
  for(const sent of [true,false]){
    const r=exercise({sent});
    assert.equal(r.value,'continue-error-handling');
    assert.equal(r.retryAt,0);
  }
});

test('stale error guard remains in catch after signUp dispatch',()=>{
  const dispatch=handler.indexOf('signupRequestSent=true;');
  const signup=handler.indexOf('sb.auth.signUp({',dispatch);
  const catchStart=handler.lastIndexOf('}catch(err){',start);
  assert.ok(dispatch>=0&&signup>dispatch&&catchStart>signup&&start>catchStart);
});
