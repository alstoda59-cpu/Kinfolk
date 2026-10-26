'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase79.js','utf8');
test('signup success is gated by active form after async cleanup',()=>{
 const marker=source.indexOf('A storage failure cleanup can await sign-out');
 const guard=source.indexOf('if(!form.isConnected||',marker);
 const success=source.indexOf('Account created. Opening Kinfolk',marker);
 assert.ok(marker>=0&&guard>marker&&success>guard);
 assert.match(source.slice(guard,success),/return;/);
});
