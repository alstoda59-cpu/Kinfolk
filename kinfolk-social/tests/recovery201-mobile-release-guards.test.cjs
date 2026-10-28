'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const reels=fs.readFileSync('kinfolk-social/kinfolk-reels159.js','utf8');
const auth=fs.readFileSync('kinfolk-social/kinfolk-phase95.js','utf8');
// Source-level regression gates only; they do not prove real auth, RLS, or device behavior.
test('mobile reels teardown aborts viewport listeners and pauses videos',()=>{
 assert.match(reels,/active\.resizeController\?\.abort\(\)/);
 assert.match(reels,/active\.root\?\.querySelectorAll\('video'\)\.forEach\(v=>v\.pause\(\)\)/);
 assert.match(reels,/active\.generation\+\+/);
});
test('reels reject late async rendering after navigation',()=>{
 assert.match(reels,/const isCurrent=\(\)=>generation===active\.generation&&main\.isConnected&&state\.view==='reels'/);
 assert.match(reels,/const reactionsReady=await kf289LoadReactions\(\);\s*if\(!isCurrent\(\)\)return/);
 assert.match(reels,/const urls=await kf287ResolveReelUrls\(reels,signed,isCurrent\)/);
 assert.match(reels,/if\(!isCurrent\(\)\)return;\s*const cards=\[\]/);
});
test('mobile reels retain keyboard, playback, and accessibility controls',()=>{
 assert.match(reels,/aria-label="Play or pause reel"/);
 assert.match(reels,/playsinline muted loop/);
 assert.match(reels,/ArrowDown/);
 assert.match(reels,/ArrowUp/);
 assert.match(reels,/prefers-reduced-motion:reduce/);
});
test('login preference code preserves persistent and tab-scoped session choices',()=>{
 assert.match(auth,/PREF1='kinfolk_stay_logged_in_v1'/);
 assert.match(auth,/TAB='kinfolk_session_tab'/);
 assert.match(auth,/localStorage\.setItem\(PREF1,stay\?'1':'0'\)/);
 assert.match(auth,/if\(stay\)sessionStorage\.removeItem\(TAB\);else sessionStorage\.setItem\(TAB,'1'\)/);
 assert.match(auth,/const restore=\(\)=>/,'failed preference updates must be reversible');
});
test('login waits for an authenticated session before account adoption',()=>{
 assert.match(auth,/sb\.auth\.getSession\(\)/);
 assert.match(auth,/sb\.auth\.setSession/);
});
