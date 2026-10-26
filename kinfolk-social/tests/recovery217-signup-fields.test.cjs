const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase79.js','utf8');
test('signup mounts username and password confirmation fields',()=>{
 assert.ok(source.includes('kf217Username'));
 assert.ok(source.includes('kf217ConfirmPassword'));
 assert.ok(source.includes('Confirm password'));
});
test('signup validates matching password and username before auth request',()=>{
 const start=source.indexOf('async function handleSignup');
 const username=source.indexOf('test(username)',start);
 const match=source.indexOf('confirmPassword!==password',start);
 const signup=source.indexOf('await sb.auth.signUp',start);
 assert.ok(start>=0&&username>start&&match>username&&signup>match);
});
