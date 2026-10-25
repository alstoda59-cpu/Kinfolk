// Synthetic regression coverage for the Recovery174 account/modal safety guards.
// Run from repository root: node kinfolk-social/tests/recovery174-rating-modal-guard.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync(process.env.KINFOLK_PHASE82_PATH || 'kinfolk-social/kinfolk-phase82.js', 'utf8');

function fixture({ native = false, initialUser = 'adult' } = {}) {
  const timers = [];
  const requests = [];
  const writes = [];
  const notices = [];
  let modal = { innerHTML: '' };
  let renderCount = 0;
  const state = { user: initialUser ? { id: initialUser } : null, view: 'home', feed: [], videos: [] };
  const document = {
    head: { appendChild() {} },
    documentElement: {},
    createElement() { return { style: {}, set innerHTML(value) { this.firstElementChild = { value }; } }; },
    getElementById(id) { return id === 'postRating' || id === 'videoRating' ? modal : null; },
    querySelectorAll() { return []; },
  };
  const sb = {
    from(table) {
      assert.equal(table, 'kinfolk_safety_settings');
      return {
        select() { return this; },
        eq(column, id) { assert.equal(column, 'user_id'); this.userId = id; return this; },
        maybeSingle() { return new Promise(resolve => requests.push({ userId: this.userId, resolve })); },
      };
    },
  };
  const window = {
    Capacitor: native ? { isNativePlatform: () => true } : null,
    renderHome: async () => {}, renderReels: async () => {},
    openPostModal: () => {}, openVideoModal: () => {},
  };
  const context = {
    window, document, state, sb, Date,
    localStorage: { getItem() { return null; }, setItem(key, value) { writes.push([key, value]); } },
    MutationObserver: class { observe() {} },
    setTimeout(fn, delay) { timers.push({ fn, delay }); return timers.length; },
    clearTimeout() {},
    console: { warn() {} },
    toast(message) { notices.push(message); },
    async renderApp() { renderCount++; },
  };
  vm.runInNewContext(source, context, { filename: 'kinfolk-phase82.js' });
  function openModal(kind = 'post') {
    if (kind === 'post') window.openPostModal();
    else window.openVideoModal();
    const timer = [...timers].reverse().find(t => t.delay === 0);
    assert.ok(timer, 'expected deferred modal rating initialization');
    timer.fn();
  }
  return {
    state, window, requests, writes, notices, openModal,
    get modal() { return modal; },
    replaceModal(next) { modal = next; },
    get renderCount() { return renderCount; },
  };
}
const adultSettings = { data: { birth_date: '1990-01-01', mature_content_preference: 'allow' }, error: null };
async function settle() { await new Promise(resolve => setImmediate(resolve)); }

test('adult web account updates the original post rating menu', async () => {
  const f = fixture();
  f.openModal();
  assert.equal(f.requests.length, 1);
  assert.equal(f.requests[0].userId, 'adult');
  f.requests[0].resolve(adultSettings);
  await settle();
  assert.match(f.modal.innerHTML, /value="xxx"/, 'authorized adult option should appear');
});

test('late adult response cannot modify a new teen account modal', async () => {
  const f = fixture();
  f.openModal();
  const original = f.modal;
  f.state.user = { id: 'teen' };
  const next = { innerHTML: 'new teen modal' };
  f.replaceModal(next);
  f.requests[0].resolve(adultSettings);
  await settle();
  assert.equal(next.innerHTML, 'new teen modal');
  assert.doesNotMatch(original.innerHTML, /value="xxx"/);
});

test('late response cannot modify a replaced modal for the same account', async () => {
  const f = fixture();
  f.openModal();
  f.replaceModal({ innerHTML: 'replacement modal' });
  f.requests[0].resolve(adultSettings);
  await settle();
  assert.equal(f.modal.innerHTML, 'replacement modal');
});

test('native adult account never receives an XXX post rating option', async () => {
  const f = fixture({ native: true });
  f.openModal();
  f.requests[0].resolve(adultSettings);
  await settle();
  assert.doesNotMatch(f.modal.innerHTML, /value="xxx"/);
  assert.match(f.modal.innerHTML, /value="general"/);
});

test('failed safety lookup does not expose adult rating', async () => {
  const f = fixture();
  f.openModal('video');
  f.requests[0].resolve({ data: null, error: new Error('denied') });
  await settle();
  assert.doesNotMatch(f.modal.innerHTML, /value="xxx"/);
});

test('late adult entitlement cannot switch a teen account into XXX lane', async () => {
  const f = fixture();
  const switchLane = f.window.kf82Lane('xxx');
  assert.equal(f.requests.length, 1);
  f.state.user = { id: 'teen' };
  f.requests[0].resolve(adultSettings);
  await switchLane;
  assert.equal(f.renderCount, 0);
  assert.ok(f.writes.every(([, value]) => value !== 'xxx'));
});