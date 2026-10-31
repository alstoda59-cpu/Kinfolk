'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('kinfolk-social/kinfolk-phase79.js', 'utf8');

function fixture(signupResult) {
  const writes = [], calls = [];
  let submit, message, sessionReads=0;
  const button = { disabled: false, textContent: 'Create account' };
  const fields = {
    '.kf73Title': { textContent: 'Create your Kinfolk' },
    '#kf73Name': { value: 'Kinfolk QA' },
    '#kf73Email': { value: 'authorized@example.test' },
    '#kf73Password': { value: 'testpass2026!' },
    '#kf79Birthdate': { value: '1990-01-01' },
    '#kf73Stay': { checked: true },
    '.kf73Primary': button,
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
  const sb = { auth: { async getSession() { return {data:{session:sessionReads++===0?null:(signupResult.data?.session||null)},error:null}; }, async signUp(args) { calls.push(args); return signupResult; } } };
  const context = {
    window: {}, document, sb, URL, Date,
    location: { origin: 'https://isolated-qa.supabase.co' },
    sessionStorage: {getItem(){return null},removeItem(){},setItem(){}},
    localStorage: { getItem(){return null},removeItem(){},setItem(key, value) { writes.push([key, value]); } },
    MutationObserver: class { observe() {} },
    setTimeout() { return 1; }, clearTimeout() {},
  };
  vm.runInNewContext(source, context);
  return {
    form, fields, button, writes, calls,
    async submit() {
      let prevented = false, stopped = false;
      await submit({
        target: form,
        preventDefault() { prevented = true; },
        stopImmediatePropagation() { stopped = true; },
      });
      assert.equal(prevented, true);
      assert.equal(stopped, true);
      return message?.textContent || '';
    },
  };
}

test('unconfirmed signup does not enable persistent login', async () => {
  const f = fixture({ data: { user: { id: 'new-user', email:'authorized@example.test', identities:[{provider:'email',user_id:'new-user',identity_data:{email:'authorized@example.test'}}] }, session: null }, error: null });
  const msg = await f.submit();
  assert.equal(f.calls.length, 1);
  assert.deepEqual(f.writes, []);
  assert.match(msg, /check your email/i);
  assert.equal(f.button.disabled, false);
});

test('signup with a real session honors Stay Logged In', async () => {
  const f = fixture({ data: { user: { id: 'new-user', email:'authorized@example.test', email_confirmed_at:'2026-10-30T00:00:00Z', identities:[{provider:'email',user_id:'new-user',identity_data:{email:'authorized@example.test'}}] }, session: { user: {id:'new-user',email:'authorized@example.test',email_confirmed_at:'2026-10-30T00:00:00Z'}, access_token: 'synthetic' } }, error: null });
  const msg = await f.submit();
  assert.equal(f.calls.length, 1);
  assert.equal(f.writes.length, 2);
  assert.ok(f.writes.every(([, value]) => value === '1'));
  assert.match(msg, /Opening Kinfolk/);
});

test('failed signup never persists login preference', async () => {
  const f = fixture({ data: null, error: { message: 'Synthetic signup error' } });
  const msg = await f.submit();
  assert.equal(f.writes.length, 0);
  assert.match(msg, /Synthetic signup error/);
});

test('underage signup does not reach the backend or change login preference', async () => {
  const f = fixture({ data: {}, error: null });
  f.fields['#kf79Birthdate'].value = '2020-01-01';
  const msg = await f.submit();
  assert.equal(f.calls.length, 0);
  assert.equal(f.writes.length, 0);
  assert.match(msg, /13 and older/);
});
