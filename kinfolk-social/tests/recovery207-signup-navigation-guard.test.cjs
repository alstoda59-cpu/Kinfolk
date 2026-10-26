'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase79.js','utf8');
// Static safety gate, not a simulated signup or real Supabase integration test.
test('signup refuses stale result after navigation before persisting stay preference',()=>{
 const completion=source.indexOf('if(error)throw error;',source.indexOf('async function handleSignup'));
 const guard=source.indexOf('if(!form.isConnected||',completion);
 const persistence=source.indexOf('if(data?.session){',completion);
 assert.ok(completion>=0&&guard>completion&&persistence>guard,'stale-form guard must precede session preference persistence');
 assert.match(source.slice(guard,persistence),/return;/);
});
test('signup guard verifies the form still represents signup, not login',()=>{
 assert.match(source,/form\.querySelector\('\.kf73Title'\)/);
 assert.match(source,/includes\('create your kinfolk'\)/);
});

test('signup rechecks navigation after asynchronous session verification',()=>{
 const start=source.indexOf('const verifiedSignupSession=await signupSessionIsCurrent(data.session);');
 const guard=source.indexOf('if(!form.isConnected||',start);
 const decision=source.indexOf('if(!verifiedSignupSession)',start);
 const save=source.indexOf('try{saveStay(stay)}',start);
 assert.ok(start>=0&&guard>start&&decision>guard&&save>decision,'recheck must occur between verification and preference persistence');
 assert.match(source.slice(guard,decision),/return;/);
});
