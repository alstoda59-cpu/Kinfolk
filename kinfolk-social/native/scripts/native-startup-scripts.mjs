// Fail-closed startup asset discovery for Capacitor's offline web bundle.
// This parses every script tag, not only scripts with a kinfolk- filename.
import assert from 'node:assert/strict';

export function nativeStartupScripts(html){
  const sources=[];
  for(const [tag] of String(html).matchAll(/<script\b[^>]*>/gi)){
    if(!/\bsrc\s*=/i.test(tag))continue;
    const match=/\bsrc\s*=\s*(["'])(.*?)\1/i.exec(tag);
    assert.ok(match,'native startup script src must be quoted: '+tag.slice(0,100));
    sources.push(match[2]);
  }
  return sources;
}

export async function verifyNativeStartupScripts(html,exists){
  const scripts=nativeStartupScripts(html);
  for(const src of scripts){
    // Reject remote, protocol-relative, traversal, query strings, URL encoding,
    // and scripts outside the packaged JavaScript asset tree.
    assert.match(src,/^\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.js$/,'native script must be a plain bundled JavaScript path: '+src);
    assert.ok(await exists(src.slice(1)),'native script asset missing: '+src);
  }
  return scripts;
}
