import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const script=await readFile(new URL('../kinfolk-preview-isolation.js',import.meta.url),'utf8');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');

function run(hostname,readyState='loading'){
  const headNodes=[],bodyNodes=[],events=new Map();
  function element(tag){
    return {
      tag,attributes:{},children:[],style:{},textContent:'',id:'',
      setAttribute(name,value){this.attributes[name]=value},
      append(...nodes){this.children.push(...nodes)},
      appendChild(node){this.children.push(node)}
    };
  }
  const body={style:{},appendChild(node){bodyNodes.push(node)}};
  const document={
    head:{prepend(node){headNodes.unshift(node)}},body,readyState,
    createElement:element,
    getElementById(id){return bodyNodes.find(node=>node.id===id)||null},
    addEventListener(name,callback,options){
      const list=events.get(name)||[];list.push({callback,options});events.set(name,list);
    }
  };
  const window={location:{hostname}};
  const context=vm.createContext({window,document});
  vm.runInContext(script,context,{filename:'kinfolk-preview-isolation.js'});
  return {window,document,headNodes,bodyNodes,events,context,fire(name,event={}){
    for(const listener of events.get(name)||[])listener.callback(event);
  }};
}

test('Vercel preview installs network and media deny policy before app startup',()=>{
  const page=run('kinfolk-social-demo-123.vercel.app');
  assert.equal(page.window.__kinfolkPreviewBackendBlocked,true);
  assert.equal(page.headNodes.length,1);
  const policy=page.headNodes[0];
  assert.equal(policy.attributes['http-equiv'],'Content-Security-Policy');
  assert.match(policy.attributes.content,/connect-src 'self';/);
  assert.match(policy.attributes.content,/img-src 'self' data: blob:/);
  assert.match(policy.attributes.content,/media-src 'self' blob:/);
  assert.match(policy.attributes.content,/form-action 'none'/);
  assert.doesNotMatch(policy.attributes.content,/supabase\.co/);
});

test('production custom domain, Capacitor localhost and local development stay untouched',()=>{
  for(const hostname of ['kinfolk.social','www.kinfolk.social','localhost','127.0.0.1','app.example.org']){
    const page=run(hostname);
    assert.equal(page.window.__kinfolkPreviewBackendBlocked,undefined,hostname);
    assert.equal(page.headNodes.length,0,hostname);
    assert.equal(page.events.size,0,hostname);
  }
});

test('lookalike domains cannot trigger the preview-only restriction',()=>{
  for(const hostname of ['vercel.app.attacker.invalid','notvercel.app','vercel.app.example.com']){
    assert.equal(run(hostname).headNodes.length,0,hostname);
  }
});

test('blocked preview renders an accessible dark overlay and prevents duplicate overlays',()=>{
  const page=run('preview.vercel.app');
  assert.equal(page.bodyNodes.length,0);
  page.fire('DOMContentLoaded');
  assert.equal(page.bodyNodes.length,1);
  const overlay=page.bodyNodes[0];
  assert.equal(overlay.id,'kf317PreviewBlocked');
  assert.equal(overlay.attributes.role,'alert');
  assert.match(overlay.children[0].children[0].textContent,/preview is paused/);
  assert.match(overlay.children[0].children[1].textContent,/shared live Kinfolk backend/);
  assert.equal(page.document.body.style.overflow,'hidden');
  page.fire('DOMContentLoaded');
  assert.equal(page.bodyNodes.length,1);
});

test('blocked preview suppresses form submits before legacy signup handlers',()=>{
  const page=run('preview.vercel.app');
  const submit=page.events.get('submit');
  assert.equal(submit.length,1);
  assert.equal(submit[0].options,true);
  let prevented=0,stopped=0;
  page.fire('submit',{preventDefault(){prevented++},stopImmediatePropagation(){stopped++}});
  assert.equal(prevented,1);
  assert.equal(stopped,1);
});

test('guard is idempotent if the same script executes twice',()=>{
  const page=run('preview.vercel.app');
  vm.runInContext(script,page.context);
  assert.equal(page.headNodes.length,1);
  assert.equal(page.events.get('submit').length,1);
});

test('guard precedes remote SDK and Supabase client creation in the main app',()=>{
  const guard=html.indexOf('<script src="/kinfolk-preview-isolation.js"></script>');
  const sdk=html.indexOf('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
  const client=html.indexOf('const sb=window.supabase.createClient');
  assert.ok(guard>=0&&guard<sdk&&sdk<client);
  assert.match(html,/const SB_URL='https:\/\/zojajuzmfjpvubzibzgg\.supabase\.co'/);
});
