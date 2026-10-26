'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const src = fs.readFileSync(path.join(__dirname, 'kinfolk-phase95.js'), 'utf8');
const start = src.indexOf('function saveStay(stay)');
const stop = src.indexOf('function unlock(', start);
assert.ok(start >= 0 && stop > start, 'saveStay source is present');
const saveStayCode = src.slice(start, stop);
const adoptionStart = src.indexOf('const restoreStay=saveStay(stay);');
const adoptionStop = src.indexOf('try{if(!form.isConnected', adoptionStart);
assert.ok(adoptionStart >= 0 && adoptionStop > adoptionStart, 'real login adoption guard is present');
const adoptionCode = src.slice(adoptionStart, adoptionStop);
const makeStore = (map, failKey) => ({
  getItem: key => map.has(key) ? map.get(key) : null,
  setItem: (key, value) => {
    if (key === failKey) throw Error('simulated blocked storage');
    map.set(key, String(value));
  },
  removeItem: key => map.delete(key)
});
const runCase = async ({ initialLocal = [], initialTab = [], stay, adoptFails = false, failKey }) => {
  const local = new Map(initialLocal), tab = new Map(initialTab);
  const saveStay = new Function('localStorage', 'sessionStorage', 'PREF1', 'PREF2', 'TAB', 'console',
    saveStayCode + ';return saveStay;')(
      makeStore(local, failKey), makeStore(tab), 'p1', 'p2', 'tab', { warn() {} });
  let attempts = 0;
  const adopt = async () => {
    attempts++;
    if (adoptFails) throw Error('simulated session adoption failure');
    return { user: { id: 'synthetic-user' } };
  };
  const perform = new Function('saveStay', 'adopt', 'currentAccountId', 'stay', 'tokens', 'console',
    'return (async () => {' + adoptionCode + ';return session})()');
  let error = null, session = null;
  try { session = await perform(saveStay, adopt, async () => 'synthetic-user', stay, {}, { warn() {} }); }
  catch (err) { error = err; }
  return { local, tab, attempts, error, session };
};
(async () => {
  let r = await runCase({ stay: false, adoptFails: true });
  assert.match(r.error?.message || '', /adoption failure/);
  assert.equal(r.local.size, 0, 'missing prior preference keys are removed on rollback');
  assert.equal(r.tab.size, 0, 'missing prior tab flag is removed on rollback');
  r = await runCase({ initialLocal: [['p1','1'],['p2','1']], stay: false, adoptFails: true });
  assert.equal(r.local.get('p1'), '1');
  assert.equal(r.local.get('p2'), '1');
  assert.equal(r.tab.has('tab'), false);
  r = await runCase({ stay: false });
  assert.equal(r.session?.user?.id, 'synthetic-user');
  assert.equal(r.local.get('p1'), '0');
  assert.equal(r.local.get('p2'), '0');
  assert.equal(r.tab.get('tab'), '1');
  r = await runCase({ initialLocal: [['p1','0'],['p2','0']], initialTab: [['tab','1']], stay: true });
  assert.equal(r.local.get('p1'), '1');
  assert.equal(r.local.get('p2'), '1');
  assert.equal(r.tab.has('tab'), false);
  r = await runCase({ initialLocal: [['p1','1'],['p2','1']], stay: false, failKey: 'p2' });
  assert.match(r.error?.message || '', /Unable to save your login preference/);
  assert.equal(r.attempts, 0, 'never adopt a session when preference storage fails');
  assert.equal(r.local.get('p1'), '1');
  assert.equal(r.local.get('p2'), '1');
  console.log('Recovery154: adoption failure rollback and successful login preferences passed (synthetic)');
})().catch(error => { console.error(error); process.exitCode = 1; });
