import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Execute the actual post-signUp result guard with synthetic mobile forms.
// A late successful response must not be adopted after navigating to Login.
const source=readFileSync(new URL('../kinfolk-phase79.js',import.meta.url),'utf8');
const handler=source.slice(source.indexOf('async function handleSignup('));
const marker='// A completed Auth request belongs to the exact signup screen';
const start=handler.indexOf(marker);
const end=handler.indexOf("if(!result||typeof result!=='object')",start);
assert.ok(start>=0&&end>start,'effective post-request guard found');
const guard=handler.slice(start,end);

function exercise({connected=true,replacedTitle=false,loginTitle=false,unchanged=true}={}){
  const messages=[];
  const title={textContent:loginTitle?'Log in':'Create account'};
  const form={
    isConnected:connected,
    querySelector:()=>replacedTitle?{textContent:'Create account'}:title
  };
  const btn={disabled:true,textContent:'Creating account…'};
  const context={
    form,signupTitle:title,signupSnapshot:{},btn,
    signupInputsUnchanged:()=>unchanged,
    isSignupTitle:value=>String(value).toLowerCase()==='create account',
    show:(_form,message)=>messages.push(message),
    Date:{now:()=>1000}
  };
  const outcome=vm.runInNewContext(
    '(()=>{let signupRetryAt=0;const run=()=>{'+guard+'return "continued"};return {result:run(),retryAt:signupRetryAt}})()',
    context,{timeout:1000}
  );
  return {result:outcome.result,retryAt:outcome.retryAt,messages,btn};
}

test('late successful signup after navigation or unmount keeps cooldown and cannot reach result handling',()=>{
  for(const options of [{connected:false},{replacedTitle:true},{loginTitle:true}]){
    const r=exercise(options);
    assert.equal(r.result,undefined);
    assert.equal(r.retryAt,61000);
    assert.deepEqual(r.messages,[]);
    assert.equal(r.btn.disabled,true);
    assert.equal(r.btn.textContent,'Creating account…');
  }
});

test('edited signup still shows original-inbox guidance and suppresses result',()=>{
  const r=exercise({unchanged:false});
  assert.equal(r.result,undefined);
  assert.equal(r.retryAt,61000);
  assert.match(r.messages[0],/original email inbox/);
  assert.equal(r.btn.disabled,false);
});

test('unchanged current signup may continue to validate its result',()=>{
  const r=exercise();
  assert.equal(r.result,'continued');
  assert.equal(r.retryAt,0);
  assert.deepEqual(r.messages,[]);
});

test('navigation guard runs after Auth response and before adopting its user or session',()=>{
  const call=handler.indexOf('sb.auth.signUp({');
  const result=handler.indexOf('const {data,error}=result;');
  const stay=handler.indexOf('saveStay(stay)');
  assert.ok(call>=0&&start>call&&result>end&&stay>result);
});
