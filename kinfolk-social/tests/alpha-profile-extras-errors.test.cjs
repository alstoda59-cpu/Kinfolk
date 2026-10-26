'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
test('profile extras read failures are surfaced',()=>{
 assert.match(html,/if\(extrasReadError\)throw new Error\('Could not load profile settings: '\+extrasReadError\.message\)/);
});
test('profile extras creation only tolerates duplicate-key race',()=>{
 assert.match(html,/insExtra\.error\.code!=='23505'/);
 assert.match(html,/if\(r\.error\)throw new Error\('Could not reload profile settings: '/);
 assert.match(html,/if\(!r\.data\)throw new Error\('Profile settings were not saved\. Please retry\.'\)/);
});
