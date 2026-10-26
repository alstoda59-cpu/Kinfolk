# Kinfolk Social Recovery214 | incomplete-login local session cleanup

Date: 2026-10-25 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social only; Kinfolksworld excluded.
Source of truth: isolated GitHub branch `kinfolk-social/recovery207-signup-navigation-guard`.

## Inspected before changes
- Latest Recovery213 notes, branch README, validation.json, INTEGRATION.md, Phase95/98 login/signup implementation, CI workflow, Recovery151/154/212/213 tests.
- Library Recovery133 continuation notes (ID `libfile_1a804a431c048191af039af7a3118003`) and Recovery175 music notes (separate branch; do not duplicate or merge without review).
- Latest Vercel project previews, all nonproduction, including READY Recovery213 `dpl_A2qQBmYaCx24Tzu2YiHtNPNtpAin`.

## Bug and code change
Phase95 can adopt an authenticated session and then fail to activate the app, for example because the account view is missing or navigation changed. Previously it rolled back the Stay Logged In preference but left the newly adopted Supabase session active. This could leave an unexpected logged-in state on reload.

- Added `clearFailedLoginSession(expectedId,startingAccount)` to Phase95.
- On adoption or activation failure, restore the prior Stay Logged In preference, then attempt **local-scope** sign-out only when there was no pre-existing account and the current account still matches the failed login identity.
- If another account became active, or an account existed before the attempt, do not sign out that account. Cleanup failures are logged without masking the original login error.
- No signup, layout, Reels, messaging, or production backend behavior was intentionally changed.

## Commits
- Repair stale Recovery151 synthetic auth-preference fixture: `3ff3fee43a4a8dd1afe2f2b122224082c6fec26d`.
- Repair and extend Recovery154 adoption rollback fixture: `987aee9bb2f620b22159cb30bf0f0532c8223be9`, `860b2952fe4f9df1a0822768adea25ce8249cbcb`.
- Application code fix: `64a02e6384a743c11c10ca7a056e52c69ffebb6e`.
- Adapt Recovery154 to new cleanup helper: `158df068ec0519960a78ec8a61b2f8e8bd16c2ab`, `25b5a839475abbefdee648cb583b03716d302cdd`.
- New five-case synthetic regression: `e686c48065c2b50321d849329a14947d4f61178b`.
- Add new test to main source CI: `9526f3a4a71d4441f54e26464e2c56b9d3b4573e`.

## Verification (do not conflate levels)
- Exact fetched Phase95 source and all three affected test files parsed in V8: PASS.
- Exact committed Recovery214 test bodies executed in a V8 harness with Node test/fs/assert adapters: **5/5 PASS**.
- Exact committed Recovery151 test script executed with V8 Node adapters: PASS, including its seven synthetic auth scenarios.
- Exact committed Recovery154 test script executed with V8 Node adapters: PASS, including adoption error, storage rollback, successful login preference and account switch.
- No native Node 22 CI result, real rendered browser test, isolated Supabase integration, or Android/iPhone device result confirmed for Recovery214.
- Last inspected READY preview: `dpl_HjbdznVvJpy3kZUY2tcFCnc4zbMc`, URL `https://kinfolk-social-demo-fqwscpccc-alstoda59-9779.vercel.app/`, commit `860b2952fe4f9df1a0822768adea25ce8249cbcb`. This preview **predates the Phase95 application fix**. Vercel combined status for app commit and later test commit reported a build-rate-limit failure, not an app runtime failure. **No READY preview of Recovery214 app fix confirmed.**

## Next steps and blockers
1. Run native Node 22 GitHub Actions and resolve any failures. Obtain isolated READY preview for the app-fix commit when build quota permits.
2. Validate real signup, login, logout, activation failure, refresh and Stay Logged In with authorized synthetic accounts on a dedicated nonproduction Supabase project. Do not use shared live project for test writes.
3. Test Android/iPhone navigation, Reels, profile music, settings, media, messaging and privacy/RLS. Follow with Capacitor debug builds, native email callback, keyboard/safe-area and store compliance.
4. Do not merge to production or publish to stores without explicit owner approval and full end-to-end evidence.

No production deployment, alias, Kinfolksworld, shared live Supabase, user data, secret or payment changes.
