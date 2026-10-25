// Recovery177: synthetic login-form polling and validator cleanup regressions.
// Run from repo root: node --test kinfolk-social/tests/recovery177-login-form-mobile.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync('kinfolk-social/kinfolk-phase98.js', 'utf8');

function fixture(form = null) {
  const intervals = [], timeouts = [];
  let observerCallback, lookups = 0;
  const document = {
    documentElement: {}, visibilityState: 'visible',
    getElementById(id) { assert.equal(id, 'authForm'); lookups++; return form; },
  };
  vm.runInNewContext(source, {
    window: {}, document,
    MutationObserver: class {
      constructor(callback) { observerCallback = callback; }
      observe() {} disconnect() {}
    },
    setInterval(fn, ms) { intervals.push({ fn, ms }); return 1; },
    setTimeout(fn, ms) { timeouts.push({ fn, ms }); return timeouts.length; },
    clearTimeout() {}, console: { log() {} },
  });
  return { document, intervals, timeouts, observer: () => observerCallback(), get lookups() { return lookups; } };
}

test('foreground fallback runs every 2000ms, not 80ms', () => {
  const f = fixture();
  assert.equal(f.intervals.length, 1);
  assert.equal(f.intervals[0].ms, 2000);
});

test('hidden tab does not poll the login form', () => {
  const f = fixture();
  f.document.visibilityState = 'hidden';
  f.intervals[0].fn();
  assert.equal(f.lookups, 0);
});

test('foreground fallback still checks the login form', () => {
  const f = fixture();
  f.intervals[0].fn();
  assert.equal(f.lookups, 1);
});

test('MutationObserver still schedules prompt cleanup', () => {
  const f = fixture();
  f.observer();
  assert.ok(f.timeouts.some(x => x.ms === 8));
  assert.ok(f.timeouts.some(x => x.ms === 0));
  assert.ok(f.timeouts.some(x => x.ms === 150));
});

test('foreground cleanup preserves login submit and password handling', () => {
  const removed = [];
  const password = {
    dataset: { kf98: '1' },
    removeAttribute(name) { removed.push(name); },
    addEventListener() {},
  };
  const button = {};
  const form = {
    dataset: {}, __kf95Handler() {},
    querySelector(selector) {
      if (selector === '.kf73Title') return { textContent: 'Welcome back' };
      if (selector === '#kf73Password') return password;
      if (selector === '.kf73Primary') return button;
      return null;
    },
    querySelectorAll() { return []; },
  };
  const f = fixture(form);
  f.intervals[0].fn();
  assert.equal(button.type, 'button');
  assert.equal(typeof button.onclick, 'function');
  assert.equal(password.autocomplete, 'current-password');
  assert.deepEqual(removed, ['maxlength', 'minlength', 'pattern']);
  assert.equal(form.dataset.kf98, '1');
});
