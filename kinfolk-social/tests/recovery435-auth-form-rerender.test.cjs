'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('kinfolk-social/index.html','utf8');
const start=source.indexOf("function renderAuth(mode='login')");
const end=source.indexOf('function layout()',start);
assert.ok(start>=0&&end>start,'auth renderer must exist');
const auth=source.slice(start,end);
test('auth submit captures the form and message elements before awaiting Supabase',()=>{
 assert.match(auth,/const btn=\$\('#authBtn'\),msg=\$\('#authMsg'\),form=\$\('#authForm'\)/);
 assert.match(auth,/const current=\(\)=>form\.isConnected&&document\.getElementById\('authForm'\)===form/);
});
test('stale signup response cannot write into a replacement login form',()=>{
 assert.match(auth,/if\(!current\(\)\)return;if\(data\.session&&kf338ConfirmedSession\(data\.session\)\)/);
 assert.match(auth,/msg\.className='good';msg\.textContent='Account created/);
 assert.match(auth,/const \{data,error\}=await sb\.auth\.signUp\(/);
 assert.match(auth,/if\(error\)throw error;if\(!current\(\)\)return/);
});
test('stale async auth errors and finally cannot mutate replacement form',()=>{
 assert.match(auth,/catch\(err\)\{if\(current\(\)\)msg\.textContent=err\.message\|\|String\(err\)\}/);
 assert.match(auth,/finally\{if\(current\(\)\)btn\.disabled=false\}/);
});
