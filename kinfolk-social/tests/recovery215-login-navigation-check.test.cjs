'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase95.js','utf8');
test('login rechecks screen after asynchronous account lookup before saving stay preference',()=>{
 const begin=source.indexOf("if(await currentAccountId()!==startingAccount)throw new Error('The active account changed during login.");
 const screen=source.indexOf("if(!form.isConnected||mode(form)!=='login')",begin);
 const save=source.indexOf('const restoreStay=saveStay(stay)',begin);
 assert.ok(begin>=0&&screen>begin&&save>screen,'screen check must follow account lookup and precede preference save');
});
