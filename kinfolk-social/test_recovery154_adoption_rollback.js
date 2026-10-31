'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const src = fs.readFileSync(path.join(__dirname, 'kinfolk-phase95.js'), 'utf8');
// Include the write-version binding used by the production rollback closure.
const start = src.indexOf('let preferenceWriteVersion=0;');
const stop = src.indexOf('function unlock(', start);
assert.ok(start >= 0 && stop > start, 'saveStay source is present');
const saveStayCode = src.slice(start, stop);
const adoptionStart = src.indexOf('const restoreStay=saveStay(stay);');
const adoptionStop = src.indexOf('try{if(!currentLoginScreen())', adoptionStart);
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
const runCase = async ({ initialLocal = [], initialTab = [], stay, adoptFails = false, failKey, activeId = 'synthetic-user' }) => {
  const local = new Map(initialLocal), tab = new Map(initialTab);
  const saveStay = new Function('localStorage', 'sessionStorage', 'PREF1', 'PREF2', 'TAB', 'console',
    saveStayCode + ';return saveStay;')(
      makeStore(local, failKey), makeStore(tab), 'p1', 'p2', 'tab', { warn() {} });
  let attempts = 0;
  const adopt = async () => {
    attempts++;
    if (adoptFails) throw Error('simulated session adoption failure');
    return { user: { id: 'synthetic-user' }, access_token: 'synthetic-access' };
  };
  const perform = new Function('saveStay', 'adopt', 'verifyActiveLoginToken', 'clearFailedLoginSession', 'startingAccount', 'stay', 'tokens', 'console',
    'return (async () => {' + adoptionCode + ';return session})()');
  let error = null, session = null;
  try { session = await perform(saveStay, adopt, async session => { if (activeId !== session.user.id || session.access_token !== 'synthetic-access') throw Error('The active session changed during login. Please log in again.'); }, async () => {}, null, stay, {user:{id:'synthetic-user'}}, { warn() {} }); }
  catch (err) { error = err; }
  return { local, tab, attempts, error, session };
};
(async () => {
  let r = await runCase({ stay: false, adoptFails: true });
  assert.match(r.error?.message || '', /adoption failure/);
  assert.equal([...r.local.keys()].filter(key=>key!=='kinfolk_stay_login_write_owner_v1').length, 0, 'missing prior preference keys are removed on rollback');
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
  r = await runCase({ initialLocal: [['p1','1'],['p2','1']], stay: false, activeId: 'different-account' });
  assert.match(r.error?.message || '', /active session changed/i);
  assert.equal(r.local.get('p1'), '1', 'account switch restores original stay preference');
  assert.equal(r.local.get('p2'), '1');
  assert.equal(r.tab.has('tab'), false);
  console.log('Recovery154: adoption rollback, account-switch rollback and successful login preferences passed (synthetic)');
})().catch(error => { console.error(error); process.exitCode = 1; });
