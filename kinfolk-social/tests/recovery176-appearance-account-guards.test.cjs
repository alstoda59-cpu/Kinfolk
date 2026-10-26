// Recovery176: synthetic account isolation for profile appearance and music saves.
// Run from repository root: node --test kinfolk-social/tests/recovery176-appearance-account-guards.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('kinfolk-social/kinfolk-phase81.js', 'utf8');

function fixture(deferExtra = false) {
  let mounted = null, resolveExtra;
  const updates = [], timers = [], writes = [], themes = [];
  const state = {
    user: { id: 'alpha' }, view: 'home',
    profile: { id: 'alpha', accent_color: '#e85a9b' }, profiles: new Map(),
  };
  const controls = {
    '.kf81Color': { value: '#e85a9b' },
    '.kf81ColorText': { value: '#e85a9b' },
    '.kf81MusicUrl': { value: 'https://example.com/track.mp3' },
    '[data-kf81-save-color]': { disabled: false, textContent: 'Save color' },
    '[data-kf81-save-music]': { disabled: false, textContent: 'Save music' },
    '.kf81Msg': { textContent: '', style: {} },
  };
  const sheet = { querySelector(s) { return s === '.kf81Card' ? mounted : null; } };
  const safety = { insertAdjacentElement(position, card) { mounted = card; } };
  const document = {
    head: { appendChild() {} }, documentElement: { style: { setProperty() {} } },
    createElement(tag) {
      if (tag === 'section') return {
        className: '', innerHTML: '',
        querySelector(selector) { return controls[selector] || null; },
      };
      return { style: {} };
    },
    getElementById(id) {
      return id === 'kf78-sheet' ? sheet : id === 'kf78-safety' ? safety : null;
    },
    querySelector() { return null; }, addEventListener() {},
  };
  const sb = {
    from(table) {
      return {
        select() { return this; },
        eq(key, value) { this.id = value; return this; },
        maybeSingle() {
          if (table === 'kinfolk_profile_extras') {
            return deferExtra
              ? new Promise(resolve => { resolveExtra = resolve; })
              : Promise.resolve({ data: { music_url: '' } });
          }
          return Promise.resolve({ data: null });
        },
        upsert(data) { writes.push({ table, data }); return Promise.resolve({ error: null }); },
        update(data) { this.payload = data; return this; },
        single() {
          writes.push({ table, id: this.id, data: this.payload });
          return new Promise(resolve => updates.push(resolve));
        },
      };
    },
  };
  const window = { applyKinfolkTheme(value) { themes.push(value); } };
  vm.runInNewContext(source, {
    window, document, state, sb, URL,
    MutationObserver: class { observe() {} },
    setTimeout(fn, ms) { timers.push({ fn, ms }); return timers.length; },
    clearTimeout() {}, console: { warn() {} },
  }, { filename: 'kinfolk-phase81.js' });
  return {
    state, controls, updates, timers, writes, themes,
    get mounted() { return mounted; },
    resolveExtra(data) { assert.ok(resolveExtra); resolveExtra({ data }); },
    async mount() {
      timers.find(timer => timer.ms === 250).fn();
      for(let i=0;i<20&&!mounted;i++) await Promise.resolve();
      assert.ok(mounted, 'appearance settings should mount');
    },
  };
}

test('stale color save cannot replace another account profile or theme', async () => {
  const f = fixture(); await f.mount();
  const pending = f.controls['[data-kf81-save-color]'].onclick();
  assert.equal(f.writes[0].id, 'alpha');
  f.state.user = { id: 'beta' }; f.state.profile = { id: 'beta' };
  f.updates.shift()({ data: { id: 'alpha', accent_color: '#e85a9b' }, error: null });
  await pending;
  assert.equal(f.state.profile.id, 'beta');
  assert.equal(f.themes.length, 0);
});

test('stale music save cannot replace another account profile', async () => {
  const f = fixture(); await f.mount();
  const pending = f.controls['[data-kf81-save-music]'].onclick();
  assert.ok(f.writes.some(write => write.table === 'profiles' && write.id === 'alpha'));
  f.state.user = { id: 'beta' }; f.state.profile = { id: 'beta' };
  f.updates.shift()({ data: { id: 'alpha', profile_music_url: 'https://example.com/track.mp3' }, error: null });
  await pending;
  assert.equal(f.state.profile.id, 'beta');
});

test('stale appearance read cannot mount previous account settings', async () => {
  const f = fixture(true);
  f.timers.find(timer => timer.ms === 250).fn();
  f.state.user = { id: 'beta' };
  f.resolveExtra({ music_url: 'https://example.com/track.mp3' });
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  assert.equal(f.mounted, null);
});

test('same-account color save still updates profile and theme', async () => {
  const f = fixture(); await f.mount();
  const pending = f.controls['[data-kf81-save-color]'].onclick();
  f.updates.shift()({ data: { id: 'alpha', accent_color: '#e85a9b' }, error: null });
  await pending;
  assert.equal(f.state.profile.id, 'alpha');
  assert.equal(f.themes.at(-1), '#e85a9b');
});

test('same-account music save still updates profile', async () => {
  const f = fixture(); await f.mount();
  const pending = f.controls['[data-kf81-save-music]'].onclick();
  f.updates.shift()({ data: { id: 'alpha', profile_music_url: 'https://example.com/track.mp3' }, error: null });
  await pending;
  assert.equal(f.state.profile.profile_music_url, 'https://example.com/track.mp3');
});
