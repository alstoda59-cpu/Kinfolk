'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
test('signup help matches enforced 12 to 128 character password rule',()=>{
  assert.match(html,/Use 12–128 characters for your password\./);
  assert.match(html,/minlength="12" maxlength="128"/);
  assert.match(html,/password\.length<12\|\|password\.length>128/);
  assert.doesNotMatch(html,/Password must be 5–12 characters/);
});
test('signup screen identifies mobile alpha, not old phase preview',()=>{
  assert.match(html,/Mobile alpha preview/);
  assert.doesNotMatch(html,/Phase 31 preview/);
});
