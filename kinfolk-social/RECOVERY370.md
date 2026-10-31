# Recovery370 | Bound mobile signup preflight before sending credentials

Date: 2026-10-31. Scope: FULL MAIN Kinfolk Social under `kinfolk-social/` only. Kinfolksworld excluded.

## Verified starting point
- Continued from Recovery369 exact head `59cb57c64df19ce3da0257e98d24cbba6daa620c`, isolated draft PR #66, without merge, restart or redesign.
- Inspected latest branch/PR, Recovery369 and Recovery368 reports, effective Phase79 signup, existing preflight and Auth deadline source tests, native package source gate, Library prelaunch notes, and Vercel nonproduction preview history.
- Recovery369 GitHub Actions run `41201686109` completed successfully at its exact head (884 main Node tests). Its latest READY preview is `https://kinfolk-social-demo-ce5pwcr48-alstoda59-9779.vercel.app/` at earlier commit `294de1e0`, not exact Recovery369 head.
- Read-only isolated Supabase `Kinfolk Social Alpha Test` project `viantpfagtbgyyzavmtv`: 0 Auth users, 0 confirmed users, 14/14 public tables with RLS enabled. This does not establish actual cross-account RLS enforcement. The shared live `Kinfolk` project was not queried or changed.

## Actual application fix
- The existing Phase79 `requireNoActiveSignupAccount()` checked Supabase `getSession()` before sending credentials. If that preflight hung on a mobile connection, the Create Account button stayed disabled indefinitely, even though Recovery369 bounded later Auth calls.
- The effective runtime now bounds the entire preflight to **15 seconds**. A timeout rejects with a retry message and cannot authorize `signUp`, even if the underlying request resolves later. Success, signed-in rejection, malformed Auth responses and Auth errors all clear the deadline.
- Existing account/session safety, teen age gates, signup identity and email verification, dark mobile UI, Home/Reels/Channels, profile/music, posts, messages, communities and native code remain unchanged.

## Source and test commits
- `2d722815ebb388ee34328260dd1fe1e890fcb573`: effective mobile signup preflight timeout.
- `7ac06d9e0ed3faa011f1cd369debe39f25b6e15e`: seven source-executed synthetic tests for hung and late `getSession`, success, signed-in rejection, malformed result, Auth failure and preflight ordering.
- `5ba4299173ef574cf9ab4050747f9ab1e0c577ac`: wire the new tests into Android/iOS native alpha source verification.
- CI status for Recovery370 must be checked at its final exact head. Synthetic tests do not prove real email delivery, backend Auth/RLS or physical devices.

## Protected boundaries and release blockers
- No shared live Supabase schema/data/auth/security, production deployment/aliases, Kinfolksworld, real-user accounts, billable resources or app-store submissions were changed.
- Real email confirmation and callback, two confirmed synthetic accounts for RLS enforcement, backend-connected media/messaging/notifications, native deep-link and physical Android/iPhone acceptance, and signed installable artifacts remain unverified. **NOT launch-ready.**
