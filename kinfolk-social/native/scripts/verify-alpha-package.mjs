// Strict static verification of the installable-alpha web asset package.
// No real accounts, network calls or production environment credentials used.
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { alphaBackendConfig, isolateNativeAsset, LIVE_REF, LIVE_KEY } from './alpha-backend-config.mjs';
const backend=alphaBackendConfig();

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source=path.resolve(root,'..');
const output=path.join(root,'www');
const html=await readFile(path.join(output,'index.html'),'utf8');
const original=await readFile(path.join(source,'index.html'),'utf8');
assert.match(original,/https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2/,'web preview remains untouched');
assert.match(html,/<script src="\/kinfolk-supabase-sdk\.js"><\/script>/,'native launch must load local SDK');
assert.doesNotMatch(html,/https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/,'native launch may not depend on CDN');
assert.ok(html.indexOf('src="/kinfolk-supabase-sdk.js"')<html.indexOf('const sb=window.supabase.createClient'),'local SDK must execute first');
assert.ok(html.includes(backend.url)&&html.includes(backend.key),'native entry must use the isolated backend');
assert.doesNotMatch(html,/navigator\.serviceWorker\.register\('/,'Capacitor should not register a stale web service worker');

// Native startup must not require a remote JavaScript host or silently omit a
// local script when new main-app modules are introduced.
const scriptTags=[...html.matchAll(/<script\\b[^>]*\\bsrc\\s*=\\s*(["'])(.*?)\\1[^>]*>/gi)];
for(const match of scriptTags){
  const src=match[2];
  assert.ok(src.startsWith('/')&&!src.startsWith('//'), 'native script must be bundled locally: '+src);
  assert.ok(!src.includes('?')&&!src.includes('#')&&!src.includes('..'), 'native script path must be a plain local asset: '+src);
  assert.ok((await stat(path.join(output,src.slice(1)))).isFile(), 'native script asset missing: '+src);
}
assert.ok(scriptTags.length>=20,'native startup scripts must remain intact');

const modules=[...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*(["'])(\/kinfolk-[a-zA-Z0-9_-]+\.js)\1[^>]*>/gi)].map(m=>m[2]);
assert.ok(modules.length>=20,'complete Kinfolk modules must be present');
assert.ok(modules.includes('/kinfolk-reels159.js'),'shorts and reels must be packaged');
for(const name of modules){
  const bytes=await readFile(path.join(output,name.slice(1)));
  assert.ok(bytes.length>0,name+' was empty');
  if(name!=='/kinfolk-supabase-sdk.js'){
    const originalBytes=await readFile(path.join(source,name.slice(1)));
    const expected=isolateNativeAsset(originalBytes.toString('utf8'),backend);
    assert.equal(bytes.toString('utf8'),expected,name+' must match complete main app except isolated backend');
  }
}
assert.ok((await stat(path.join(output,'kinfolk-supabase-sdk.js'))).size>10000,'local auth SDK bundle missing');
const filenames=await readdir(output);
for(const name of filenames){
  if(!/\.(?:html|js)$/.test(name))continue;
  const contents=await readFile(path.join(output,name),'utf8');
  assert.ok(!contents.includes(LIVE_REF)&&!contents.includes(LIVE_KEY),'shared live backend must not appear in '+name);
}
assert.ok(filenames.includes('manifest.webmanifest'),'manifest missing');
console.log('PASS installable alpha package: '+modules.length+' local scripts; no remote auth SDK; main features preserved');
