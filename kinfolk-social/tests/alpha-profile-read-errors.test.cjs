'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
test('profile read errors do not trigger a replacement profile upsert',()=>{
 assert.match(html,/if\(profileReadError\)throw new Error\('Could not load your profile: '\+profileReadError\.message\)/);
 assert.match(html,/let p=p0;if\(!p\)/);
});
