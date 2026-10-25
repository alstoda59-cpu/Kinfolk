# Kinfolk Social Recovery151 | Stay Logged In event ordering
Date: 2026-10-24 America/Los_Angeles (2026-10-25 UTC)
Scope: FULL MAIN Kinfolk Social only. No Kinfolksworld, production, or shared Supabase changes.

## Inspected before editing
- Latest Recovery150 branch and notes, Recovery149 notes and test, Recovery133 README, validation.json, INTEGRATION.md; Library Recovery133 continuation notes and earlier checkpoint.
- Recovery150 preview dpl_5Vrz9zHpwJMgzZsjbFfrf4XZDi6e was confirmed READY (previously BUILDING).
- Read real index.html boot/auth-state event handler, phase95 login flow, and existing GitHub Actions workflow .github/workflows/kinfolk-social-ci.yml.
- Recovery150 deferred SIGNED_IN/USER_UPDATED validation through kf129RestorableSession, but phase95 called saveStay(stay) **after** adopt(tokens) / sb.auth.setSession. setSession emits SIGNED_IN before the preference was saved, allowing the event guard to observe an outdated Stay Logged In value.

## Implementation
- Branch: kinfolk-social/recovery151-login-preference-race, forked from Recovery150.
- In kinfolk-phase95.js, saveStay(stay) now runs after successful tokenLogin but **before** adopt(tokens)/setSession. Prevents stale persistence policy during sign-in event handling.
- Fix commit: 274dc05bc9007dc6f46a3b318a40a26ab68dc14a.
- New test_recovery151_auth_preference.js extracts production restoration helper, boot event handler, and Phase95 preference/adoption functions for synthetic checks. Test commit: 7ee46e40f3d8986c0b5e5d84d9c63d81716fc083.
- CI workflow updated to invoke Recovery150 static assertions and Recovery151 synthetic regression. CI change commit: 2d038a78cf3f1918f5097d472b669aad634a669c.

## Verification
- Executed actual checked-in Recovery150/151 test code in isolated V8 using Node-compatible fs/assert mocks: PASS. Recovery150: six source assertions; Recovery151: seven synthetic scenarios including persistent sign-in, same-tab nonpersistent sign-in, cross-tab sign-out, stale user event, USER_UPDATED, and preference visibility before setSession.
- This is not a full Node CLI, Playwright, real backend, or actual-device test. GitHub Actions run for the latest commit was not independently confirmed. GitHub combined status lists Vercel success only.
- New preview deployment dpl_HdKyiFeiFjMNxMAUzAaMPXU7fDYr, URL https://kinfolk-social-demo-9s8npd9zj-alstoda59-9779.vercel.app/, READY, target null, SHA 2d038a78cf3f1918f5097d472b669aad634a669c.
- Authenticated preview HTTP GET /, /kinfolk-phase95.js, and /manifest.webmanifest returned HTTP 200. Deployed phase95 contains new ordering. HTTP 200 is not a rendered browser/functional test.
- Original production deployment dpl_Fp3nErjCoMqXs8Pqsh7LQAipWFUT checked READY, target production. No deployment, alias, or schema mutation to production.

## Blockers and next work
- Verify GitHub Actions workflow run and perform real signup/login/logout, same-tab/new-tab, token refresh and Retry on isolated Supabase with authorized synthetic accounts.
- No isolated backend or authorized test accounts available for this run. Shared live Supabase auth/data/security must not be mutated without owner authorization.
- Validate backend age/privacy/RLS, media, messages, notifications and reactions, then debug Android/iOS builds, native email callback, device safe-area/keyboard QA, accessibility and store compliance.
- Do not merge or release production without owner approval. This is not app-store ready.
