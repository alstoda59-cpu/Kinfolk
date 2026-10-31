'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('kinfolk-social/kinfolk-phase79.js', 'utf8');

function fixture({ stay = false, session = true, error = null } = {}) {
  const localWrites = [], tabWrites = [], calls = [];
  let submit, message, sessionReads=0;
  const fields = {
    '.kf73Title': { textContent: 'Create your Kinfolk' },
    '#kf73Name': { value: 'Synthetic QA' },
    '#kf73Email': { value: 'synthetic@example.test' },
    '#kf73Password': { value: 'testpass2026!' },
    '#kf79Birthdate': { value: '1990-01-01' },
    '#kf73Stay': { checked: stay },
    '.kf73Primary': { disabled: false, textContent: 'Create account' },
  };
  const form = {
    querySelectorAll() { return []; }, id: 'authForm', isConnected: true, dataset: { kf73: '1' },
    querySelector(selector) {
      return selector === '.kf73Msg' ? message || null : fields[selector] || null;
    },
    appendChild(element) { if(element.className==='kf73Msg') message = element; },
  };
  const document = {
    head: { appendChild() {} }, documentElement: {},
    createElement() { return { style: {}, setAttribute() {}, append() {}, remove() {} }; },
    addEventListener(type, fn, capture) {
      if (type === 'submit') { assert.equal(capture, true); submit = fn; }
    },
  };
  const sb = { auth: { async getSession() { return { data: { session: sessionReads++===0?null:(session ? { access_token:'synthetic-signup-token', user: { id: 'synthetic-user', email:'synthetic@example.test',email_confirmed_at:'2026-10-30T00:00:00Z' } } : null) }, error: null }; }, async signUp(args) {
    calls.push(args);
    return { data: { user: { id: 'synthetic-user', email:'synthetic@example.test',identities:[{provider:'email',user_id:'synthetic-user',identity_data:{email:'synthetic@example.test'}}],email_confirmed_at:'2026-10-30T00:00:00Z' },
      session: session ? { access_token:'synthetic-signup-token', user: { id: 'synthetic-user', email:'synthetic@example.test',email_confirmed_at:'2026-10-30T00:00:00Z' } } : null }, error };
  } } };
  const context = {
    window: {}, document, sb, URL, Date,
    location: { origin: 'https://isolated-qa.supabase.co' },
    localStorage: { getItem() { return null; }, removeItem() {}, setItem(key, value) { localWrites.push([key, value]); } },
    sessionStorage: {
      getItem() { return null; },
      setItem(key, value) { tabWrites.push(['set', key, value]); },
      removeItem(key) { tabWrites.push(['remove', key]); },
    },
    MutationObserver: class { observe() {} },
    setTimeout() { return 1; }, clearTimeout() {},
  };
  vm.runInNewContext(source, context);
  return {
    fields, localWrites, tabWrites, calls,
    async submit() {
      let prevented = false, stopped = false;
      await submit({ target: form,
        preventDefault() { prevented = true; },
        stopImmediatePropagation() { stopped = true; },
      });
      assert.equal(prevented, true);
      assert.equal(stopped, true);
      return message?.textContent || '';
    },
  };
}

test('immediate signup session with Stay Logged In off gets one-tab marker', async () => {
  const f = fixture({ stay: false });
  assert.match(await f.submit(), /Opening Kinfolk/);
  assert.deepEqual(f.localWrites, [
    ['kinfolk_stay_logged_in_v1', '0'], ['kinfolk_stay_logged_in', '0'],
  ]);
  assert.deepEqual(f.tabWrites, [['set', 'kinfolk_session_tab', '1']]);
});

test('immediate signup session with Stay Logged In on clears old one-tab marker', async () => {
  const f = fixture({ stay: true });
  assert.match(await f.submit(), /Opening Kinfolk/);
  assert.deepEqual(f.localWrites, [
    ['kinfolk_stay_logged_in_v1', '1'], ['kinfolk_stay_logged_in', '1'],
  ]);
  assert.deepEqual(f.tabWrites, [['remove', 'kinfolk_session_tab']]);
});

test('unconfirmed signup must not mutate session preferences', async () => {
  const f = fixture({ stay: false, session: false });
  assert.match(await f.submit(), /check your email/i);
  assert.equal(f.calls.length, 1);
  assert.deepEqual(f.localWrites, []);
  assert.deepEqual(f.tabWrites, []);
});

test('failed signup must not mutate session preferences', async () => {
  const f = fixture({ error: { message: 'Synthetic error' } });
  assert.match(await f.submit(), /Synthetic error/);
  assert.deepEqual(f.localWrites, []);
  assert.deepEqual(f.tabWrites, []);
});

test('underage signup cannot create a session or alter storage', async () => {
  const f = fixture();
  f.fields['#kf79Birthdate'].value = '2020-01-01';
  assert.match(await f.submit(), /13 and older/);
  assert.equal(f.calls.length, 0);
  assert.deepEqual(f.localWrites, []);
  assert.deepEqual(f.tabWrites, []);
});
