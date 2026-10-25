# Kinfolk Social Recovery178 | isolated authentication validation

Date: 2026-10-25. Scope: FULL MAIN Kinfolk Social only, excluding Kinfolksworld.

## Baseline inspected
- Latest verified development baseline: `kinfolk-social/recovery177-login-form-mobile-efficiency` with Recovery174 account-safety, Recovery175 music, Recovery176 appearance and Recovery177 login-form improvements intact.
- Read `README.md`, `validation.json`, `INTEGRATION.md`, `RECOVERY177.md`, Phase79 signup, Phase95 login and Phase98 form guard.
- Reviewed Recovery133 Library continuation notes and the current isolated Vercel deployment list.
- `validation.json` still records Recovery133 evidence, not current real-backend validation.

## Changes
- New isolated branch: `kinfolk-social/recovery178-isolated-auth-smoke`, based on Recovery177. All prior app features and the dark mobile UI remain intact.
- `kinfolk-phase79.js`: email-confirmation signup no longer persists the Stay Logged In preference before an authenticated session exists. When signup returns a session, the existing preference behavior is preserved. Source commit `658a424da756abc825e0965cacf71a1f90503c64`.
- `tests/recovery178-signup-stay.test.cjs`: four offline cases for unconfirmed signup, immediate-session signup, signup error and underage rejection. Commit `43341be31a4d2cd5d67fee8839c767d5ce3e00f2`.
- `tests/nonproduction-auth-smoke.cjs`: opt-in REST smoke test of **authorized synthetic account** login, authenticated user lookup, token refresh, logout, and post-logout refresh-token rejection. Optional synthetic adult signup requires a separate explicit opt-in and dedicated test email.
- Refuses the shared live Kinfolk Supabase project `zojajuzmfjpvubzibzgg`, non-HTTPS/unrecognized URLs, embedded URL credentials, and missing explicit isolation confirmation. Only `*.supabase.co` project origins are accepted. The project owner must independently verify that the chosen project is truly isolated.
- `tests/nonproduction-auth-smoke.test.cjs`: seven offline tests for live-project refusal, lookalike URLs, required confirmation/credentials, signup opt-in/age, mocked lifecycle, revoked-token check and signup metadata.
- `.github/workflows/kinfolk-recovery178-auth-smoke.yml`: Node 22 offline CI for the new tests and prior Recovery174-177 regressions. No backend secrets are configured in CI.

## How to run after an isolated test project and authorized test accounts exist

Set the following environment variables locally or in a dedicated nonproduction CI secret store. **Never commit their actual values**:

```text
KINFOLK_TEST_SUPABASE_URL=https://<isolated-project-ref>.supabase.co
KINFOLK_TEST_CONFIRM_ISOLATED=YES
KINFOLK_TEST_ANON_KEY=<isolated-project-publishable-key>
KINFOLK_TEST_EMAIL=<authorized-existing-test-account>
KINFOLK_TEST_PASSWORD=<test-account-password>
```

Then run from the repository root:

```sh
node --test kinfolk-social/tests/nonproduction-auth-smoke.test.cjs
node kinfolk-social/tests/nonproduction-auth-smoke.cjs
```

Optional synthetic **adult** signup is disabled by default. Enable only for a dedicated authorized test email in the isolated project:

```text
KINFOLK_TEST_ALLOW_SIGNUP=YES
KINFOLK_TEST_SIGNUP_EMAIL=<authorized-new-test-email>
KINFOLK_TEST_SIGNUP_PASSWORD=<new-test-password>
KINFOLK_TEST_SIGNUP_BIRTHDATE=1995-02-01
```

The signup endpoint can send a confirmation email to the supplied address. Do not use real user addresses. Repeated signups with the same email are not an idempotent test.

## Verification and blockers
- Exact GitHub source parsed successfully in a synthetic V8 evaluation; a mocked five-request login/user/refresh/logout/revocation sequence passed. The new Node test file parsed in V8.
- The exact committed Phase79 source and new signup regression source parsed in V8. Synthetic checks confirmed unconfirmed signup performs **zero** preference writes, immediate-session signup performs **two**, and underage signup makes **zero** backend calls. These are NOT real Supabase or Node CI results.
- **The GitHub Actions Node result is not yet confirmed.** No actual Supabase network test was performed, because no isolated project credentials or authorized test-account access were available.
- Isolated preview: deployment `dpl_8gfdUrPTz43ZVFUCo5joNWYFqLzn`, state READY, target null, URL `https://kinfolk-social-demo-p8qbc2k1y-alstoda59-9779.vercel.app/`, commit `06ee96566296c4dd7cde20cf49314d4a6540aa87`. This deployment is not proof of login or mobile readiness.
- Real backend signup/login/logout, session restoration in a browser, age/teen policies, storage, messaging, RLS, native Android/iOS builds and physical-device QA remain unverified.
- No production merge, promotion, alias change, Kinfolksworld edit, shared live Supabase write, store submission, or payment commitment.

## Next
1. Confirm GitHub Actions result and fix any test failures.
2. Obtain owner-approved isolated Supabase project + synthetic accounts; run the guarded smoke test.
3. Run real browser session restoration and signup confirmation callback checks against that isolated project.
4. Continue media, messaging, teen safety/RLS and native device/store validation.
