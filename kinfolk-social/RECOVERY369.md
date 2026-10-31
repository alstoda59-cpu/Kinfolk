# Recovery369 | Bound authoritative signup verification on mobile

Date: 2026-10-31. Scope: FULL MAIN Kinfolk Social under `kinfolk-social/` only. Excludes Kinfolksworld.

## Verified starting point
- Continued from Recovery368 isolated branch `kinfolk-social/recovery368-authoritative-signup-session-20261031`, exact head `3a9e199a22d4e9a1acb815c200f9adc4d09c2258`. Recovery368 draft PR #65 remains unmerged.
- Read Recovery368/367/366, effective Phase79 signup runtime, existing synthetic source tests, native alpha package scripts, prior Library security notes, GitHub branches/PRs, and Vercel preview history.
- The separate `Kinfolk Social Alpha Test` Supabase project `viantpfagtbgyyzavmtv` is ACTIVE_HEALTHY. A read-only query found 0 Auth users, 0 confirmed users, and 14/14 public tables with RLS enabled. This is not RLS enforcement proof. Shared live `Kinfolk` project `zojajuzmfjpvubzibzgg` was not queried or modified.
- Recovery368 had passing source CI (run 41197297245); its last READY preview was at an intermediate commit, not its exact head.

## Substantive mobile runtime correction
- Recovery368's `signupSessionIsCurrent` verified the signup token remotely and rechecked the local session before saving Stay Logged In, but an indefinitely pending `getSession` or `getUser` could leave the mobile signup button spinning forever.
- Recovery369 adds one 20-second deadline around the **entire** first local session read, remote authoritative `getUser(token)`, and final local session recheck. A timeout fails closed with a sign-in-again message and cannot authorize preference persistence or cleanup sign-out. Timer is cleared for success, identity mismatch, Auth failure and timeout.
- The original ID/email/confirmed-email/token checks remain in place. The UI, dark mobile design, Home/Reels/Channels, profile/music, media, messaging, communities, teen defaults and privacy policy code are preserved.

## Code and synthetic tests
- `d3eb4b573ad96bd48ac431be35a24552561a7422`: mobile signup Auth verification deadline.
- `f116eefba7acd7d108c1fd3ca518855633274399`: six deterministic source-executed tests, including hung first read, remote token lookup, last read, success/error cleanup and persistence ordering.
- `05d36679b0c4028ae9b55628a3b85ddddb02ba52`: include new tests in native Android/iOS alpha source gate.
- New tests simulate the 20-second deadline with fake browser timers and synthetic users only. They do **not** send emails, connect to Supabase or exercise physical devices.
- The Vercel nonproduction preview for `05d36679` is READY: `https://kinfolk-social-demo-2p844d5qt-alstoda59-9779.vercel.app/`. This confirms deployment only; source CI and functional verification require separate evidence.

## Protected boundaries and remaining work
- No live/shared Supabase schema, data, auth or security changes; no production deployment/alias, Kinfolksworld, paid resources, store submissions or real-user accounts.
- Still missing real email confirmation and approved test inboxes, two isolated confirmed synthetic users and private-row RLS fixtures, backend-connected media/messaging/notifications, and physical Android/iPhone acceptance. No signed or device-tested installable alpha has been proven. **NOT launch-ready.**
