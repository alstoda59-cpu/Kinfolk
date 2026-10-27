// Fail-closed startup asset discovery for Capacitor's offline web bundle.
// Parse attribute names, not substrings: data-src is not the script's src.
import assert from 'node:assert/strict';

export function nativeStartupScripts(html){
  const sources=[];
  // A quoted '>' is legal inside an HTML attribute and must not end the tag.
  for(const [tag] of String(html).matchAll(/<script\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi)){
    const attrs=tag.replace(/^<script\b/i,'').slice(0,-1);
    let cursor=0,src=null;
    for(const match of attrs.matchAll(/\s+([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)){
      assert.ok(!attrs.slice(cursor,match.index).trim(),'malformed native script attribute');
      cursor=match.index+match[0].length;
      if(match[1].toLowerCase()!=='src')continue;
      assert.equal(src,null,'native startup script must not have duplicate src attributes');
      assert.ok(match[2]!==undefined||match[3]!==undefined,'native startup script src must be quoted');
      src=match[2]??match[3];
    }
    assert.ok(!attrs.slice(cursor).trim(),'malformed native script attribute');
    if(src!==null)sources.push(src);
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
