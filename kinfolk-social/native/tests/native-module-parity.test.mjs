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
