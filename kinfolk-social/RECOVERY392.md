# Recovery392 | Preserve signup retry cooldown across mobile navigation

Date: 2026-11-01 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social in `kinfolk-social/` only; Kinfolksworld excluded.

## Continuation and source fix
Continued from Recovery391 commit `0496a174234b7d20013feb3f50da8ecd0ccd039b`, source CI run `41301680539` (SUCCESS), and nonproduction Vercel READY deployment at the same commit. Reviewed Recovery391, the effective Phase79 mobile signup handler, Recovery390/391 regression tests, native auth source gate, and existing Library continuation notes. No restart, merge or redesign.

Recovery391 prevented an immediate duplicate signup after ambiguous responses **while the signup screen remained mounted**, but the Recovery390 navigation guard returned early when the member switched to Login before the Auth result/error arrived. That early return skipped the retry cooldown, allowing a rapid Login -> Signup -> Create Account sequence to resend an account creation request that may already have succeeded.

The effective `kinfolk-phase79.js` now retains a 60-second in-memory signup retry cooldown when a dispatched signup resolves after the original signup screen is replaced or removed. Stale errors also retain the cooldown only when `signUp` was actually dispatched; preflight errors do not. Neither stale branch paints errors or resets controls on the replacement Login screen. The existing post-request identity, age/privacy, session and Stay Logged In guards remain intact.

## Regression and mobile packaging gate
Updated the existing source-executed Recovery390 regression to require cooldown on stale successful responses. Added `tests/recovery392-signup-navigation-cooldown.test.mjs` to source-execute the actual stale catch branch with synthetic navigation/unmount and preflight cases. Wired the new suite into the existing `native/package.json` `alpha:auth:source:test` command, already included by `alpha:verify`. No duplicate test runner.

## Evidence boundaries and release blockers
This is a source-level fix; GitHub CI and exact-SHA Vercel READY status must be verified independently. No real signup, deliverable email, two-user RLS, backend-connected messaging/uploads, signed Android/iOS package or physical-device QA is claimed. The cooldown is in-memory for the running page and does not persist across app restarts; this is a bounded duplicate-request mitigation, not exactly-once backend account creation.

No shared live Supabase schema/data/auth/security, production deployments or aliases, Kinfolksworld, paid resources, stores or real user accounts were changed. No new Supabase project or organization was created. **Not launch-ready.**
