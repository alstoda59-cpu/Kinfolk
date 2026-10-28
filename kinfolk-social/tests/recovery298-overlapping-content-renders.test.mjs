import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../kinfolk-phase82.js', import.meta.url), 'utf8');
const start = source.indexOf('  const originalRenderSource=new WeakMap();');
const end = source.indexOf('  window.kf82Lane=', start);
assert.ok(start >= 0 && end > start, 'Phase82 source-backed render wrappers must exist');
const wrappers = source.slice(start, end);

function harness(kind) {
  const original = [
    { id: 'synthetic-general', content_rating: 'general' },
    { id: 'synthetic-adult', content_rating: 'xxx' }
  ];
  const state = { user: { id: 'synthetic-A' }, view: kind, feed: original, videos: original };
  const pending = [];
  const window = {};
  const base = () => new Promise(resolve => pending.push(resolve));
  const context = {
    window, state, baseHome: base, baseReels: base,
    lane: 'general', safetyCache: { known: true, adult: false, allow: false },
    native: false, syncSafetyUser: () => state.user?.id,
    generalOnly: item => (item?.content_rating || 'general') === 'general',
    chosen: item => item?.content_rating === 'general',
    addBar: () => {}, refreshSafety: () => Promise.resolve(),
    renderHomeFallback: () => {}, renderReelsFallback: () => {},
    console: { warn: () => {} }
  };
  vm.runInNewContext(wrappers, context);
  return { state, original, pending, render: kind === 'home' ? window.renderHome : window.renderReels };
}

for (const kind of ['home', 'reels']) {
  test(kind + ' overlapping async renders restore the original unfiltered source', async () => {
    const h = harness(kind), key = kind === 'home' ? 'feed' : 'videos';
    const first = h.render({ isConnected: true });
    assert.equal(h.pending.length, 1);
    assert.equal(h.state[key].length, 1);
    const second = h.render({ isConnected: true });
    assert.equal(h.pending.length, 2);
    h.pending.shift()();
    await first;
    assert.notStrictEqual(h.state[key], h.original, 'newer render still owns temporary feed');
    h.pending.shift()();
    await second;
    assert.strictEqual(h.state[key], h.original, 'original feed restored, including adult lane data');
  });
  test(kind + ' stale completion cannot overwrite a new account feed', async () => {
    const h = harness(kind), key = kind === 'home' ? 'feed' : 'videos';
    const first = h.render({ isConnected: true });
    const newAccountFeed = [{ id: 'synthetic-B-video', content_rating: 'general' }];
    h.state.user = { id: 'synthetic-B' };
    h.state[key] = newAccountFeed;
    h.pending.shift()();
    await first;
    assert.strictEqual(h.state[key], newAccountFeed);
  });
}
