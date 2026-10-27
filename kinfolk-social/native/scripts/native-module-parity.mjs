// Exact source-to-package inventory check, including ordering and duplicates.
import assert from 'node:assert/strict';

export function assertNativeModuleParity(sourceHTML, packagedHTML){
  const pattern=/<script\\s+src=["'](\\/kinfolk-[a-zA-Z0-9_-]+\\.js)["']/gi;
  const source=[...sourceHTML.matchAll(pattern)].map(match=>match[1]);
  const packaged=[...packagedHTML.matchAll(pattern)].map(match=>match[1]);
  assert.ok(source.length>=20,'main app module inventory unexpectedly small');
  assert.equal(new Set(source).size,source.length,'duplicate main app module script');
  assert.equal(new Set(packaged).size,packaged.length,'duplicate packaged module script');
  assert.deepEqual(packaged.filter(name=>name!=='/kinfolk-supabase-sdk.js'),source,'native package must preserve every main-app module in source order');
  return source.length;
}
