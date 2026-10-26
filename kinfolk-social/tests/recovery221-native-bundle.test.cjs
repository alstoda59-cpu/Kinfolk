const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
test('native bundle contains every referenced module including Reels byte-for-byte',()=>{
 const root=path.resolve(__dirname,'..');
 execFileSync(process.execPath,[path.join(root,'native/scripts/prepare-web.mjs')]);
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const scripts=[...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*(["'])(\/kinfolk-[a-zA-Z0-9_-]+\.js)\1[^>]*>/gi)].map(m=>m[2]);
 assert.ok(scripts.includes('/kinfolk-reels159.js'));
 for(const script of scripts) assert.deepEqual(fs.readFileSync(path.join(root,'native/www',script)),fs.readFileSync(path.join(root,script)),script);
});
