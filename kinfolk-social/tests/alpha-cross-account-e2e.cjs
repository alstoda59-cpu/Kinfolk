'use strict';
// Real, opt-in, two-account Supabase alpha integration. No mocks, service keys,
// bypassed verification, production endpoints, or synthetic database identities.
// Usage: KINFOLK_TEST_CONFIRM_ISOLATED=YES KINFOLK_TEST_SUPABASE_URL=...
// KINFOLK_TEST_ANON_KEY=sb_publishable_... KINFOLK_TEST_EMAIL=...
// KINFOLK_TEST_PASSWORD=... KINFOLK_TEST_EMAIL_B=...
// KINFOLK_TEST_PASSWORD_B=... node tests/alpha-cross-account-e2e.cjs
const crypto = require('node:crypto');
const { configFromEnv, authRequest } = require('./nonproduction-auth-smoke.cjs');
const ALPHA = 'viantpfagtbgyyzavmtv';

function config(env = process.env) {
  const base = configFromEnv(env); // fail closed to existing isolated alpha
  if (base.signup) throw Error('This integration test never creates accounts.');
  if (!env.KINFOLK_TEST_EMAIL_B || !env.KINFOLK_TEST_PASSWORD_B)
    throw Error('Two confirmed disposable alpha accounts are required.');
  if (base.email.toLowerCase() === env.KINFOLK_TEST_EMAIL_B.toLowerCase())
    throw Error('Accounts must be distinct.');
  if (new URL(base.base).hostname !== ALPHA + '.supabase.co')
    throw Error('Unexpected backend.');
  return { ...base, emailB: env.KINFOLK_TEST_EMAIL_B, passwordB: env.KINFOLK_TEST_PASSWORD_B };
}

async function run(env = process.env, fetchImpl = fetch, log = console.log) {
  const c = config(env);
  const auth = (path, options) => authRequest(c, path, { ...options, fetchImpl });
  const login = async (email, password) => {
    const session = await auth('/token?grant_type=password',
      { method: 'POST', body: { email, password } });
    if (!session?.access_token || !session?.user?.id || !session?.user?.email_confirmed_at)
      throw Error('Real confirmed account login required: ' + email);
    const user = await auth('/user', { token: session.access_token });
    if (user?.id !== session.user.id || !user.email_confirmed_at)
      throw Error('Session identity or email confirmation mismatch.');
    return { id: user.id, token: session.access_token };
  };
  const a = await login(c.email, c.password);
  const b = await login(c.emailB, c.passwordB);
  if (a.id === b.id) throw Error('Cross-account identities must differ.');
  log('PASS two distinct confirmed alpha Auth sessions');
  const rest = async (user, table, { method = 'GET', query = '', body, prefer } = {}) => {
    const response = await fetchImpl(c.base + '/rest/v1/' + table + query, {
      method, cache: 'no-store', redirect: 'error',
      headers: { apikey: c.key, Authorization: 'Bearer ' + user.token,
        'Content-Type': 'application/json',
        ...(prefer ? { Prefer: prefer } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    const data = await response.text();
    if (!response.ok) throw Error(table + ' ' + method + ' HTTP ' + response.status +
      ' (' + data.slice(0, 160).replace(/[\r\n]/g, ' ') + ')');
    return data ? JSON.parse(data) : null;
  };
  const runId = crypto.randomUUID();
  let postId, commentId, messageId;
  try {
    // Profile rows must have been created by the real Auth trigger.
    const profiles = await rest(a, 'profiles',
      { query: '?select=id&id=in.(' + a.id + ',' + b.id + ')' });
    if (!Array.isArray(profiles) || !profiles.some(p => p.id === a.id))
      throw Error('Auth profile trigger did not provision account A.');
    log('PASS authenticated profile provisioning');

    const post = await rest(a, 'posts', { method: 'POST', prefer: 'return=representation',
      body: { author_id: a.id, body: 'Kinfolk alpha cross-account QA ' + runId } });
    postId = post?.[0]?.id;
    if (!postId) throw Error('Post insert lacked persisted ID.');
    const visible = await rest(b, 'posts', { query: '?select=id&id=eq.' + postId });
    if (!visible?.some(p => p.id === postId))
      throw Error('Account B cannot see account A public feed post.');
    log('PASS cross-account feed post read');

    const comment = await rest(b, 'comments', { method: 'POST', prefer: 'return=representation',
      body: { post_id: postId, author_id: b.id, body: 'Alpha QA reply ' + runId } });
    commentId = comment?.[0]?.id;
    const seen = await rest(a, 'comments', { query: '?select=id&id=eq.' + commentId });
    if (!commentId || !seen?.some(x => x.id === commentId))
      throw Error('Cross-account comment not visible to author of post.');
    log('PASS cross-account comment');

    const message = await rest(a, 'messages', { method: 'POST', prefer: 'return=representation',
      body: { sender_id: a.id, receiver_id: b.id, body: 'Alpha QA DM ' + runId } });
    messageId = message?.[0]?.id;
    const inbox = await rest(b, 'messages', { query: '?select=id&id=eq.' + messageId });
    if (!messageId || !inbox?.some(x => x.id === messageId))
      throw Error('Recipient cannot read sent DM.');
    log('PASS cross-account DM delivery');

    // An authenticated third account is required to prove nonparticipant isolation.
    // This two-account run does not claim that proof.
  } finally {
    // Clean up only records created by this run, in dependent-first order.
    // Preserve original errors and log any cleanup failure for manual inspection.
    for (const [user, table, id] of [
      [a, 'messages', messageId], [b, 'comments', commentId], [a, 'posts', postId]]) {
      if (!id) continue;
      try { await rest(user, table, { method: 'DELETE', query: '?id=eq.' + id }); }
      catch (error) { log('CLEANUP REQUIRED ' + table + ' id=' + id + ': ' + error.message); }
    }
  }
  log('PASS real alpha cross-account feed/comment/DM integration; device and third-account privacy untested');
}

if (require.main === module) run().catch(error => {
  console.error('FAIL alpha cross-account E2E: ' + error.message);
  process.exitCode = 1;
});
module.exports = { config, run };
