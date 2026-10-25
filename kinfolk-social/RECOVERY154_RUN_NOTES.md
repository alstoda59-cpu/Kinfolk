# Kinfolk Social Recovery154: login preference rollback

Date: 2026-10-25. Scope: full main Kinfolk Social only, no Kinfolksworld changes.

## Source review
Reviewed Recovery133 README, validation.json and INTEGRATION.md, Recovery133/139/142 Library continuation notes, Recovery153 GitHub source/tests/native packaging, and current isolated Vercel deployments. Recovery142 notes document an earlier passing CI run 40154519452 on a different integration branch and unapplied Gold Star RPC hardening draft. The active development branch for this run is `kinfolk-social/recovery153-storage-rollback`; older branch results are not evidence that Recovery154 passes.

## Actual code and tests
- Commit `1f2e455937f98c86a879a0e77ca5c3a448283b6a`: Phase95 `saveStay` now returns a restoration closure. If a password token is accepted but `sb.auth.setSession`/session adoption fails, the login handler restores the prior local and tab-scoped Stay Logged In values instead of leaving the newly selected preference saved after a failed login. The existing atomic write-failure rollback remains.
- Commit `b893c8ded70f44aafb42678cb44ea0cb622862d6`: added `test_recovery154_adoption_rollback.js`, exercising failed adoption with missing/existing preferences, successful persistent/nonpersistent adoption, and blocked preference storage.
- Commit `f2f88077b7639eeb2696386da0a3bc3d327fb66e`: added the new regression to the existing GitHub Actions source checks.
- Five synthetic scenarios were executed against the updated actual Phase95 function and login adoption code in an isolated JavaScript evaluator; all five passed. This is **not** a full GitHub Actions run or real Supabase auth test.

## Preview verification
- Automatically generated isolated Vercel preview for CI commit `f2f88077...`: `dpl_AL957KsbofZANorfnV8qFB7fswyj`, READY, target null, URL https://kinfolk-social-demo-dcj0094tk-alstoda59-9779.vercel.app/ .
- Authenticated Vercel fetch of `/kinfolk-phase95.js` returned HTTP 200 and confirmed the new rollback code is served. HTTP 200/READY is not rendered app, backend, or device QA.
- GitHub commit combined status reported Vercel success. GitHub Actions status for Recovery154 has not been independently verified.
- Production deployment `dpl_Fp3nErjCoMqXs8Pqsh7LQAipWFUT` remains READY, target production, unchanged.

## Outstanding blockers
Real signup/login/logout, email callbacks, role-separated RLS/age/privacy checks, uploads, messaging and notifications require authorized nonproduction Supabase and synthetic accounts. No dedicated Supabase branch was confirmed in Recovery142. Native Android/iOS builds, signed packages, real-device tests, store-policy/legal review and owner release approval remain outstanding. No live Supabase schema/data/auth/security, production aliases, Kinfolksworld, or app-store submission changed.
