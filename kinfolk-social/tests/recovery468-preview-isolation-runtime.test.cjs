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
