# Recovery264 | Consolidated mobile signup timeout and stale-email guards

Date: 2026-10-27. Scope: full main Kinfolk Social `kinfolk-social/` only. Kinfolksworld excluded.

## Baseline and branch divergence
- Inspected Recovery262, both independent Recovery263 branches, Phase79 source, existing synthetic regression tests, README/native packaging scripts, Recovery226/232 Library notes and nonproduction Vercel deployment metadata.
- Both Recovery263 branches diverged from Recovery262. `recovery263-signup-timeout-20261027` had a 25-second signup timeout and four synthetic tests (21 total). `recovery263-resend-stale-account-guard` had an email-address check for resend controls and one synthetic test. Neither was an ancestor of the other.
- Started this isolated Recovery264 branch from `recovery263-signup-timeout-20261027` and consolidated the distinct fixes without touching shared live backend or Kinfolksworld.

## Implemented
- `58f4e24b336f09c3288d97e13dac6de52c98220e`: Rebased stale verification resend identity guard onto the existing signup timeout. A resend cannot target a previous address after the signup email changes; the stale button is disabled with a useful explanation. If the email changes while a signup request is pending, its eventual result cannot display verification success or save the earlier signup's session preference; the UI recovers and a 60-second retry hold avoids immediate duplicate creation.
- `f8f2ac346538b8764bc83803a38029dc248e47bf`: Three synthetic regressions: stale resend after email edit, email edit during pending signup, and case-only email changes. Preserves 21 previous scenarios.
- Changes restricted to `kinfolk-social/kinfolk-phase79.js` and `kinfolk-social/tests/recovery258-phase79-title.test.cjs` before these notes.

## Verification
- Re-fetched exact committed GitHub source blob `ebb6ac21ebdc68ac848a967628c9d93767416f7e` and test blob `a7c71cb33a22754fd1d8986d2957aeefcd612ac4`.
- Executed **24/24** synthetic regression scenarios successfully using a V8 JavaScript adapter with mocked DOM, Auth, URL, timers, Node assert/test, fs and vm APIs. This was **not actual Node.js CI, a real browser, real Supabase, or device testing**.
- Vercel reports **READY** for the exact test commit `f8f2ac34`, nonproduction target null, deployment `dpl_8GUqqNzVfxMATtMVN8oUUQ2GB11Q`: https://kinfolk-social-demo-9udlyuugw-alstoda59-9779.vercel.app/ . Vercel combined status success; PR-filtered workflow lookup returned no runs. Do not interpret that as a full GitHub Actions pass or functional app proof.
- Compared Recovery264 against the signup-timeout baseline: 2 commits ahead, 0 behind before documentation.

## Remaining launch blockers
- Real synthetic-account signup/email verification/login/logout/session restoration, two-user RLS, Home/Reels/Channels and profile/media/messaging/notifications/teen safety E2E remain unverified.
- No current-branch Android debug APK, iOS simulator build, physical Android/iPhone QA or signed store package verified. Prior Recovery226 artifacts do not prove Recovery264 packaging.
- Isolated Supabase environment exists per earlier reports, but real test fixture credentials are not available in this run. No new project, cost, backend auth/security/schema/data changes, production deployment/alias changes or store submission.
