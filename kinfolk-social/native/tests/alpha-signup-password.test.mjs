// Regression: Phase95 must never shrink Phase79's 12-128 character signup password field.
// Executes the real app script in an isolated DOM harness, without network or accounts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const loginGuard = readFileSync(new URL('../../kinfolk-phase95.js', import.meta.url), 'utf8');
const signup = readFileSync(new URL('../../kinfolk-phase79.js', import.meta.url), 'utf8');

function mount(mode = 'signup') {
  const title = { textContent: mode === 'signup' ? 'Create your Kinfolk account' : 'Welcome back' };
  const password = {
    minLength: 0, maxLength: 0, autocomplete: '',
    removeAttribute(name) {
      if (name === 'minlength') this.minLength = 0;
      if (name === 'maxlength') this.maxLength = 0;
    }
  };
  const form = {
    querySelector(selector) {
      if (selector === '.kf73Title') return title;
      if (selector === '#kf73Password' || selector === 'input[type="password"]') return password;
      return null;
    },
    addEventListener() {}
  };
  const document = {
    querySelector: () => form,
    getElementById: () => null,
    documentElement: {},
    visibilityState: 'visible'
  };
  let interval;
  vm.runInNewContext(loginGuard, {
    window: {},
    document,
    MutationObserver: class { observe() {} },
    setInterval: callback => { interval = callback; return 1; },
    setTimeout: callback => { callback(); return 1; },
    clearTimeout() {},
    console: { log() {}, warn() {} }
  }, { timeout: 2000 });
  return {
    password,
    change(nextMode) {
      title.textContent = nextMode === 'signup' ? 'Create your Kinfolk account' : 'Welcome back';
      interval();
    }
  };
}

test('signup password accepts 12 through 128 characters in the actual Phase95 binder', () => {
  const { password } = mount();
  assert.equal(password.minLength, 12);
  assert.equal(password.maxLength, 128);
  assert.equal(password.autocomplete, 'new-password');
});

test('login does not impose signup password limits', () => {
  const { password } = mount('login');
  assert.equal(password.minLength, 0);
  assert.equal(password.maxLength, 0);
  assert.equal(password.autocomplete, 'current-password');
});

test('reused login to signup to login form restores correct limits each time', () => {
  const { password, change } = mount('login');
  change('signup');
  assert.equal(password.minLength, 12);
  assert.equal(password.maxLength, 128);
  change('login');
  assert.equal(password.maxLength, 0);
  change('signup');
  assert.equal(password.minLength, 12);
  assert.equal(password.maxLength, 128);
});

test('Phase79 validation and confirmation input use the same password bounds', () => {
  assert.match(signup, /password\.length<12\|\|password\.length>128/);
  assert.match(signup, /input\.minLength=12;input\.maxLength=128/);
});
