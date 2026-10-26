// Alpha native packaging. Preserves the complete web app, but removes its
// dependency on a remote Supabase JavaScript CDN at native cold start.
import { cp, mkdir, readdir, rm, readFile, writeFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';
import { alphaBackendConfig, isolateNativeAsset, LIVE_REF, LIVE_KEY } from './alpha-backend-config.mjs';

const nativeRoot=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source=path.resolve(nativeRoot,'..');
const destination=path.join(nativeRoot,'www');
// Validate before removing any previously generated native bundle.
const alphaBackend=alphaBackendConfig();

await rm(destination,{recursive:true,force:true});
await mkdir(destination,{recursive:true});
for(const name of await readdir(source)){
  if(/^(index\.html|offline\.html|manifest\.webmanifest|service-worker\.js|favicon\.ico|apple-touch-icon\.png|kinfolk-icon(?:-\d+)?\.(?:svg|png)|kinfolk-[\w-]+\.js)$/.test(name)){
    await cp(path.join(source,name),path.join(destination,name));
    if(/\.(?:html|js)$/.test(name)){
      const target=path.join(destination,name);
      const original=await readFile(target,'utf8');
      const isolated=isolateNativeAsset(original,alphaBackend);
      if(isolated!==original)await writeFile(target,isolated);
    }
  }
}

const inputHTML=await readFile(path.join(destination,'index.html'),'utf8');
const remote='<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>';
if(!inputHTML.includes(remote))throw new Error('Native SDK packaging anchor missing: review how the main app loads Supabase');
const swRegistration="if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/service-worker.js').catch(()=>{}));";
if(!inputHTML.includes(swRegistration))throw new Error('Native service-worker registration anchor changed: review packaged cache behavior');
const nativeHTML=inputHTML.replace(remote,'<script src="/kinfolk-supabase-sdk.js"></script>')
  .replace(swRegistration,'/* Native alpha: Capacitor manages bundled assets, not a web service worker. */');
if(nativeHTML.includes(remote))throw new Error('Unpinned Supabase CDN must not remain in the native entry HTML');
await writeFile(path.join(destination,'index.html'),nativeHTML);

await build({
  entryPoints:[path.join(nativeRoot,'scripts','supabase-bridge.mjs')],
  outfile:path.join(destination,'kinfolk-supabase-sdk.js'),
  bundle:true,
  platform:'browser',
  format:'iife',
  target:['es2020'],
  minify:true,
  sourcemap:false,
  legalComments:'none',
  logLevel:'warning'
});
const sdk=path.join(destination,'kinfolk-supabase-sdk.js');
if((await stat(sdk)).size<10000)throw new Error('Supabase native SDK bundle unexpectedly small');
// No native entry or module may silently reach the shared live project.
for(const name of await readdir(destination)){
  if(!/\.(?:html|js)$/.test(name))continue;
  const body=await readFile(path.join(destination,name),'utf8');
  if(body.includes(LIVE_REF)||body.includes(LIVE_KEY))throw new Error('Shared live Supabase credentials remain in native asset '+name);
}
if(!nativeHTML.includes(alphaBackend.url)||!nativeHTML.includes(alphaBackend.key))throw new Error('Isolated backend was not injected into native entry HTML');
const scripts=[...nativeHTML.matchAll(/<script\b[^>]*\bsrc\s*=\s*(["'])(\/kinfolk-[a-zA-Z0-9_-]+\.js)\1[^>]*>/gi)].map(m=>m[2]);
if(!scripts.includes('/kinfolk-supabase-sdk.js'))throw new Error('Native entry HTML does not load the bundled Supabase SDK');
for(const script of scripts)await readFile(path.join(destination,script.slice(1)));
const clientIndex=nativeHTML.indexOf('src="/kinfolk-supabase-sdk.js"');
const appIndex=nativeHTML.indexOf('const sb=window.supabase.createClient');
if(clientIndex<0||appIndex<clientIndex)throw new Error('Native SDK must load before Kinfolk creates the client');
console.log('Kinfolk native bundle packaged: '+scripts.length+' local modules, local Supabase SDK, isolated backend '+alphaBackend.projectRef+(alphaBackend.offlineStub?' (OFFLINE PACKAGING CHECK ONLY; LOGIN DISABLED)':''));
