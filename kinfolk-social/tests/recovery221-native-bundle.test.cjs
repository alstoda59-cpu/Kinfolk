const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const LIVE_REF='zojajuzmfjpvubzibzgg';
const LIVE_KEY='sb_publishable_1te_hrDXQciMD7Gp1EXmRw_dvQmszvi';
const STUB_REF='aaaaaaaaaaaaaaaaaaaa';
const STUB_KEY='sb_publishable_ci_packaging_only_no_auth';
test('native bundle contains every referenced module including Reels byte-for-byte',()=>{
 const root=path.resolve(__dirname,'..');
 execFileSync(process.execPath,[path.join(root,'native/scripts/prepare-web.mjs')],{env:{...process.env,KINFOLK_ALPHA_SUPABASE_URL:'https://'+STUB_REF+'.supabase.co',KINFOLK_ALPHA_SUPABASE_PUBLISHABLE_KEY:STUB_KEY,KINFOLK_ALPHA_PACKAGING_ONLY:'1'}});
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const scripts=[...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*(["'])(\/kinfolk-[a-zA-Z0-9_-]+\.js)\1[^>]*>/gi)].map(m=>m[2]);
 assert.ok(scripts.includes('/kinfolk-reels159.js'));
 for(const script of scripts){
   const original=fs.readFileSync(path.join(root,script),'utf8');
   const packaged=fs.readFileSync(path.join(root,'native/www',script),'utf8');
   assert.equal(packaged,original.replaceAll(LIVE_REF,STUB_REF).replaceAll(LIVE_KEY,STUB_KEY),script);
   assert.ok(!packaged.includes(LIVE_REF)&&!packaged.includes(LIVE_KEY),'no shared live credentials in '+script);
 }
 const nativeHTML=fs.readFileSync(path.join(root,'native/www/index.html'),'utf8');
 assert.ok(nativeHTML.includes('https://'+STUB_REF+'.supabase.co'));
 assert.ok(!nativeHTML.includes(LIVE_REF));
});
