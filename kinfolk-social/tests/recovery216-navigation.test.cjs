const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase95.js','utf8');
test('screen guard precedes asynchronous token request',()=>{
 const a=source.indexOf('const startingAccount=await currentAccountId()');
 const guard='if(!currentLoginScreen())';
 const b=source.indexOf(guard,a);
 assert.ok(source.includes("form.isConnected&&form.querySelector('.kf73Title')===loginTitle&&mode(form)==='login"),'Guard must verify original connected login screen');
 const c=source.indexOf('const tokens=await tokenLogin',a);
 assert.ok(a>=0&&b>a&&c>b);
});
