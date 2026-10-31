import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Execute the effective production preference closure, not a reimplementation.
// Synthetic storage only: no Supabase calls or real account data.
const source=readFileSync(new URL('../kinfolk-phase95.js',import.meta.url),'utf8');
const start=source.indexOf('let preferenceWriteVersion=0;');
const end=source.indexOf('function unlock(pass)',start);
assert.ok(start>=0&&end>start,'Phase95 preference closure and state are present');
const production=source.slice(start,end);
function harness(){
  const local=new Map([['persist','0'],['legacy','0']]);
  const tab=new Map([['tab','1']]);
  const storage=map=>({
    getItem:key=>map.has(key)?map.get(key):null,
    setItem:(key,value)=>map.set(key,String(value)),
    removeItem:key=>map.delete(key)
  });
  const context={localStorage:storage(local),sessionStorage:storage(tab),console:{warn(){}}};
  vm.createContext(context);
  vm.runInContext("const PREF1='persist',PREF2='legacy',TAB='tab';"+production+';this.saveStay=saveStay;',context,{timeout:1000});
  return {context,local,tab};
}
test('a failed login rollback cannot replay over a later same-value choice from another tab',()=>{
  const h=harness();
  const rollback=h.context.saveStay(true);
  rollback();
  assert.equal(h.local.get('persist'),'0');
  assert.equal(h.tab.get('tab'),'1');
  // Another tab saves the same values the failed attempt originally wrote.
  // A second invocation of the old rollback must not undo that newer intent.
  h.local.set('persist','1');
  h.local.set('legacy','1');
  h.tab.delete('tab');
  rollback();
  assert.equal(h.local.get('persist'),'1');
  assert.equal(h.local.get('legacy'),'1');
  assert.equal(h.tab.has('tab'),false);
});
test('one-shot protection still permits the initial failed-login rollback',()=>{
  const h=harness();
  const rollback=h.context.saveStay(true);
  assert.equal(h.local.get('persist'),'1');
  rollback();
  assert.equal(h.local.get('persist'),'0');
  assert.equal(h.local.get('legacy'),'0');
  assert.equal(h.tab.get('tab'),'1');
});
test('changed preference before the first rollback is preserved',()=>{
  const h=harness();
  const rollback=h.context.saveStay(true);
  h.local.set('persist','0');
  h.local.set('legacy','0');
  h.tab.set('tab','1');
  rollback();
  assert.equal(h.local.get('persist'),'0');
  assert.equal(h.local.get('legacy'),'0');
  assert.equal(h.tab.get('tab'),'1');
});
