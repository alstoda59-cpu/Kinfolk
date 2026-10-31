# Recovery380 | Album submission locks follow authentication activation

Date: 2026-10-31. Scope: FULL MAIN Kinfolk Social in `kinfolk-social/`; Kinfolksworld excluded.

## Verified starting checkpoint
Continued from Recovery379 exact final commit `a58b0ac4b3b4829c8f1f5082ccd1d8d41cf8088a` and draft PR #76. Reviewed README, Recovery377-379, effective Phase106 create/add/viewer code, source-executed album tests, native Android/iPhone source gate, Library prelaunch notes, isolated Supabase Alpha Test and nonproduction Vercel READY preview. Did not merge or restart.

## Application change
The effective Phase106 module previously used a single boolean `busy` for Create Album and Add Photos. A stalled operation from an old login could block a new login from using album editors until the old request returned. If the lock were simply reset on reactivation, an old request's `finally` could then unlock an active newer request and permit duplicate writes.

Both effective submit handlers now store an operation lock carrying the initiating `kf129Epoch`. Duplicate submits in the same activation are suppressed. A new activation may start a new operation even while an older request remains pending. Only the operation owning the current lock may release it. Existing account/editor/epoch checks continue to prevent stale writes and success notifications. No UI redesign or unrelated features changed.

Two new source-executed synthetic regression tests exercise both Create Album and Add Photos with delayed old/new operations, same-activation duplicate suppression, stale completion and lock release. Added the test file to `native/package.json` `alpha:media:source:test`, which is part of offline Android/iOS source verification.

## Evidence and limits
- Application commit: `90938c1d5fd9dcc2ddfd43f28134e3a72faa6199`.
- Synthetic regression commit: `58832b0e19f6616c971da6c9fed078dbf2452c9e`.
- Native media gate commit: `85de05233ed4fa7ecdae6bc6009b9a0de3c21e4c`.
- CI and exact-head Vercel preview status require independent verification after this commit. These are source-executed synthetic tests, not real Supabase JWT/RLS, email delivery, signed APK/IPA or physical-device QA.
- Read-only isolated Supabase check at the start of this run: 16/16 public tables have RLS enabled; zero Auth users and zero album/photo rows. Two-account enforcement is unverified.
- No shared live Supabase schema/data/auth/security, production Vercel deployment/alias, Kinfolksworld, paid resources or store submissions were modified.

**Not launch-ready.** Next priorities remain real synthetic-account email verification, two-user RLS and backend-connected media/messaging, then native device QA.
