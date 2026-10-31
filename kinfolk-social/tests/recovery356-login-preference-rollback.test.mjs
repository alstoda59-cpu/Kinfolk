import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Execute the real Phase95 saveStay closure, including its rollback policy.
const source=readFileSync(new URL('../kinfolk-phase95.js',import.meta.url),'utf8');
const start=source.indexOf('// Recovery356: a failed older login');
const end=source.indexOf('function unlock(pass)',start);
assert.ok(start>0&&end>start,'effective Phase95 preference handler exists');
const snippet=source.slice(start,end);
function storage(initial={}){
  const values=new Map(Object.entries(initial));
  let failKey=null;
  return {
    getItem:key=>values.has(key)?values.get(key):null,
    setItem(key,value){if(key===failKey){failKey=null;throw new Error('synthetic storage failure')}values.set(key,String(value))},
    removeItem:key=>values.delete(key),
    failNext:key=>{failKey=key},
    snapshot:()=>Object.fromEntries(values)
  };
}
function harness(localInitial={},sessionInitial={}){
  const localStorage=storage(localInitial),sessionStorage=storage(sessionInitial);
  const ctx={localStorage,sessionStorage,console:{warn:()=>{}}};
  vm.createContext(ctx);
  vm.runInContext("const PREF1='persist';const PREF2='legacy';const TAB='tab';"+snippet+';this.saveStay=saveStay;',ctx,{timeout:1000});
  return {ctx,localStorage,sessionStorage};
}
test('unchanged successful login preference can be rolled back after failed activation',()=>{
  const h=harness({persist:'0',legacy:'0'},{tab:'1'});
  const rollback=h.ctx.saveStay(true);
  assert.deepEqual(h.localStorage.snapshot(),{persist:'1',legacy:'1'});
  assert.deepEqual(h.sessionStorage.snapshot(),{});
  rollback();
  assert.deepEqual(h.localStorage.snapshot(),{persist:'0',legacy:'0'});
  assert.deepEqual(h.sessionStorage.snapshot(),{tab:'1'});
});
test('same-value newer save cannot be reverted by an older login rollback',()=>{
  const h=harness({persist:'0',legacy:'0'},{tab:'1'});
  const oldRollback=h.ctx.saveStay(true);
  h.ctx.saveStay(true);
  oldRollback();
  assert.deepEqual(h.localStorage.snapshot(),{persist:'1',legacy:'1'});
  assert.deepEqual(h.sessionStorage.snapshot(),{});
});
test('another login changing persistent preference is not overwritten by stale rollback',()=>{
  const h=harness({persist:'1',legacy:'1'});
  const oldRollback=h.ctx.saveStay(true);
  h.localStorage.setItem('persist','0');
  h.localStorage.setItem('legacy','0');
  h.sessionStorage.setItem('tab','1');
  oldRollback();
  assert.deepEqual(h.localStorage.snapshot(),{persist:'0',legacy:'0'});
  assert.deepEqual(h.sessionStorage.snapshot(),{tab:'1'});
});
test('changed session-tab marker blocks stale rollback',()=>{
  const h=harness({persist:'0',legacy:'0'},{tab:'1'});
  const oldRollback=h.ctx.saveStay(true);
  h.sessionStorage.setItem('tab','new-session');
  oldRollback();
  assert.deepEqual(h.localStorage.snapshot(),{persist:'1',legacy:'1'});
  assert.deepEqual(h.sessionStorage.snapshot(),{tab:'new-session'});
});
test('a failed partial storage write still force-restores original preferences',()=>{
  const h=harness({persist:'0',legacy:'0'},{tab:'1'});
  h.localStorage.failNext('legacy');
  assert.throws(()=>h.ctx.saveStay(true),/Unable to save your login preference/);
  assert.deepEqual(h.localStorage.snapshot(),{persist:'0',legacy:'0'});
  assert.deepEqual(h.sessionStorage.snapshot(),{tab:'1'});
});
test('rollback restores missing original keys rather than writing string null',()=>{
  const h=harness();
  const rollback=h.ctx.saveStay(false);
  assert.deepEqual(h.localStorage.snapshot(),{persist:'0',legacy:'0'});
  assert.deepEqual(h.sessionStorage.snapshot(),{tab:'1'});
  rollback();
  assert.deepEqual(h.localStorage.snapshot(),{});
  assert.deepEqual(h.sessionStorage.snapshot(),{});
});
test('newer Stay Logged In false preference remains after stale true rollback',()=>{
  const h=harness({persist:'0',legacy:'0'},{tab:'1'});
  const oldRollback=h.ctx.saveStay(true);
  const newRollback=h.ctx.saveStay(false);
  oldRollback();
  assert.deepEqual(h.localStorage.snapshot(),{persist:'0',legacy:'0'});
  assert.deepEqual(h.sessionStorage.snapshot(),{tab:'1'});
  newRollback();
  assert.deepEqual(h.localStorage.snapshot(),{persist:'1',legacy:'1'});
  assert.deepEqual(h.sessionStorage.snapshot(),{});
});
