# Recovery371 | Bound mobile login preflight and reject malformed Auth sessions

Date: 2026-10-31. Scope: FULL MAIN Kinfolk Social in `kinfolk-social/` only. Kinfolksworld excluded.

## Verified starting point
- Continued from isolated Recovery370 draft PR #67, exact head `080736582c8e9ec03cc7989ec793d8da5f4e4f27`. No restart, merge, or production deployment.
- Inspected latest recovery branch, README and Recovery370, effective Phase95 login handler, Phase79 signup preflight, existing synthetic Auth tests, native package gate, Library continuation notes and Vercel preview history.
- Recovery370 preview `https://kinfolk-social-demo-1u7ks3p2x-alstoda59-9779.vercel.app/` is READY at intermediate commit `5ba4299173ef574cf9ab4050747f9ab1e0c577ac`, not Recovery370 final head.
- Read-only isolated Supabase `Kinfolk Social Alpha Test` (`viantpfagtbgyyzavmtv`) has 0 Auth users, 0 confirmed users, and 14/14 public tables with RLS enabled. This does **not** prove actual cross-account RLS enforcement.

## Actual application change
- Phase95 login used an unbounded `sb.auth.getSession()` before requesting a password token and again before session adoption. On a stalled mobile Auth storage/refresh request, the login button could stay disabled indefinitely.
- The effective `currentAccountId()` now rejects after a 15-second deadline. A later successful `getSession()` response cannot authorize the timed-out login attempt.
- A malformed Auth response missing an explicit `session` field, or a non-null session lacking a valid account ID, now fails closed instead of being interpreted as logged out.
- Normal empty sessions still allow login; a real active account still triggers the existing account-switch guard. Older timerless synthetic VM fixtures remain supported.
- No changes to password submission, Supabase configuration, profile/music, Home/Reels/Channels, posts, messaging, teen safety, native UI, or dark mobile styling.

## Code and verification boundaries
- Application commit `3e50e699a0fd57fec0c8d10f139a22401ca1f69c`.
- Synthetic source-executed tests commit `2eabbf11eeeb5cbb2c57ff49b0d084c7589bf686`: stalled and late preflight, normal empty and active sessions, missing/malformed results, Auth errors, timerless fixture and login ordering.
- Native Android/iOS source gate commit `fcfbfd105a3637b1cd4f31b3b5736d102345a6f6`.
- GitHub Actions CI and exact-commit Vercel preview are **not yet verified** at the time this note was authored; check the final branch head and report actual results rather than assuming success.
- Tests use synthetic accounts only; no real Auth signup, email delivery, Supabase writes, or physical-device testing.

## Release boundaries
- No shared live Supabase schema/data/auth/security, production deployment or aliases, Kinfolksworld, real accounts, billable resources, or app-store submissions changed.
- Real isolated email confirmation and callback, two confirmed synthetic users for RLS enforcement, backend-connected media/messaging/notifications, native deep links and physical Android/iPhone QA, and signed installable artifacts remain unverified. **NOT launch-ready.**
