'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
test('first-login profile upsert failures are surfaced',()=>{
 assert.match(html,/if\(created\.error\)throw new Error\('Could not create your profile: '\+created\.error\.message\)/);
});
test('account activation refuses an absent profile',()=>{
 assert.match(html,/if\(!profile\)throw new Error\('Your profile could not be loaded\. Please retry\.'\)/);
});
