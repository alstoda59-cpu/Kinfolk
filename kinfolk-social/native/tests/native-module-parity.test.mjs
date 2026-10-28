import test from 'node:test';
import assert from 'node:assert/strict';
import { assertNativeModuleParity } from '../scripts/native-module-parity.mjs';
const names=Array.from({length:23},(_,i)=>'/kinfolk-module'+i+'.js');
const html=items=>items.map(x=>'<script src="'+x+'"></script>').join('');
test('preserves all 23 modules in source order with local SDK',()=>{
  assert.equal(assertNativeModuleParity(html(names),html(['/kinfolk-supabase-sdk.js',...names])),23);
});
test('rejects missing modules even when minimum count is met',()=>{
  assert.throws(()=>assertNativeModuleParity(html(names),html(names.slice(1))),/preserve every main-app module/);
});
test('rejects reordered modules',()=>{
  assert.throws(()=>assertNativeModuleParity(html(names),html([...names].reverse())),/preserve every main-app module/);
});
test('rejects duplicate packaged module',()=>{
  assert.throws(()=>assertNativeModuleParity(html(names),html([...names,names[0]])),/duplicate packaged module/);
});
test('rejects duplicate source module',()=>{
  assert.throws(()=>assertNativeModuleParity(html([...names,names[0]]),html(names)),/duplicate main app module/);
});

test('detects modules when src follows defer and data-src attributes',()=>{
  const source=names.map(n=>'<script defer data-src="https://invalid.test/fake.js" src="'+n+'"></script>').join('');
  assert.equal(assertNativeModuleParity(source,html(names)),23);
});
test('rejects missing module even when source uses non-leading src attribute',()=>{
  const source=names.map(n=>'<script async src="'+n+'"></script>').join('');
  assert.throws(()=>assertNativeModuleParity(source,html(names.slice(1))),/preserve every main-app module/);
});
test('does not count a fake data-src module as a real script',()=>{
  const source=html(names)+'<script data-src="/kinfolk-fake.js"></script>';
  assert.equal(assertNativeModuleParity(source,html(names)),23);
});

test('rejects query-string Kinfolk module in source instead of silently dropping it',()=>{
  assert.throws(()=>assertNativeModuleParity(html([...names,'/kinfolk-extra.js?v=1']),html(names)),/invalid Kinfolk app module script path/);
});
test('rejects malformed Kinfolk module in packaged startup scripts',()=>{
  assert.throws(()=>assertNativeModuleParity(html(names),html([...names,'/kinfolk-extra.mjs'])),/invalid Kinfolk app module script path/);
});
