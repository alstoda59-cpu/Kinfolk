# Recovery333 | Require verified email before adopting password login tokens

Date: 2026-10-29. Scope: full MAIN Kinfolk Social, `kinfolk-social/`, excluding Kinfolksworld.
Continued from Recovery332 final commit `35fdb61158850173083957d7b88ca194830d323e` on a new isolated branch. No shared live Supabase, production, paid resources or stores changed.

## Verified before editing
- Recovery332 final source CI `40992002819`: completed SUCCESS. This is source CI, not real email/backend/device QA.
- Recovery332 source, Phase95 effective login, native package verification and read-only isolated Auth readiness gate inspected.
- Vercel READY deployments on Recovery332 were earlier code commits, not proof of real auth or a final functional preview.
- Library prelaunch audit confirms private media, RLS, teen protections, real email verification and physical devices are blockers.
- The active Phase95 `tokenLogin` validated token completeness, account ID and email equality but did not check `user.email_confirmed_at` before calling `sb.auth.setSession`.

## Actual fix
- Reject password-token responses without a nonblank `user.email_confirmed_at` before adopting a session.
- Preserve email equality and existing auth failure wording; no changes to signup, layout, production credentials or Supabase Auth settings.
- This is client-side defense in depth. Supabase Auth must independently enforce email confirmation.

## Regression and packaging
- Added `tests/recovery333-confirmed-email-token.test.cjs` with eight synthetic Node cases: verified acceptance, four absent/unverified confirmation values, mismatched email, incomplete tokens, and case-insensitive email matching.
- Included the suite in native `alpha:auth:source:test`.
- Enabled Recovery333 offline Android debug / unsigned iOS Simulator workflow. Offline packaging does not use a functional backend.
- CI and native build outcomes must be checked at the exact final commit. No real email delivery, signup, two-account RLS or physical device QA claimed.

## Remaining blockers
- Real signup/email callback/login/logout/session restoration against the authorized isolated Supabase backend with synthetic users.
- Two-account RLS, private media, Community/Channel schema, messages, notifications, teen safety server-side tests.
- Physical Android/iPhone QA, approved HTTPS callbacks, signed distribution and store compliance.

## CI follow-up
- First source CI run `40997341484` failed in the synthetic Node stage: 657 tests, 626 passed and 31 failed. All eight new email-token regressions passed. The failures were preexisting login harnesses that fabricated successful Supabase password tokens without an `email_confirmed_at` field; the new fail-closed check correctly rejected them before their intended downstream assertions.
- Updated nine legacy synthetic fixture files to represent confirmed accounts while preserving tests for account-switching, identity mismatch, request timeouts, header safety, session adoption and Stay Logged In. No production code or assertions were weakened.
- Exact-head source/native CI must be rechecked; no success is assumed until GitHub reports it.
