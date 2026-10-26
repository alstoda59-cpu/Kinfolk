'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
test('signup does not cap passwords at 12 characters',()=>{
  assert.doesNotMatch(html,/minlength="5" maxlength="12"/);
  assert.doesNotMatch(html,/password\.length<5\|\|password\.length>12/);
});
test('signup permits 12 to 128 character passwords',()=>{
  assert.match(html,/minlength="12" maxlength="128"/);
  assert.match(html,/password\.length<12\|\|password\.length>128/);
});
