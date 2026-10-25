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
 assert.match(reels,/await loadVideoReactions\(\);\s*if\(!isCurrent\(\)\)return/);
 assert.match(reels,/await signed\('kinfolk-video',v\.storage_path\)/);
});
test('mobile reels retain keyboard, playback, and accessibility controls',()=>{
 assert.match(reels,/aria-label="Play or pause reel"/);
 assert.match(reels,/playsinline muted loop/);
 assert.match(reels,/ArrowDown/);
 assert.match(reels,/ArrowUp/);
 assert.match(reels,/prefers-reduced-motion:reduce/);
});
test('authentication code remains present in main app',()=>{
 assert.ok(auth.length>1000,'main app authentication module missing');
});
