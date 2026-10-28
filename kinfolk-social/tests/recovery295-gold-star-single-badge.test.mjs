import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../kinfolk-phase76.js',import.meta.url),'utf8');
const start=source.indexOf('  async function goldStatus(uid)');
const end=source.indexOf('  let timer;',start);
assert.ok(start>=0&&end>start,'real Gold Star renderer is present');
const goldSource=source.slice(start,end);
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}};

function element(className=''){
 return {
  className,children:[],parentElement:null,attrs:{},textContent:'',disabled:false,
  appendChild(child){if(child.parentElement)child.remove();this.children.push(child);child.parentElement=this;return child},
  remove(){if(this.parentElement){this.parentElement.children=this.parentElement.children.filter(x=>x!==this);this.parentElement=null}},
  setAttribute(k,v){this.attrs[k]=v},
  querySelectorAll(selector){
   const wanted=selector.slice(1),out=[];
   function walk(node){for(const child of node.children){if(child.className===wanted)out.push(child);walk(child)}}
   walk(this);return out
  },
  querySelector(selector){
   if(selector==='h1,h2,.name,.profileName')return this.children.find(x=>x.className==='profileName')||null;
   return this.querySelectorAll(selector)[0]||null
  }
 };
}
function harness({owner=false,profileId='synthetic-B',rpc}={}){
 const root=element('root'),hero=element('profileHero'),name=element('profileName');
 root.appendChild(hero);hero.appendChild(name);
 const state={view:'profile',user:{id:'synthetic-A',app_metadata:owner?{kinfolk_role:'owner'}:{}},profileViewId:profileId};
 const calls=[],toasts=[];
 const context={
  window:{state,toast:(...args)=>toasts.push(args)},
  document:{querySelector:s=>s==='.profileHero'?hero:null,createElement:()=>element()},
  sb:{rpc:async(fn,args)=>{calls.push({fn,args});return rpc?rpc(fn,args):{data:true,error:null}}},
  console:{warn:()=>{}}
 };
 vm.runInNewContext(goldSource+';globalThis.mount=mountGold;',context);
 return {root,hero,name,state,calls,toasts,mount:()=>context.mount(),element};
}
test('two concurrent status lookups create exactly one star beside the name',async()=>{
 const a=deferred(),b=deferred(),queue=[a,b],h=harness({rpc:()=>queue.shift().promise});
 const first=h.mount(),second=h.mount();
 a.resolve({data:true,error:null});b.resolve({data:true,error:null});
 await Promise.all([first,second]);
 const badges=h.hero.querySelectorAll('.kf75Gold');
 assert.equal(badges.length,1);
 assert.equal(badges[0].textContent,'★');
 assert.equal(badges[0].parentElement,h.name);
 assert.equal(badges[0].attrs['aria-label'],'Gold Star subscriber');
});
test('concurrent status lookup cannot append a star to a different profile',async()=>{
 const pending=deferred(),h=harness({rpc:()=>pending.promise});
 const op=h.mount();h.state.profileViewId='synthetic-C';
 pending.resolve({data:true,error:null});await op;
 assert.equal(h.hero.querySelectorAll('.kf75Gold').length,0);
});
test('preexisting duplicate badges collapse to one',async()=>{
 const h=harness();
 for(let i=0;i<4;i++){const b=h.element('kf75Gold');h.name.appendChild(b)}
 await h.mount();
 assert.equal(h.hero.querySelectorAll('.kf75Gold').length,1);
});
test('ordinary accounts cannot see Gift Gold Star action',async()=>{
 const h=harness({rpc:async()=>({data:false,error:null})});
 await h.mount();
 assert.equal(h.root.querySelectorAll('.kf75Grant').length,0);
});
test('owner gifting targets the displayed profile through server RPC',async()=>{
 let granted=false;
 const h=harness({owner:true,rpc:async(fn,args)=>fn==='has_gold_star'?{data:granted,error:null}:(granted=true,{data:true,error:null})});
 await h.mount();
 const button=h.root.querySelector('.kf75Grant');
 assert.ok(button);
 await button.onclick();
 assert.ok(h.calls.some(x=>x.fn==='grant_gold_star'&&x.args.target_user==='synthetic-B'));
 assert.equal(h.toasts[0][0],'Gold Star granted.');
});
test('malformed truthy status cannot grant a subscriber badge',async()=>{
 const h=harness({rpc:async()=>({data:'false',error:null})});
 await h.mount();
 assert.equal(h.hero.querySelectorAll('.kf75Gold').length,0);
});
