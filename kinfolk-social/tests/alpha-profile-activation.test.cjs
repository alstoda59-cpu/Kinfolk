'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
test('profile state is published only after extras hydration and session guard',()=>{
 const start=html.indexOf('async function hydrateUser()');
 const end=html.indexOf('async function loadCore()',start);
 const body=html.slice(start,end);
 assert.ok(start>=0&&end>start);
 assert.ok(body.indexOf('state.profile=profile;')>body.indexOf('state.extras=extras;'));
 assert.ok(body.indexOf('state.extras=extras;')>body.indexOf('if(!current())return false;',body.indexOf('let extras=e;')));
 assert.equal((body.match(/state\.profile=profile;/g)||[]).length,1);
 assert.equal((body.match(/state\.extras=extras;/g)||[]).length,1);
});
