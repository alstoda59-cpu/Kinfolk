'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
test('profile read errors do not trigger a replacement profile upsert',()=>{
 const start=html.indexOf('async function hydrateUser()');
 const end=html.indexOf('async function loadCore()',start);
 const body=html.slice(start,end);
 assert.ok(start>=0&&end>start);
 assert.match(body,/if\(profileReadError\)throw new Error\('Could not load your profile: '\+profileReadError\.message\)/);
 assert.ok(body.indexOf('if(profileReadError)')<body.indexOf('if(!profile){'));
 assert.match(body,/let profile=p0;/);
});
