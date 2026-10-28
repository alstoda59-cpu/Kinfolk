// Preserve the complete ordered Kinfolk module inventory in native packages.
// Reuse the already-tested HTML script parser so attributes before src, such
// as defer or data-src, cannot hide a missing or substituted app module.
import assert from 'node:assert/strict';
import { nativeStartupScripts } from './native-startup-scripts.mjs';

function appModules(html){
  const scripts=nativeStartupScripts(html);
  // A malformed, remote or query-string Kinfolk module must not silently
  // disappear from the parity inventory. Only the SDK is intentionally
  // replaced by the native packager.
  for(const src of scripts){
    if(src.startsWith('/kinfolk-')&&src!=='/kinfolk-supabase-sdk.js'){
      assert.match(src,/^\/kinfolk-[A-Za-z0-9_-]+\.js$/,'invalid Kinfolk app module script path');
    }
  }
  return scripts.filter(src=>/^\/kinfolk-[A-Za-z0-9_-]+\.js$/.test(src)&&src!=='/kinfolk-supabase-sdk.js');
}

export function assertNativeModuleParity(sourceHTML, packagedHTML){
  const source=appModules(sourceHTML);
  const packaged=appModules(packagedHTML);
  assert.ok(source.length>=20,'main app module inventory unexpectedly small');
  assert.equal(new Set(source).size,source.length,'duplicate main app module script');
  assert.equal(new Set(packaged).size,packaged.length,'duplicate packaged module script');
  assert.deepEqual(packaged,source,'native package must preserve every main-app module in source order');
  return source.length;
}
