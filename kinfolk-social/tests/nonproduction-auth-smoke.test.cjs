'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { configFromEnv, runSmoke } = require('./nonproduction-auth-smoke.cjs');
const baseEnv = {
  KINFOLK_TEST_SUPABASE_URL: 'https://isolated-qa.supabase.co',
  KINFOLK_TEST_CONFIRM_ISOLATED: 'YES',
  KINFOLK_TEST_ANON_KEY: 'sb_publishable_test',
  KINFOLK_TEST_EMAIL: 'qa@example.test',
  KINFOLK_TEST_PASSWORD: 'synthetic-password',
};
const response = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  async json() { return data; },
});

test('rejects the shared live Kinfolk Supabase project', () => {
  assert.throws(() => configFromEnv({
    ...baseEnv, KINFOLK_TEST_SUPABASE_URL: 'https://zojajuzmfjpvubzibzgg.supabase.co',
  }), /Refusing/);
});

test('rejects lookalike domains, insecure URLs and URL credentials', () => {
  for (const url of ['https://isolated-qa.supabase.co.attacker.test',
    'http://isolated-qa.supabase.co', 'https://user:pass@isolated-qa.supabase.co',
    'https://isolated-qa.supabase.co/auth/v1']) {
    assert.throws(() => configFromEnv({ ...baseEnv, KINFOLK_TEST_SUPABASE_URL: url }), /Refusing/);
  }
});

test('requires explicit isolation confirmation and test credentials', () => {
  assert.throws(() => configFromEnv({ ...baseEnv, KINFOLK_TEST_CONFIRM_ISOLATED: '' }), /CONFIRM_ISOLATED/);
  assert.throws(() => configFromEnv({ ...baseEnv, KINFOLK_TEST_PASSWORD: '' }), /Missing/);
  assert.throws(() => configFromEnv({ ...baseEnv, KINFOLK_TEST_ANON_KEY: 'service_role' }), /service-role/);
});

test('signup is disabled by default and requires separate authorized adult test account', () => {
  assert.equal(configFromEnv(baseEnv).signup, null);
  assert.throws(() => configFromEnv({ ...baseEnv, KINFOLK_TEST_ALLOW_SIGNUP: 'YES' }), /Signup opt-in/);
  assert.throws(() => configFromEnv({ ...baseEnv, KINFOLK_TEST_ALLOW_SIGNUP: 'YES',
    KINFOLK_TEST_SIGNUP_EMAIL: 'another@example.test', KINFOLK_TEST_SIGNUP_PASSWORD: 'password',
    KINFOLK_TEST_SIGNUP_BIRTHDATE: '2015-02-01' }), /adult/);
  assert.ok(configFromEnv({ ...baseEnv, KINFOLK_TEST_ALLOW_SIGNUP: 'YES',
    KINFOLK_TEST_SIGNUP_EMAIL: 'another@example.test', KINFOLK_TEST_SIGNUP_PASSWORD: 'password',
    KINFOLK_TEST_SIGNUP_BIRTHDATE: '1995-02-01' }).signup);
});

function mockServer({ allowAfterLogout = false, signup = false } = {}) {
  const calls = [];
  let refreshed = false, loggedOut = false;
  const fetchImpl = async (url, options) => {
    const u = new URL(url), path = u.pathname + u.search;
    calls.push({ path, method: options.method, body: options.body && JSON.parse(options.body) });
    assert.equal(u.hostname, 'isolated-qa.supabase.co');
    if (path === '/auth/v1/signup' && signup) return response({ user: { id: 'new-user' } });
    if (path === '/auth/v1/token?grant_type=password') {
      return response({ access_token: 'initial-access', refresh_token: 'initial-refresh', user: { id: 'qa-user' } });
    }
    if (path === '/auth/v1/user') {
      assert.equal(options.headers.Authorization, 'Bearer initial-access');
      return response({ id: 'qa-user' });
    }
    if (path === '/auth/v1/token?grant_type=refresh_token') {
      if (loggedOut) return allowAfterLogout
        ? response({ access_token: 'bad', refresh_token: 'bad', user: { id: 'qa-user' } })
        : response({ error: 'invalid_grant' }, 400);
      refreshed = true;
      return response({ access_token: 'fresh-access', refresh_token: 'fresh-refresh', user: { id: 'qa-user' } });
    }
    if (path === '/auth/v1/logout?scope=local') {
      assert.ok(refreshed);
      assert.equal(options.headers.Authorization, 'Bearer fresh-access');
      loggedOut = true;
      return response(null, 204);
    }
    throw Error('Unexpected endpoint: ' + path);
  };
  return { calls, fetchImpl };
}

test('mocked login, user lookup, refresh, logout and revocation all succeed', async () => {
  const server = mockServer(), logs = [];
  await runSmoke(configFromEnv(baseEnv), server.fetchImpl, x => logs.push(x));
  assert.equal(server.calls.length, 5);
  assert.equal(logs.length, 5);
  assert.ok(logs.every(x => x.startsWith('PASS')));
});

test('detects a refresh token accepted after logout', async () => {
  const server = mockServer({ allowAfterLogout: true });
  await assert.rejects(() => runSmoke(configFromEnv(baseEnv), server.fetchImpl, () => {}), /still accepted/);
});

test('optional signup sends only synthetic adult metadata', async () => {
  const env = { ...baseEnv, KINFOLK_TEST_ALLOW_SIGNUP: 'YES',
    KINFOLK_TEST_SIGNUP_EMAIL: 'new@example.test',
    KINFOLK_TEST_SIGNUP_PASSWORD: 'new-password',
    KINFOLK_TEST_SIGNUP_BIRTHDATE: '1995-02-01' };
  const server = mockServer({ signup: true }), logs = [];
  await runSmoke(configFromEnv(env), server.fetchImpl, x => logs.push(x));
  assert.equal(server.calls[0].path, '/auth/v1/signup');
  assert.deepEqual(server.calls[0].body.data, {
    display_name: 'Kinfolk QA', signup_birthdate: '1995-02-01',
  });
  assert.equal(logs.length, 6);
});
