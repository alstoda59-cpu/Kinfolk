// Synthetic playback and navigation regressions for Kinfolk profile music.
// Run from repository root: node kinfolk-social/tests/recovery175-music-pause.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync(process.env.KINFOLK_PHASE81_PATH || 'kinfolk-social/kinfolk-phase81.js', 'utf8');
const MUSIC = 'https://example.org/profile.mp3';

function fixture({ deferred = false } = {}) {
  const audios = [];
  const button = { textContent: '' };
  const status = { textContent: '' };
  let currentControl = null;
  let resolveLookup;
  const hero = {};
  const host = {
    querySelector(selector) { return selector === '.kf81Player' ? currentControl : null; },
    appendChild(control) { currentControl = control; },
  };
  const document = {
    head: { appendChild() {} }, body: { appendChild() {} },
    documentElement: { style: { setProperty() {} } },
    createElement(tag) {
      if (tag === 'style') return {};
      if (tag === 'div') return {
        querySelector(selector) {
          if (selector === '.kf81Play') return button;
          if (selector === '.kf81Status') return status;
          return null;
        },
        remove() { if (currentControl === this) currentControl = null; },
      };
      return {};
    },
    querySelectorAll(selector) { return selector === '.kf51Music audio' ? [] : []; },
    querySelector(selector) {
      if (selector === '.profileHero') return hero;
      if (selector === '.kf51Music') return host;
      return null;
    },
    getElementById(id) { return id === 'kf81-profile-player' ? currentControl : null; },
    addEventListener() {},
  };
  const state = {
    user: { id: 'viewer' }, view: 'profile', profileViewId: 'viewer',
    profiles: new Map([['viewer', { profile_music_url: MUSIC }]]),
  };
  const sb = {
    from() {
      return {
        select() { return this; }, eq() { return this; },
        maybeSingle() {
          return deferred
            ? new Promise(resolve => { resolveLookup = resolve; })
            : Promise.resolve({ data: { music_url: MUSIC } });
        },
      };
    },
  };
  class AudioMock {
    constructor(url) { this.src = url; this.paused = true; this.playCount = 0; audios.push(this); }
    play() { this.paused = false; this.playCount++; return Promise.resolve(); }
    pause() { this.paused = true; }
    setAttribute() {}
  }
  const window = {};
  vm.runInNewContext(source, {
    window, document, state, sb, Audio: AudioMock, URL,
    MutationObserver: class { observe() {} },
    setTimeout() { return 1; }, clearTimeout() {}, requestAnimationFrame() {},
    console: { warn() {} },
  }, { filename: 'kinfolk-phase81.js' });
  return {
    window, state, audios, button, status,
    remount() { currentControl = null; },
    resolve(data = { music_url: MUSIC }) { assert.ok(resolveLookup); resolveLookup({ data }); },
  };
}

test('direct audio starts once and does not duplicate on routine ensure', async () => {
  const f = fixture();
  await f.window.kf81EnsureProfileMusic();
  await f.window.kf81EnsureProfileMusic();
  assert.equal(f.audios.length, 1);
  assert.equal(f.audios[0].playCount, 1);
});

test('manual pause survives profile rerender and resumes only on Play', async () => {
  const f = fixture();
  await f.window.kf81EnsureProfileMusic();
  await f.button.onclick();
  assert.equal(f.audios[0].paused, true);
  f.remount();
  await f.window.kf81EnsureProfileMusic();
  assert.equal(f.audios.length, 2);
  assert.equal(f.audios[1].playCount, 0);
  assert.equal(f.status.textContent, 'Paused');
  await f.button.onclick();
  assert.equal(f.audios[1].playCount, 1);
});

test('late music lookup after navigation cannot start audio', async () => {
  const f = fixture({ deferred: true });
  const pending = f.window.kf81EnsureProfileMusic();
  f.state.view = 'home';
  f.resolve();
  await pending;
  assert.equal(f.audios.length, 0);
});

test('late music lookup after account switch cannot start audio', async () => {
  const f = fixture({ deferred: true });
  const pending = f.window.kf81EnsureProfileMusic();
  f.state.user = { id: 'other-account' };
  f.resolve();
  await pending;
  assert.equal(f.audios.length, 0);
});

test('navigating away stops an existing audio player', async () => {
  const f = fixture();
  await f.window.kf81EnsureProfileMusic();
  f.state.view = 'home';
  await f.window.kf81EnsureProfileMusic();
  assert.equal(f.audios[0].paused, true);
});