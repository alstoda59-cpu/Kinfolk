import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Source-executed synthetic confirmation checks. No Supabase network calls.
const source=readFileSync(new URL('../kinfolk-phase79.js',import.meta.url),'utf8');
const start=source.indexOf('function signupSessionEmailConfirmed(');
const end=source.indexOf('function updateSignupPrivacy(',start);
assert.ok(start>=0&&end>start,'effective signup confirmation helper exists');
const production=source.slice(start,end);
const confirmedAt='2026-10-30T18:00:00.000Z';
const user={id:'synthetic-user',email:'person@example.invalid',email_confirmed_at:confirmedAt};
const response={user,session:{access_token:'synthetic-token',user:{...user}}};
const check=vm.runInNewContext('(()=>{'+production+';return signupSessionEmailConfirmed})()',{});

test('a confirmed signup user and confirmed session user permit the session preference path',()=>{
  assert.equal(check(response),true);
});
test('an unconfirmed signup user blocks the preference path even with a session',()=>{
  assert.equal(check({...response,user:{...user,email_confirmed_at:null}}),false);
});
test('an unconfirmed session user blocks the preference path even if signup user is confirmed',()=>{
  assert.equal(check({...response,session:{...response.session,user:{...user,email_confirmed_at:null}}}),false);
});
test('missing and whitespace confirmation timestamps fail closed',()=>{
  for(const timestamp of [undefined,'', '  ',0,false]){
    assert.equal(check({...response,user:{...user,email_confirmed_at:timestamp}}),false);
    assert.equal(check({...response,session:{...response.session,user:{...user,email_confirmed_at:timestamp}}}),false);
  }
});
test('email-confirmation signups without a session do not pass the confirmed-session gate',()=>{
  assert.equal(check({user,session:null}),false);
  assert.equal(check({user}),false);
  assert.equal(check(null),false);
});
test('confirmation gate runs before preference persistence and preserves the verification panel',()=>{
  const handler=source.slice(source.indexOf('async function handleSignup('));
  const confirmation=handler.indexOf('if(data?.session&&!signupSessionEmailConfirmed(data))');
  const panel=handler.indexOf('mountVerification(form);',confirmation);
  const earlyReturn=handler.indexOf('return;',panel);
  const identity=handler.indexOf('const verifiedSignupSession=await signupSessionIsCurrent(data.session,email);',confirmation);
  const persist=handler.indexOf('try{saveStay(stay)}',identity);
  assert.ok(confirmation>=0&&panel>confirmation&&earlyReturn>panel&&identity>earlyReturn&&persist>identity);
  assert.match(handler.slice(confirmation,earlyReturn),/Kinfolk has not saved a Stay Logged In choice/);
});
