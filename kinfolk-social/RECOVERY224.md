# Kinfolk Social Recovery224: login request isolation across reused mobile forms

Date: 2026-10-25 (America/Los_Angeles).
Scope: **FULL MAIN Kinfolk Social** only, excluding Kinfolksworld.
Branch: `kinfolk-social/recovery207-signup-navigation-guard`.
Previous verified checkpoint: Recovery223 (`534017fccf291e7ab2870f8b82823377964a19cd`).

## Before editing
- Inspected latest GitHub `README.md`, `RECOVERY223.md`, `validation.json`, `INTEGRATION.md`, Phase95/98/76 login code, native config, Recovery214/215/212 tests, mocked browser fixture and CI.
- Read Library Recovery133 and Recovery175 continuation notes; Recovery133 is superseded by the newer GitHub branch. Verified the existing Phase81 profile-music `pausedKey` work is present on this branch, so it was not reimplemented.
- Inspected Vercel preview history: last READY preview `dpl_GYaC6BLBwdfRacmbVkFUEYpEE2dC` contains Recovery223 signup fix but predates this Recovery224 login fix.

## Defect and implementation
The Phase76 auth screen reuses the same `#authForm` node when navigating Login -> Signup -> Login. Phase95 login code checked only that the form was connected and its *current* title read 'Welcome back'. A delayed token response or SDK session-adoption result from the *previous* login screen could pass those checks on the newly opened login form. This could show a stale error, save a previous Stay Logged In choice, or open the wrong in-flight login result.

Changed `kinfolk-social/kinfolk-phase95.js`:
- Capture the original `.kf73Title` **DOM element identity** when login begins.
- Check that the original title element remains mounted in the same connected login form at all four asynchronous checkpoints, and before success/error messages.
- Track the original login title with the request lock; do not permit concurrent login requests on a newly remounted login form.
- Give a clear temporary-busy message instead of silently ignoring an attempted new login while the previous request is still pending.
- Preserve existing guarded preference rollback and local-session cleanup if a stale request is detected after token adoption.
- Preserve existing login ownership, signup behavior, session restoration, theme/music, feed, Reels/Channels and other app features.

## Source commits
- `21ddd9235a1def4e8dfa1e696d05665bc3cda1aa`: Phase95 identity-aware login request guard.
- `c2bf0e2946558552474e53036056672939384e11`: update Recovery215 source assertions to identity-aware guard.
- `56d1290e3d567a6be42833efcb47319e0de6b639`: new `tests/recovery224-login-form-identity.test.cjs` synthetic Node regressions.
- `48462b6f9483568e5078ecb5e095b2eb70817d9a`: new `test_recovery224.py` mocked 390x844 mobile Chromium/WebKit regression.
- `a74819150e90c568b4c5b91ddcf561c6b6cc9a8f`: include Recovery224 mobile browser regression in existing GitHub Actions workflow. The Node suite already discovers all `tests/*.test.cjs`.

## Verification boundaries
- Fetched the **exact committed Phase95 source**, parsed with V8 `new Function`: PASS.
- Executed **6/6** focused checks against the exact committed Phase95 source via a synthetic V8 Node-style adapter: three functional mocked token success/error/adoption scenarios and three Recovery215 static source assertions. This is **not native Node**, real Chromium/WebKit, GitHub Actions, Supabase or device QA.
- New `test_recovery224.py` is committed and added to CI, **not executed or confirmed passing** in this run.
- Recovery223's full suites were **not rerun** here. Its prior checkpoint recorded 131/131 actual Node tests, 27/27 legacy scripts and 11 mocked Chromium mobile scripts before Recovery223/224.
- Vercel status for the Recovery224 source commit and CI commit: `failure` with `build-rate-limit` URL. No READY preview containing Recovery224 confirmed. Last READY nonproduction preview remains `dpl_GYaC6BLBwdfRacmbVkFUEYpEE2dC` at `https://kinfolk-social-demo-a81ci0q8u-alstoda59-9779.vercel.app/` from Recovery223 commit `663ba50b34f2eca7db7289f0e7f92ed38824e11c`. It **does not** contain Recovery224.
- No real login, account creation, database, uploads, native AAB/APK/IPA, or physical Android/iPhone tests were performed.

## Remaining blockers and next safe work
1. Verify GitHub Actions Node/Chromium/WebKit runs including Recovery223/224, inspect failure logs, and fix any real regressions. Latest commit's combined status currently reports Vercel rate limit, not browser-test success/failure.
2. Use owner-authorized **isolated nonproduction Supabase** for real signup/login/logout, email verification, session restore, username integrity and privacy/RLS tests. Shared live Supabase must not be mutated.
3. Verify auth-event timing when `setSession` emits `SIGNED_IN` while the user navigates between screens; current isolated test verifies the Phase95 handler but not all app-wide event listeners.
4. Continue Home/Reels/Channels, profile/theme/music, media, messaging and notifications E2E QA; finish native Capacitor builds, deep links, safe areas, keyboard, accessibility, store policy and real device testing.
5. Review branch and test evidence before merge; production/store release only after explicit owner approval.

**Unchanged:** `kinfolksworld/`, production deployment and aliases, shared live Supabase schema/data/auth/security, real users and payments.
