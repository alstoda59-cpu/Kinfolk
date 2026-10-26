'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase95.js','utf8');
test('login rechecks screen after asynchronous account lookup before saving stay preference',()=>{
 const begin=source.indexOf("if(await currentAccountId()!==startingAccount)throw new Error('The active account changed during login.");
 const screen=source.indexOf("if(!currentLoginScreen())",begin);
 const save=source.indexOf('const restoreStay=saveStay(stay)',begin);
 assert.ok(begin>=0&&screen>begin&&save>screen,'screen check must follow account lookup and precede preference save');
});

test('login screen guard requires original title node identity, not only same title text',()=>{
 const begin=source.indexOf("const loginTitle=form.querySelector('.kf73Title')");
 const identity=source.indexOf("form.querySelector('.kf73Title')===loginTitle",begin);
 const screen=source.indexOf("if(!currentLoginScreen())",begin);
 assert.ok(begin>=0&&identity>begin&&screen>identity);
 assert.ok((source.match(/if\(!currentLoginScreen\(\)\)/g)||[]).length>=4);
 assert.ok(source.includes("if(currentLoginScreen())show(form,'Logged in."));
 assert.ok(source.includes("catch(err){if(currentLoginScreen())"));
});

test('reused login form cannot submit another account while old request is pending',()=>{
 assert.ok(source.includes("activeLoginTitle=loginTitle"));
 assert.ok(source.includes("if(loginBusy){if(loginTitle!==activeLoginTitle)show(form,"));
 assert.ok(source.includes("if(activeLoginTitle===loginTitle){loginBusy=false;activeLoginTitle=null}"));
});
