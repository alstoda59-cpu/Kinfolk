'use strict';
// Recovery178: opt-in authentication smoke test for an ISOLATED Supabase project.
// Never run against Kinfolk's shared live project. No credentials are committed.
// Usage is documented in RECOVERY178.md.
const LIVE_REF = 'zojajuzmfjpvubzibzgg';

function configFromEnv(env = process.env) {
  let url;
  try { url = new URL(env.KINFOLK_TEST_SUPABASE_URL || ''); }
  catch { throw Error('Set KINFOLK_TEST_SUPABASE_URL to an isolated Supabase project.'); }
  if (url.protocol !== 'https:' ||
      !/^[a-z0-9-]+\.supabase\.co$/i.test(url.hostname) ||
      url.hostname.split('.')[0].toLowerCase() === LIVE_REF ||
      url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw Error('Refusing non-isolated or unrecognized Supabase URL.');
  }
  if (env.KINFOLK_TEST_CONFIRM_ISOLATED !== 'YES') {
    throw Error('Set KINFOLK_TEST_CONFIRM_ISOLATED=YES after verifying project isolation.');
  }
  const key = env.KINFOLK_TEST_ANON_KEY;
  const email = env.KINFOLK_TEST_EMAIL;
  const password = env.KINFOLK_TEST_PASSWORD;
  if (!key || !email || !password) {
    throw Error('Missing isolated project publishable key or authorized test-account credentials.');
  }
  if (/service_role/i.test(key)) throw Error('Do not use a service-role key.');
  let signup = null;
  if (env.KINFOLK_TEST_ALLOW_SIGNUP === 'YES') {
    const { KINFOLK_TEST_SIGNUP_EMAIL: signupEmail,
            KINFOLK_TEST_SIGNUP_PASSWORD: signupPassword,
            KINFOLK_TEST_SIGNUP_BIRTHDATE: birthdate } = env;
    if (!signupEmail || !signupPassword || !birthdate) {
      throw Error('Signup opt-in requires a dedicated authorized email, password and birthdate.');
    }
    if (signupEmail.toLowerCase() === email.toLowerCase()) {
      throw Error('Signup account must differ from the existing login test account.');
    }
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthdate);
    const d = match && new Date(birthdate + 'T00:00:00Z');
    if (!d || !Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== birthdate) {
      throw Error('Signup test birthdate must be a valid ISO date.');
    }
    const now = new Date();
    let age = now.getUTCFullYear() - d.getUTCFullYear();
    if (now.getUTCMonth() < d.getUTCMonth() ||
       (now.getUTCMonth() === d.getUTCMonth() && now.getUTCDate() < d.getUTCDate())) age--;
    if (age < 18 || age > 99) throw Error('Signup smoke uses synthetic adult accounts only.');
    signup = { email: signupEmail, password: signupPassword, birthdate };
  }
  return { base: url.origin, key, email, password, signup };
}

async function authRequest(config, path, { method = 'GET', body, token, fetchImpl = fetch } = {}) {
  const response = await fetchImpl(config.base + '/auth/v1' + path, {
    method,
    headers: {
      apikey: config.key,
      Authorization: 'Bearer ' + (token || config.key),
      'Content-Type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: 'no-store',
    redirect: 'error',
  });
  let data = null;
  try { data = await response.json(); } catch {}
  if (!response.ok) {
    const error = Error(method + ' ' + path.split('?')[0] + ' returned HTTP ' + response.status);
    error.httpStatus = response.status;
    throw error;
  }
  return data;
}

async function runSmoke(config, fetchImpl = fetch, log = console.log) {
  const send = (path, options) => authRequest(config, path, { ...options, fetchImpl });
  if (config.signup) {
    const s = config.signup;
    const result = await send('/signup', {
      method: 'POST',
      body: { email: s.email, password: s.password,
        data: { display_name: 'Kinfolk QA', signup_birthdate: s.birthdate } },
    });
    if (!result?.user?.id) throw Error('Signup did not return a user.');
    if (result.access_token) {
      await send('/logout?scope=local', { method: 'POST', token: result.access_token });
    }
    log('PASS isolated synthetic signup request (confirmation may still be required)');
  }
  const session = await send('/token?grant_type=password', {
    method: 'POST', body: { email: config.email, password: config.password },
  });
  if (!session?.access_token || !session?.refresh_token || !session?.user?.id) {
    throw Error('Login response lacks a complete session.');
  }
  log('PASS isolated test-account login');
  const user = await send('/user', { token: session.access_token });
  if (user?.id !== session.user.id) throw Error('Authenticated user identity changed.');
  log('PASS authenticated user lookup');
  const refreshed = await send('/token?grant_type=refresh_token', {
    method: 'POST', body: { refresh_token: session.refresh_token },
  });
  if (!refreshed?.access_token || !refreshed?.refresh_token ||
      refreshed?.user?.id !== session.user.id) {
    throw Error('Session refresh did not preserve the test account.');
  }
  log('PASS session refresh / restoration token');
  await send('/logout?scope=local', { method: 'POST', token: refreshed.access_token });
  log('PASS logout endpoint');
  try {
    await send('/token?grant_type=refresh_token', {
      method: 'POST', body: { refresh_token: refreshed.refresh_token },
    });
  } catch (error) {
    if (error.httpStatus >= 400 && error.httpStatus < 500) {
      log('PASS logged-out refresh token rejected');
      return;
    }
    throw error;
  }
  throw Error('Logged-out refresh token was still accepted.');
}

if (require.main === module) {
  (async () => {
    try { await runSmoke(configFromEnv()); }
    catch (error) { console.error('FAIL isolated auth smoke: ' + error.message); process.exitCode = 1; }
  })();
}
module.exports = { configFromEnv, authRequest, runSmoke };
