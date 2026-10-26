'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Run the real Phase95 tokenLogin function against synthetic responses.
// No external requests, accounts, or Supabase state are involved.
const source = fs.readFileSync('kinfolk-social/kinfolk-phase95.js', 'utf8');
const start = source.indexOf('async function tokenLogin(');
const end = source.indexOf('async function currentAccountId()', start);
assert.ok(start >= 0 && end > start, 'Phase95 tokenLogin source must be present');
const tokenSource = source.slice(start, end);

function harness(fetch) {
  const timers = [];
  const cleared = [];
  const context = {
    SUPABASE_URL: 'https://example.invalid',
    ANON_KEY: 'synthetic-public-key',
    friendly: message => String(message || 'Login failed'),
    AbortController,
    fetch,
    setTimeout(callback, delay) {
      const id = timers.length + 1;
      timers.push({ id, callback, delay });
      return id;
    },
    clearTimeout(id) { cleared.push(id); }
  };
  const login = vm.runInNewContext(tokenSource + '\n tokenLogin', context);
  return { login, timers, cleared };
}

test('login timeout covers stalled JSON response body, not only response headers', async () => {
  let bodyStarted = false;
  let bodySignal;
  const h = harness(async (url, options) => ({
    ok: true,
    status: 200,
    json() {
      bodyStarted = true;
      bodySignal = options.signal;
      return new Promise((resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(new Error('body aborted')), { once: true });
      });
    }
  }));
  const request = h.login('qa@example.test', 'synthetic-password');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(bodyStarted, true, 'response JSON parsing must have started');
  assert.equal(h.timers.length, 1);
  assert.equal(h.timers[0].delay, 15000);
  assert.deepEqual(h.cleared, [], 'timeout must remain active during body read');
  h.timers[0].callback();
  await assert.rejects(request, /login timed out/i);
  assert.equal(bodySignal.aborted, true);
  assert.deepEqual(h.cleared, [1], 'timer must be cleared after failure');
});

test('successful login JSON clears timeout after complete response', async () => {
  const h = harness(async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      access_token: 'synthetic-access',
      refresh_token: 'synthetic-refresh',
      user: { id: 'synthetic-user' }
    })
  }));
  const result = await h.login('qa@example.test', 'synthetic-password');
  assert.equal(result.user.id, 'synthetic-user');
  assert.deepEqual(h.cleared, [1]);
});

test('malformed error JSON preserves friendly failure instead of activating login', async () => {
  const h = harness(async () => ({
    ok: false,
    status: 502,
    json: async () => { throw new SyntaxError('bad JSON'); }
  }));
  await assert.rejects(h.login('qa@example.test', 'synthetic-password'), /Login failed/);
  assert.deepEqual(h.cleared, [1]);
});
