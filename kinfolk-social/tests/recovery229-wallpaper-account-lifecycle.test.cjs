'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('kinfolk-social/kinfolk-phase76.js', 'utf8');
const start = source.indexOf("let cache='',wallpaperRequest=0;async function refreshWallpaper()");
const end = source.indexOf('new MutationObserver(', start);
assert.ok(start >= 0 && end > start, 'Recovery229 wallpaper lifecycle must be present');
const wallpaperSource = source.slice(start, end);

function harness() {
  const state = { user: { id: 'account-A' }, profile: { accent_color: '#e85a9b' }, route: 'profile' };
  const pending = [];
  let layer = null;
  const document = {
    getElementById: () => layer,
    querySelector: () => null,
    createElement() {
      const el = {
        innerHTML: '',
        style: { values: {}, setProperty(key, value) { this.values[key] = value; } },
        remove() { if (layer === el) layer = null; }
      };
      return el;
    },
    body: { prepend(el) { layer = el; } }
  };
  const one = () => new Promise(resolve => pending.push(resolve));
  const refresh = new Function('state', 'one', 'theme', 'document', 'H',
    wallpaperSource + ';return refreshWallpaper;')(state, one, () => {}, document, String);
  return { state, pending, refresh, getLayer: () => layer };
}

test('old account wallpaper cannot overwrite newly signed-in account', async () => {
  const h = harness();
  const oldRequest = h.refresh();
  h.state.user = { id: 'account-B' };
  const newRequest = h.refresh();
  h.pending[1]({ animated_wallpaper_url: 'https://example.test/B.gif' });
  await newRequest;
  h.pending[0]({ animated_wallpaper_url: 'https://example.test/A.gif' });
  await oldRequest;
  assert.match(h.getLayer().innerHTML, /B\.gif/);
  assert.doesNotMatch(h.getLayer().innerHTML, /A\.gif/);
});

test('latest request wins when two loads for one account resolve out of order', async () => {
  const h = harness();
  const first = h.refresh();
  const second = h.refresh();
  h.pending[1]({ animated_wallpaper_url: 'https://example.test/new.gif' });
  await second;
  h.pending[0]({ animated_wallpaper_url: 'https://example.test/old.gif' });
  await first;
  assert.match(h.getLayer().innerHTML, /new\.gif/);
});

test('wallpaper fit, dimming and autoplay changes update even when URL is unchanged', async () => {
  const h = harness();
  const first = h.refresh();
  h.pending[0]({ animated_wallpaper_url: 'https://example.test/loop.mp4' });
  await first;
  const original = h.getLayer();
  assert.doesNotMatch(original.innerHTML, /autoplay/);
  const second = h.refresh();
  h.pending[1]({ animated_wallpaper_url: 'https://example.test/loop.mp4', wallpaper_fit: 'contain', wallpaper_dim_percent: 40, wallpaper_autoplay: true });
  await second;
  assert.notEqual(h.getLayer(), original);
  assert.equal(h.getLayer().style.values['--kfw-fit'], 'contain');
  assert.equal(h.getLayer().style.values['--kfw-dim'], '0.4');
  assert.match(h.getLayer().innerHTML, /autoplay/);
});

test('logout removes previously rendered wallpaper without backend roundtrip', async () => {
  const h = harness();
  const first = h.refresh();
  h.pending[0]({ animated_wallpaper_url: 'https://example.test/private.gif' });
  await first;
  assert.ok(h.getLayer());
  h.state.user = null;
  await h.refresh();
  assert.equal(h.getLayer(), null);
});

test('navigating away from profile removes wallpaper', async () => {
  const h = harness();
  const first = h.refresh();
  h.pending[0]({ animated_wallpaper_url: 'https://example.test/one.gif' });
  await first;
  h.state.route = 'home';
  const second = h.refresh();
  h.pending[1]({ animated_wallpaper_url: 'https://example.test/one.gif' });
  await second;
  assert.equal(h.getLayer(), null);
});
