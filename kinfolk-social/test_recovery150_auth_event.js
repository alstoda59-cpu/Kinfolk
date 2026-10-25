// Recovery150 static regression: run with node test_recovery150_auth_event.js
const fs=require('node:fs');const assert=require('node:assert/strict');
const src=fs.readFileSync(require('node:path').join(__dirname,'index.html'),'utf8');
const event=src.slice(src.indexOf('sb.auth.onAuthStateChange('),src.indexOf('async function hydrateUser()'));
assert.ok(event.includes("event==='SIGNED_OUT'"),'sign-out handler retained');
assert.ok(event.includes('setTimeout(async()=>'), 'auth callback must defer Supabase API calls');
assert.ok(event.includes('await kf129RestorableSession()'),'auth events must use common restoration policy');
assert.ok(event.includes('allowed.user?.id!==session.user.id'),'stale event must not activate a different user');
assert.ok(event.includes('await kf129ActivateSession(allowed)'),'only policy-approved sessions activate');
assert.ok(!event.includes('kf129ActivateSession(session)'),'direct unguarded activation must not return');
console.log('Recovery150: 6 auth-event guard source assertions passed (not a backend/device test)');
