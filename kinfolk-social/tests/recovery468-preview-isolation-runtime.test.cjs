// Recovery468: execute the actual preview isolation script in a synthetic DOM.
// No Supabase calls, credentials, network, or real accounts are used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'kinfolk-preview-isolation.js'), 'utf8');

function harness(hostname, bodyReady = true) {
  const listeners = new Map();
  const windowListeners = new Map();
  const nodes = new Map();
  const inserted = [];
  const element = tag => {
    const node = {
      tag, attributes: {}, children: [], style: {}, textContent: '',
      setAttribute(k,v){this.attributes[k]=v; if(k==='id')this.id=v;},
      append(...children){this.children.push(...children);},
      appendChild(child){this.children.push(child);}
    };
    Object.defineProperty(node,'id',{get(){return this.attributes.id;},set(v){this.attributes.id=v;nodes.set(v,this);}});
    return node;
  };
  const body = bodyReady ? element('body') : null;
  const document = {
    body, readyState: bodyReady ? 'complete' : 'loading',
    head: {prepend(node){inserted.push(node);}},
    createElement: element,
    getElementById(id){return nodes.get(id)||null;},
    addEventListener(name,callback){listeners.set(name,callback);}
  };
  const window = {
    location:{hostname},
    fetch(){return Promise.resolve('unsafe');},
    XMLHttpRequest:function OriginalXHR(){},
    WebSocket:function OriginalSocket(){},
    EventSource:function OriginalEvents(){},
    Worker:function OriginalWorker(){},
    SharedWorker:function OriginalSharedWorker(){},
    RTCPeerConnection:function OriginalRTC(){},
    WebTransport:function OriginalWebTransport(){},
    WebSocketStream:function OriginalWebSocketStream(){},
    navigator:{sendBeacon(){return true;},serviceWorker:{register(){return Promise.resolve('unsafe');}}},
    addEventListener(name,callback){windowListeners.set(name,callback);}
  };
  class MutationObserver {
    constructor(callback){this.callback=callback;}
    observe(){window.observer=this;}
    disconnect(){this.disconnected=true;}
  }
  vm.runInNewContext(source,{window,document,MutationObserver},{timeout:1000});
  return {window,document,inserted,listeners,windowListeners,nodes,element};
}
const preview=harness('kinfolk-social-demo-123.vercel.app');
assert.equal(preview.window.__kinfolkPreviewBackendBlocked,true);
assert.equal(preview.inserted.length,1,'preview CSP installed before SDK');
const policy=preview.inserted[0].attributes.content;
assert.match(policy,/connect-src 'none'/);
assert.match(policy,/form-action 'none'/);
assert.match(policy,/frame-src 'none'/);
assert.equal(preview.nodes.has('kf317PreviewBlocked'),true);
assert.equal(preview.document.body.style.overflow,'hidden');
let canceled=0;
preview.listeners.get('submit')({
  preventDefault(){canceled++;},
  stopImmediatePropagation(){canceled++;}
});
assert.equal(canceled,2,'all preview form submissions intercepted');
const native=harness('localhost');
assert.equal(native.window.__kinfolkPreviewBackendBlocked,undefined);
assert.equal(native.inserted.length,0,'native host must not inherit preview CSP');
assert.equal(native.nodes.size,0,'native host has no preview overlay');
const custom=harness('kinfolk.example.com');
assert.equal(custom.inserted.length,0,'custom domain is unaffected');
const spoof=harness('vercel.app.evil.example');
assert.equal(spoof.inserted.length,0,'suffix spoofing cannot trigger preview mode');
const delayed=harness('test.vercel.app',false);
assert.equal(delayed.inserted.length,1,'CSP applies before body exists');
assert.equal(delayed.nodes.size,0);
delayed.document.body=delayed.element('body');
delayed.listeners.get('DOMContentLoaded')();
assert.equal(delayed.nodes.has('kf317PreviewBlocked'),true);
delayed.windowListeners.get('pageshow')();
assert.equal(delayed.document.body.children.length,1,'overlay mounts once');
console.log('Recovery468: synthetic preview isolation runtime scenarios passed');


// Recovery470: fail CI if the isolation guard is removed, deferred, or moved
// behind an external SDK / app bootstrap. This checks shipped HTML, not mocks.
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function assertSafeBootstrap(markup){
  const head=markup.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i)?.[1];
  assert.ok(head,'HTML head must exist');
  const scripts=[...head.matchAll(/<script\b([^>]*)>/gi)];
  assert.ok(scripts.length>=2,'guard and auth SDK must both be present');
  const first=scripts[0][1];
  assert.match(first,/\bsrc\s*=\s*["']\/kinfolk-preview-isolation\.js["']/i,
    'preview guard must be the first head script');
  assert.doesNotMatch(first,/\b(?:async|defer|type\s*=\s*["']module["'])\b/i,
    'preview guard must execute synchronously');
  const sdk=scripts.findIndex((s,i)=>i>0&&/supabase-js/i.test(s[1]));
  assert.ok(sdk>0,'Supabase SDK must follow the guard');
  const guardCount=(markup.match(/<script\b[^>]*\bsrc\s*=\s*["']\/kinfolk-preview-isolation\.js["']/gi)||[]).length;
  assert.equal(guardCount,1,'exactly one guard bootstrap is allowed');
}
assertSafeBootstrap(html);
assert.throws(()=>assertSafeBootstrap(html.replace(
  '<script src="/kinfolk-preview-isolation.js"></script>',''
)),/first head script/);
assert.throws(()=>assertSafeBootstrap(html.replace(
  '<script src="/kinfolk-preview-isolation.js"></script>',
  '<script defer src="/kinfolk-preview-isolation.js"></script>'
)),/synchronously/);
assert.throws(()=>assertSafeBootstrap(html.replace(
  '<script src="/kinfolk-preview-isolation.js"></script>',
  '<script async src="/kinfolk-preview-isolation.js"></script>'
)),/synchronously/);
assert.throws(()=>assertSafeBootstrap(html.replace(
  '<script src="/kinfolk-preview-isolation.js"></script>',
  '<script src="/kinfolk-preview-isolation.js"></script><script src="/kinfolk-preview-isolation.js"></script>'
)),/exactly one/);
console.log('Recovery470: preview bootstrap order and mutation regressions passed');


// Recovery471: hostname normalization and delayed WebView mutation coverage.
// These exercise the shipped guard, not a reimplementation.
for (const host of ['VERCEL.APP', 'Preview.Vercel.App.', 'preview.vercel.app..']) {
  const instance=harness(host);
  assert.equal(instance.window.__kinfolkPreviewBackendBlocked,true,
    'Vercel hostname case/trailing-dot normalization: '+host);
  assert.match(instance.inserted[0].attributes.content,/connect-src 'none'/);
}
for (const host of ['notvercel.app', 'vercel.app.attacker.invalid', 'localhost', '127.0.0.1']) {
  const instance=harness(host);
  assert.equal(instance.inserted.length,0,'non-Vercel host exempt: '+host);
}
const webview=harness('preview.vercel.app',false);
assert.ok(webview.window.observer,'delayed WebView must register DOM observer');
webview.document.body=webview.element('body');
webview.window.observer.callback();
assert.equal(webview.nodes.has('kf317PreviewBlocked'),true);
assert.equal(webview.window.observer.disconnected,true,'observer must disconnect after mount');
console.log('Recovery471: hostname and delayed WebView scenarios passed');

// Recovery472: the shipped guard must also deny network APIs in WebViews
// that fail to enforce a dynamically inserted CSP. Native hosts are exempt.
const apiPreview=harness('mobile-preview.vercel.app');
assert.throws(()=>new apiPreview.window.XMLHttpRequest(),/network access is disabled/);
assert.throws(()=>new apiPreview.window.WebSocket('wss:\/\/example.invalid'),/network access is disabled/);
assert.throws(()=>new apiPreview.window.EventSource('https:\/\/example.invalid'),/network access is disabled/);
assert.equal(apiPreview.window.navigator.sendBeacon('https:\/\/example.invalid','x'),false);
assert.equal(native.window.navigator.sendBeacon('https:\/\/example.invalid','x'),true);
assert.equal(native.window.fetch().constructor,Promise);
apiPreview.window.fetch('https:\/\/example.invalid').then(
  ()=>{throw new Error('preview fetch unexpectedly succeeded');},
  error=>assert.match(error.message,/network access is disabled/)
).then(()=>console.log('Recovery472: WebView network API fallback scenarios passed'));

// Recovery473: worker/WebRTC creation and service-worker registration are
// denied only for Vercel previews, leaving native Capacitor unaffected.
const workerPreview=harness('mobile-preview.vercel.app');
for(const api of ['Worker','SharedWorker','RTCPeerConnection']){
  assert.throws(()=>new workerPreview.window[api]('unsafe'),/network access is disabled/,api);
  assert.doesNotThrow(()=>new native.window[api]('safe'),api+' native exemption');
}
assert.equal(native.window.navigator.serviceWorker.register().constructor,Promise);
workerPreview.window.navigator.serviceWorker.register('/unsafe.js').then(
  ()=>{throw new Error('preview service worker registration unexpectedly succeeded');},
  error=>assert.match(error.message,/network access is disabled/)
).then(()=>console.log('Recovery473: worker, WebRTC and service worker isolation passed'));

// Recovery474: modern transport constructors must not bypass preview isolation.
for(const api of ['WebTransport','WebSocketStream']){
  assert.throws(()=>new workerPreview.window[api]('https://example.invalid'),/network access is disabled/,api);
  assert.doesNotThrow(()=>new native.window[api]('https://example.invalid'),api+' native exemption');
  assert.doesNotThrow(()=>new custom.window[api]('https://example.invalid'),api+' custom-domain exemption');
}
console.log('Recovery474: transport API isolation scenarios passed');
