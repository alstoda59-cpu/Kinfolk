// Strict static verification of the installable-alpha web asset package.
// No real accounts, network calls or production environment credentials used.
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { alphaBackendConfig, isolateNativeAsset, LIVE_REF, LIVE_KEY } from './alpha-backend-config.mjs';
import { verifyNativeStartupScripts, nativeStartupScripts } from './native-startup-scripts.mjs';
import { assertNativeModuleParity } from './native-module-parity.mjs';
import { alphaEmailCallback } from './native-email-callback.mjs';
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
assert.ok(html.includes('window.KINFOLK_NATIVE_ALPHA=true;'),'native signup must have early packaged-alpha marker');
assert.ok(html.indexOf('window.KINFOLK_NATIVE_ALPHA=true;')<html.indexOf('src="/kinfolk-supabase-sdk.js"'),'native marker must be set before auth SDK and app startup');
const emailCallback=alphaEmailCallback(process.env.KINFOLK_ALPHA_EMAIL_REDIRECT_URL);
if(emailCallback){
  assert.ok(html.includes('window.KINFOLK_EMAIL_REDIRECT_URL='+JSON.stringify(emailCallback)),
    'native package must embed the configured HTTPS verification callback');
}else{
  assert.doesNotMatch(html,/window\.KINFOLK_EMAIL_REDIRECT_URL\s*=/,
    'native package must not silently retain an unconfigured email callback');
}
const passwordResetCallback=alphaEmailCallback(process.env.KINFOLK_ALPHA_PASSWORD_RESET_REDIRECT_URL);
if(passwordResetCallback){
  assert.ok(html.includes('window.KINFOLK_PASSWORD_RESET_REDIRECT_URL='+JSON.stringify(passwordResetCallback)),
    'native package must embed the configured HTTPS password recovery callback');
}else{
  assert.doesNotMatch(html,/window\\.KINFOLK_PASSWORD_RESET_REDIRECT_URL\\s*=/,
    'native package must not retain an unconfigured password recovery callback');
}
assert.doesNotMatch(html,/navigator\.serviceWorker\.register\('/,'Capacitor should not register a stale web service worker');

// Check every startup script, not just scripts matching kinfolk-*.js.
// Recovery265 accidentally double-escaped its regular expression, so it
// matched zero real <script> tags and rejected otherwise valid packages.
const startupScripts=await verifyNativeStartupScripts(html,async relativePath=>{
  try{return (await stat(path.join(output,relativePath))).isFile()}
  catch(error){if(error?.code==='ENOENT')return false;throw error}
});
assert.ok(startupScripts.length>=20,'native startup scripts must remain intact');

const modules=nativeStartupScripts(html).filter(src=>/^\/kinfolk-[A-Za-z0-9_-]+\.js$/.test(src));
assertNativeModuleParity(original,html);
assert.ok(modules.length>=20,'complete Kinfolk modules must be present');
assert.ok(modules.includes('/kinfolk-reels159.js'),'shorts and reels must be packaged');
assert.ok(modules.includes('/kinfolk-preview-isolation.js'),'preview isolation guard must ship but remain inactive on Capacitor localhost');
assert.ok(modules.includes('/kinfolk-communities.js'),'Communities must be packaged in Android/iOS alpha');
assert.ok(modules.includes('/kinfolk-community-membership.js'),'Community membership controls must be packaged in Android/iOS alpha');
assert.ok(modules.includes('/kinfolk-community-owner-edit.js'),'Community owner editing must be packaged in Android/iOS alpha');
assert.ok(modules.includes('/kinfolk-phase108.js'),'Reporting and moderation safety controls must be packaged in Android/iOS alpha');
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
