# Recovery352 | Token-bound failed-login rollback on Android/iPhone alpha

Date: 2026-10-30 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social in `kinfolk-social/` only. Continued from Recovery351 exact head `285442ea5f70f6179ab2fab9e74ea1b21d680fba`. Isolated branch `kinfolk-social/recovery352-login-rollback-token-identity-20261030`. No merge, production release or store submission.

## Starting point and verification boundary

- Inspected the latest Recovery351 branch, open draft PR #49, `RECOVERY351.md`, README, the effective Phase95 login runtime, prior Recovery330-335 login rollback tests, native alpha verification scripts, Library prelaunch/diagnostic notes, and nonproduction Vercel previews.
- Recovery351 exact-head source workflow `41130852738` was SUCCESS; this is synthetic CI, not real backend authentication or physical-device QA.
- Vercel READY deployments observed for intermediate Recovery351 commits, including `76ea16930489292230501bdc445ca28fd231bb9f`; READY does not prove final-commit functionality.
- The designated isolated Supabase project `viantpfagtbgyyzavmtv` was healthy when listed. Shared live project `zojajuzmfjpvubzibzgg` is explicitly out of scope.

## Substantive application change

- `kinfolk-phase95.js`: the effective failed-login rollback previously checked only account ID before calling local Supabase sign-out. An old login could therefore sign out a newer session belonging to the same user.
- Rollback now requires an exact access-token match **as well as** account ID and no pre-existing account. It checks the active session twice before calling `signOut({scope:'local'})`, so a newer same-user session observed during either read is preserved. Missing token or session-read failure fails closed without clearing an unrelated session.
- If Supabase `setSession` adopts an unexpected user, the error carries the actual adopted access token for scoped cleanup. After a failed account activation, cleanup receives the verified adopted session's access token.
- This narrows stale sign-out races but cannot make an independent Supabase `getSession` and `signOut` atomic. Real backend/account-switch testing is still mandatory.

## Synthetic regression and packaging integration

- Added nine source-extracted tests in `tests/recovery352-login-rollback-token-identity.test.cjs` covering exact-token cleanup, same-user token replacement, replacement between reads, different users, missing tokens, pre-existing accounts, read errors and both rollback call paths.
- Updated the earlier Recovery332 adopted-session fixture to model access tokens, preserving the previously tested mismatched-user cleanup path.
- Added Recovery352 tests to the native `alpha:auth:source:test` gate and enabled the isolated branch for offline-only Android/iOS native CI. The packaging backend remains an unreachable CI placeholder, not the live backend.

## Separate acceptance gates

Record exact-head source CI, native Android debug APK and iOS Simulator compilation, and Vercel preview readiness separately once their jobs finish. None is proof of real email delivery, signup, logout, session restoration, Supabase RLS or physical-device functionality. Physical iPhone installation still requires an appropriately signed IPA.

Real isolated Supabase signup/email confirmation, two-synthetic-account RLS and private-media access, backend-connected posts/uploads/messaging/notifications, teen-safety enforcement, missing Community/Channel/group tables, functional native packaging and physical-device QA remain open. No shared live Supabase schema/data/auth/security, production Vercel deployment/aliases, Kinfolksworld files, paid infrastructure or stores were changed.
