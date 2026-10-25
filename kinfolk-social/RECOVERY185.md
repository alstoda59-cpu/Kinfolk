# Kinfolk Social Recovery185 | executed offline login activation regressions

Date: 2026-10-25. Scope: full main Kinfolk Social only. No Kinfolksworld, production, or shared live Supabase writes.

## Inspected first
- Recovery184 branch source, README, Recovery183 notes, Phase95 login, Recovery182 and Recovery183 tests, existing Recovery182 GitHub Actions workflow.
- Library Recovery133 continuation notes and Vercel deployment history.
- Previous Recovery183/184 commits did not prove login activation behavior. Recovery182 fixture omitted the real DOM's form.isConnected property, causing an existing success assertion to fail against the newer code.

## Work
- New branch: kinfolk-social/recovery185-login-runtime-regressions (from Recovery184).
- Updated tests/recovery182-login-session-identity.test.cjs to set isConnected=true on the synthetic form and exercise:
  1. Successful activation.
  2. Missing activation handler with preference rollback.
  3. Rejected activation with preference rollback.
  4. Account switch during activation with preference rollback.
  5. Detached form must not show stale success.
  6. Deferred activation must not show success before the promise resolves.
- Test commits: bd2155488a43d998c442ba9d6350084d5cbb605e and b7a5dd51016263d45009ae05e743fe08321fe171.
- Existing Phase95 application fix is inherited unchanged from Recovery183, commit 9f3a2586d6050fd395b1380cdbf618f1e963b216.

## Verification
- Fetched exact GitHub Phase95 script (blob c773c058ffabf97ff67b4cff8a98e8b2ece41268), Recovery182 runtime test (blob 25915d1408bd97ad0fabdcb047bdb493c2073ebb) and Recovery183 static test (blob a6f5bcaa42ea756da013c57e0e9250e9a31894a5).
- Executed the actual committed test logic in an isolated JavaScript V8 harness with mocked node:test, node:assert/strict, node:fs and node:vm adapters. 13/13 offline runtime scenarios passed. Recovery183 source-order checks passed.
- This is not Node 22 GitHub Actions, Playwright, real browser, real Supabase, or device QA. Updated existing .github/workflows/kinfolk-recovery182-auth.yml to run on Recovery185 pushes, check both login test files and execute the Recovery179–183 offline suite. Workflow update commit e8da1005a22ddf879cfed3cd2dfb3bbc75cd74d5. GitHub Actions run outcome is not yet verified.
- Vercel preview dpl_E1oAMPRxBG3X2erM7siHnAMEbajC is READY, target null, for commit b7a5dd51016263d45009ae05e743fe08321fe171. URL https://kinfolk-social-demo-ootw7lkyn-alstoda59-9779.vercel.app/ . READY does not prove login functionality.

## Blockers
1. Authorized isolated nonproduction Supabase project and synthetic accounts for real signup/login/logout/session persistence and callback tests.
2. Browser-rendered navigation/Home/Reels/profile/media/messaging tests.
3. Backend RLS and age/content/privacy enforcement review.
4. Capacitor Android/iOS builds, device tests, keyboard/safe-area/accessibility, store-policy review.
5. No production release without explicit approval.

No new production aliases, schema changes, real-user actions, secrets, or payments.

## Deployment after CI update
Vercel combined commit status on e8da1005a22ddf879cfed3cd2dfb3bbc75cd74d5 reports build-rate-limit failure. This is a hosting limit, not a passing or failing app runtime test. Earlier Recovery185 preview dpl_E1oAMPRxBG3X2erM7siHnAMEbajC is READY and contains the same application source; newer documentation/workflow commits are not confirmed deployed.
