'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
test('profile state is published after extras hydration',()=>{
 const start=html.indexOf('async function hydrateUser()');
 const end=html.indexOf('async function loadCore()',start);
 const body=html.slice(start,end);
 assert.ok(body.indexOf('state.profile=p;state.profiles.set(uid,p)')>body.indexOf('state.extras=r.data}else state.extras=e'));
 assert.equal((body.match(/state\.profile=p/g)||[]).length,1);
});
