import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Source-executed synthetic cross-tab regressions. No real accounts or backend.
const source=readFileSync(new URL('../kinfolk-phase95.js',import.meta.url),'utf8');
const start=source.indexOf('let preferenceWriteVersion=0;');
const end=source.indexOf('function unlock(pass)',start);
assert.ok(start>=0&&end>start,'effective preference closure exists');
const production=source.slice(start,end);
const OWNER='kinfolk_stay_login_write_owner_v1';
function sharedStorage(){
  const values=new Map([['persist','0'],['legacy','0']]);
  let failKey=null;
  const storage={
    getItem:key=>values.has(key)?values.get(key):null,
    setItem(key,value){if(key===failKey){failKey=null;throw new Error('synthetic write failure')}values.set(key,String(value))},
    removeItem:key=>values.delete(key),
    failNext:key=>{failKey=key}
  };
  return {values,storage};
}
function tab(shared){
  const tabValues=new Map([['tab','1']]);
  const sessionStorage={
    getItem:key=>tabValues.has(key)?tabValues.get(key):null,
    setItem:(key,value)=>tabValues.set(key,String(value)),
    removeItem:key=>tabValues.delete(key)
  };
  const context={localStorage:shared.storage,sessionStorage,console:{warn(){}}};
  vm.createContext(context);
  vm.runInContext("const PREF1='persist',PREF2='legacy',TAB='tab';"+production+';this.saveStay=saveStay;',context,{timeout:1000});
  return {save:stay=>context.saveStay(stay),tabValues};
}
test('a second tab saving identical preferences invalidates the first tab rollback',()=>{
  const shared=sharedStorage(),a=tab(shared),b=tab(shared);
  const old=a.save(true),firstOwner=shared.values.get(OWNER);
  const newer=b.save(true);
  assert.notEqual(shared.values.get(OWNER),firstOwner);
  old();
  assert.equal(shared.values.get('persist'),'1');
  assert.equal(shared.values.get('legacy'),'1');
  assert.notEqual(shared.values.get(OWNER),firstOwner);
  newer();
  assert.equal(shared.values.get('persist'),'1');
  assert.equal(shared.values.get('legacy'),'1');
});
test('an older tab cannot overwrite a newer opposite login preference',()=>{
  const shared=sharedStorage(),a=tab(shared),b=tab(shared);
  const old=a.save(true);
  b.save(false);
  const owner=shared.values.get(OWNER);
  old();
  assert.equal(shared.values.get('persist'),'0');
  assert.equal(shared.values.get('legacy'),'0');
  assert.equal(shared.values.get(OWNER),owner);
});
test('a legitimate first rollback restores preferences and invalidates its marker',()=>{
  const shared=sharedStorage(),a=tab(shared);
  const rollback=a.save(true),owner=shared.values.get(OWNER);
  rollback();
  assert.equal(shared.values.get('persist'),'0');
  assert.equal(shared.values.get('legacy'),'0');
  assert.equal(a.tabValues.get('tab'),'1');
  assert.notEqual(shared.values.get(OWNER),owner);
});
test('a rollback never resurrects an earlier tab ownership marker',()=>{
  const shared=sharedStorage(),a=tab(shared),b=tab(shared);
  const old=a.save(true),firstOwner=shared.values.get(OWNER);
  const newer=b.save(true);
  newer();
  assert.notEqual(shared.values.get(OWNER),firstOwner);
  old();
  assert.equal(shared.values.get('persist'),'1');
});
test('partial storage failure restores preferences and leaves stale owner invalidated',()=>{
  const shared=sharedStorage(),a=tab(shared);
  shared.storage.failNext('legacy');
  assert.throws(()=>a.save(true),/Unable to save your login preference/);
  assert.equal(shared.values.get('persist'),'0');
  assert.equal(shared.values.get('legacy'),'0');
  assert.equal(a.tabValues.get('tab'),'1');
  assert.match(shared.values.get(OWNER),/rolled-back$/);
});
