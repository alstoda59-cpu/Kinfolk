'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const html=fs.readFileSync('kinfolk-social/index.html','utf8');
const marker='<script id="kinfolk-auth-sdk-recovery">';
const start=html.indexOf(marker);
const end=html.indexOf('</script>',start);
assert.ok(start>=0&&end>start,'startup recovery must be present in the main app');
const source=html.slice(start+marker.length,end);
function fixture({sdk=false,loading=true}={}){
  const nodes=[],handlers={};let reloads=0;
  const createElement=tag=>({
    tag,id:'',style:{},attributes:{},children:[],listeners:{},textContent:'',
    setAttribute(k,v){this.attributes[k]=v},
    addEventListener(k,fn){this.listeners[k]=fn},
    appendChild(node){this.children.push(node);node.parent=this},
    append(...list){list.forEach(node=>this.appendChild(node))}
  });
  const body={appendChild:node=>nodes.push(node)};
  const document={
    readyState:loading?'loading':'complete',body,
    getElementById:id=>nodes.find(n=>n.id===id)||null,
    createElement,addEventListener(k,fn){handlers[k]=fn}
  };
  const window={location:{reload:()=>{reloads++}},...(sdk?{supabase:{createClient(){}}}:{})};
  vm.runInNewContext(source,{window,document},{filename:'kinfolk-auth-sdk-recovery'});
  return {nodes,window,document,handlers,get reloads(){return reloads}};
}
test('offline SDK failure shows an accessible responsive recovery screen on DOM ready',()=>{
  const f=fixture();
  assert.equal(f.nodes.length,0,'do not modify the head during initial parse');
  f.handlers.DOMContentLoaded();
  assert.equal(f.nodes.length,1);
  const pane=f.nodes[0],wrap=pane.children[0];
  assert.equal(pane.id,'kf225AuthRecovery');
  assert.equal(pane.attributes.role,'alert');
  assert.match(pane.style.cssText,/safe-area-inset-bottom/);
  assert.ok(wrap.children.some(n=>n.tag==='h1'));
  assert.ok(wrap.children.some(n=>/not been changed/.test(n.textContent)));
  const retry=wrap.children.find(n=>n.tag==='button');
  assert.equal(retry.textContent,'Try again');
  retry.listeners.click();
  assert.equal(f.reloads,1,'retry must reload rather than changing user session');
  f.handlers.DOMContentLoaded();
  assert.equal(f.nodes.length,1,'do not duplicate recovery UI');
});
test('healthy SDK does not cover login with recovery screen',()=>{
  const f=fixture({sdk:true});
  assert.equal(f.nodes.length,0);
  assert.equal(f.handlers.DOMContentLoaded,undefined);
});
test('SDK restored before DOM ready suppresses failure screen',()=>{
  const f=fixture();
  f.window.supabase={createClient(){}};
  f.handlers.DOMContentLoaded();
  assert.equal(f.nodes.length,0);
});
test('late executing recovery script displays UI immediately when document already loaded',()=>{
  const f=fixture({loading:false});
  assert.equal(f.nodes.length,1);
});
test('startup recovery executes before the inline app references SDK',()=>{
  const recovery=html.indexOf(marker);
  const app=html.indexOf('const sb=window.supabase.createClient');
  assert.ok(recovery>=0&&app>recovery);
});
