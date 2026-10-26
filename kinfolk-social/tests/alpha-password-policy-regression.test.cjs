'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const signup=source('kinfolk-phase79.js');
const legacy=source('kinfolk-phase76.js');
function rejector(sourceText,regex,argNames){
  const match=sourceText.match(regex);
  assert.ok(match,'Expected password guard is present in active source');
  return new Function(...argNames,'return ('+match[1]+');');
}
test('active signup accepts 12 and 128 character passwords but rejects 11 and 129',()=>{
  const rejects=rejector(signup,/if\\((password\\.length<\\d+\\|\\|password\\.length>\\d+)\\)\\{show\\(form,'Password must/,['password']);
  for(const n of [12,13,64,128])assert.equal(rejects('x'.repeat(n)),false,'length '+n);
  for(const n of [0,5,11,129])assert.equal(rejects('x'.repeat(n)),true,'length '+n);
});
test('confirmation field and signup screen do not truncate at 12 characters',()=>{
  assert.match(signup,/input\\.minLength=12;input\\.maxLength=128/);
  assert.match(legacy,/autocomplete="new-password" placeholder="Create a password \\(12–128 characters\\)"/);
  assert.doesNotMatch(signup,/input\\.maxLength=12/);
});
test('Supabase signup wrapper enforces the same range',()=>{
  const rejects=rejector(legacy,/if\\((pw\\.length<\\d+\\|\\|pw\\.length>\\d+)\\)return\\{data:/,['pw']);
  for(const n of [12,128])assert.equal(rejects('x'.repeat(n)),false);
  for(const n of [11,129])assert.equal(rejects('x'.repeat(n)),true);
});
test('legacy login accepts preexisting passwords regardless of signup length',()=>{
  const rejects=rejector(legacy,/if\\((mode==='signup'&&\\(password\\.length<\\d+\\|\\|password\\.length>\\d+\\))\\)throw/,['mode','password']);
  for(const n of [3,11,12,128,200])assert.equal(rejects('login','x'.repeat(n)),false);
  for(const n of [11,129])assert.equal(rejects('signup','x'.repeat(n)),true);
  assert.match(legacy,/required autocomplete="current-password" placeholder="Password"/);
  assert.match(legacy,/p\\.removeAttribute\\('minlength'\\);p\\.removeAttribute\\('maxlength'\\)/);
});
test('mobile form hardening applies signup limits only in signup mode',()=>{
  assert.match(legacy,/const title=\\(f\\.querySelector\\('\\.kf73Title'\\)\\?\\.textContent/);
  assert.match(legacy,/const bad=isSignup\\(\\)&&l>0&&\\(l<12\\|\\|l>128\\)/);
  assert.match(legacy,/if\\(isSignup\\(\\)&&\\(p\\.value\\.length<12\\|\\|p\\.value\\.length>128\\)\\)/);
});
test('account security password update allows 12–128 and source parses',()=>{
  assert.match(legacy,/id="kfsNewPassword"[^>]+minlength="12" maxlength="128"/);
  assert.match(legacy,/id="kfsConfirmPassword"[^>]+minlength="12" maxlength="128"/);
  assert.match(legacy,/if\\(a\\.length<12\\|\\|a\\.length>128\\)/);
  assert.doesNotThrow(()=>new Function(legacy));
  assert.doesNotThrow(()=>new Function(signup));
});
