'use strict';
// Real, opt-in, cross-account alpha backend integration. No mock database.
// Run only against the explicitly approved isolated project, never LIVE.
// Requires two pre-confirmed disposable adult accounts. No service-role key.
const REF = 'viantpfagtbgyyzavmtv';
const LIVE = 'zojajuzmfjpvubzibzgg';
function config(env = process.env) {
  const url = new URL(env.KINFOLK_TEST_SUPABASE_URL || 'https://' + REF + '.supabase.co');
  if (url.origin !== 'https://' + REF + '.supabase.co' ||
      url.pathname !== '/' || url.search || url.hash || url.username || url.password ||
      url.hostname.startsWith(LIVE) || env.KINFOLK_TEST_CONFIRM_ISOLATED !== 'YES')
    throw Error('Refusing anything except explicitly confirmed isolated Kinfolk alpha.');
  const key = env.KINFOLK_TEST_ANON_KEY;
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key || ''))
    throw Error('Requires isolated publishable key, never service-role or secret key.');
  const accounts = [
    [env.KINFOLK_TEST_EMAIL, env.KINFOLK_TEST_PASSWORD],
    [env.KINFOLK_TEST_EMAIL_B, env.KINFOLK_TEST_PASSWORD_B],
  ];
  if (accounts.some(a => !a[0] || !a[1]) || accounts[0][0].toLowerCase() === accounts[1][0].toLowerCase())
    throw Error('Provide two distinct confirmed disposable alpha accounts.');
  if (env.KINFOLK_TEST_ALLOW_WRITES !== 'YES')
    throw Error('Set KINFOLK_TEST_ALLOW_WRITES=YES to authorize disposable alpha records.');
  return { base: url.origin, key, accounts };
}
async function request(c, path, { method = 'GET', token, body, prefer, expected = [200] } = {}) {
  const response = await fetch(c.base + path, {
    method, redirect: 'error', cache: 'no-store',
    headers: { apikey: c.key, ...(token ? { Authorization: 'Bearer ' + token } : {}),
      'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const raw = await response.text();
  let data; try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }
  if (!expected.includes(response.status)) {
    throw Error(method + ' ' + path.split('?')[0] + ' returned HTTP ' + response.status +
      ' (expected ' + expected.join('/') + ')');
  }
  return { status: response.status, data };
}
async function run(c, log = console.log) {
  const users = [];
  for (const [email, password] of c.accounts) {
    const { data } = await request(c, '/auth/v1/token?grant_type=password',
      { method: 'POST', body: { email, password } });
    if (!data?.access_token || !data?.user?.id || !data.user.email_confirmed_at)
      throw Error('Confirmed account login failed.');
    users.push({ id: data.user.id, token: data.access_token });
  }
  if (users[0].id === users[1].id) throw Error('Both logins resolved to one identity.');
  log('PASS two distinct confirmed alpha sessions');
  const [a,b] = users;
  const record = [];
  const rest = (path, options) => request(c, '/rest/v1/' + path, options);
  try {
    // Profile provisioning is intentionally left to the actual signup/profile flow.
    for (const u of users) {
      const { data } = await rest('profiles?id=eq.' + encodeURIComponent(u.id) + '&select=id',
        { token: u.token });
      if (!Array.isArray(data) || data.length !== 1 || data[0].id !== u.id)
        throw Error('Missing authenticated profile: signup/profile integration must provision it.');
    }
    log('PASS both signup profiles available through authenticated RLS');
    const marker = 'Kinfolk isolated alpha E2E ' + Date.now();
    const created = await rest('posts?select=id,author_id', {
      method: 'POST', token: a.token, prefer: 'return=representation',
      body: { author_id: a.id, body: marker }, expected: [201] });
    const post = created.data?.[0];
    if (!post?.id || post.author_id !== a.id) throw Error('Post creation returned incorrect owner.');
    record.push({ table: 'posts', id: post.id, token: a.token });
    log('PASS account A creates a real post');
    const visible = await rest('posts?id=eq.' + post.id + '&select=id', { token: b.token });
    if (!Array.isArray(visible.data)) throw Error('Account B feed response invalid.');
    // Private profiles may intentionally hide posts from B; do not override privacy to force visibility.
    log('PASS account B post visibility evaluated by real RLS: ' +
      (visible.data.length ? 'visible' : 'hidden'));
    const forged = await rest('posts', {
      method: 'POST', token: b.token, body: { author_id: a.id, body: marker + ' forged' },
      expected: [400, 401, 403] });
    if (![400,401,403].includes(forged.status)) throw Error('Cross-account post forgery succeeded.');
    log('PASS account B cannot forge account A posts');
    const own = await rest('posts?id=eq.' + post.id + '&select=id', { token: a.token });
    if (own.data?.length !== 1) throw Error('Account A cannot read own post.');
    log('PASS account A reads own post');
  } finally {
    for (const r of record.reverse()) {
      try {
        await rest(r.table + '?id=eq.' + r.id, { method: 'DELETE', token: r.token,
          expected: [200,204] });
      } catch (e) { log('CLEANUP REQUIRED: ' + r.table + ' id=' + r.id + ': ' + e.message); }
    }
    for (const u of users) {
      try { await request(c, '/auth/v1/logout?scope=local',
        { method: 'POST', token: u.token, expected: [204] }); }
      catch (e) { log('Logout cleanup warning: ' + e.message); }
    }
  }
}
if (require.main === module) {
  run(config()).catch(e => { console.error('FAIL real alpha E2E: ' + e.message); process.exitCode = 1; });
}
module.exports = { config, run };
