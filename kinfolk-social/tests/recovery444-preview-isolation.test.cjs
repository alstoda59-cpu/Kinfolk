// Recovery444: executable, offline guard against preview-to-production backend access.
// Run: node kinfolk-social/tests/recovery444-preview-isolation.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'kinfolk-preview-isolation.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert.ok(html.indexOf('/kinfolk-preview-isolation.js') >= 0, 'guard must be loaded');
assert.ok(html.indexOf('/kinfolk-preview-isolation.js') < html.indexOf('https://cdn.jsdelivr.net/npm/@supabase/supabase-js'), 'guard must run before SDK');

function run(host, readyState='complete', preseedBlocked=false, missingBody=false) {
  const nodes = [];
  const listeners = {};
  const windowListeners = {};
  const make = tag => ({
    tag, attrs: {}, children: [], style: {},
    setAttribute(key, value) { this.attrs[key] = value; },
    append(...children) { this.children.push(...children); },
  });
  const document = {
    readyState,
    body: missingBody ? null : {style: {}, appendChild(node) { nodes.push(node); }},
    head: {prepend(node) { nodes.push(node); }},
    createElement: make,
    getElementById(id) { return nodes.find(n => n.id === id); },
    addEventListener(type, fn) { listeners[type] = fn; },
  };
  const window = {location: {hostname: host}, addEventListener(type, fn) { windowListeners[type] = fn; }};
  if (preseedBlocked) window.__kinfolkPreviewBackendBlocked = true;
  vm.runInNewContext(source, {window, document}, {timeout: 1000});
  return {window, document, nodes, listeners, windowListeners};
}
for (const host of ['kinfolk-social-demo-abc.vercel.app', 'vercel.app', 'TEST.VERCEL.APP', 'kinfolk-social-demo-abc.vercel.app.', 'VERCEL.APP..']) {
  const result = run(host);
  assert.equal(result.window.__kinfolkPreviewBackendBlocked, true, host);
  const policy = result.nodes.find(n => n.tag === 'meta');
  assert.ok(policy, 'CSP installed before startup');
  const csp = policy.attrs.content;
  assert.match(csp, /connect-src 'self'/);
  assert.match(csp, /img-src 'self' data: blob:/);
  assert.match(csp, /media-src 'self' blob:/);
  assert.match(csp, /form-action 'none'/);
  assert.doesNotMatch(csp, /supabase\.co/);
  assert.ok(result.listeners.submit, 'form submit interception registered');
  let prevented = false, stopped = false;
  result.listeners.submit({preventDefault(){prevented=true;}, stopImmediatePropagation(){stopped=true;}});
  assert.ok(prevented && stopped);
  assert.ok(result.nodes.some(n => n.id === 'kf317PreviewBlocked'), 'blocking UI shown');
}
for (const host of ['kinfolk.example.com', 'localhost', '127.0.0.1', 'evilvercel.app', 'vercel.app.evil.test', 'vercel.app.evil.test.']) {
  const result = run(host);
  assert.equal(result.window.__kinfolkPreviewBackendBlocked, undefined, host);
  assert.equal(result.nodes.length, 0, 'nonpreview behavior untouched');
}
// A mutable global flag must not be able to suppress the actual network CSP.
const preseeded = run('test.vercel.app', 'complete', true);
assert.ok(preseeded.nodes.some(n => n.tag === 'meta'), 'pre-set global flag cannot bypass preview CSP');
assert.ok(preseeded.listeners.submit, 'pre-set global flag cannot bypass form interception');
assert.ok(preseeded.nodes.some(n => n.id === 'kf317PreviewBlocked'), 'pre-set global flag cannot bypass overlay');
const pending = run('test.vercel.app', 'loading');
assert.ok(pending.listeners.DOMContentLoaded, 'deferred blocking UI registered');
assert.equal(pending.nodes.some(n => n.id === 'kf317PreviewBlocked'), false);
pending.listeners.DOMContentLoaded();
assert.ok(pending.nodes.some(n => n.id === 'kf317PreviewBlocked'));
// A document may report complete before its body is exposed by an embedded shell.
const lateBody = run('test.vercel.app', 'complete', false, true);
assert.ok(lateBody.nodes.some(n => n.tag === 'meta'), 'network CSP installed without body');
assert.ok(lateBody.listeners.DOMContentLoaded, 'late body gets DOM-ready retry');
assert.ok(lateBody.windowListeners.pageshow, 'late body gets pageshow fallback');
assert.equal(lateBody.nodes.some(n => n.id === 'kf317PreviewBlocked'), false);
lateBody.document.body = {style:{}, appendChild(node) {lateBody.nodes.push(node);}};
lateBody.listeners.DOMContentLoaded();
lateBody.windowListeners.pageshow();
assert.equal(lateBody.nodes.filter(n => n.id === 'kf317PreviewBlocked').length, 1, 'overlay installed once');
console.log('Recovery444: preview isolation smoke cases passed');
