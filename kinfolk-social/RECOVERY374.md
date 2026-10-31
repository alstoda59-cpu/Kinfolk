# Recovery374 | Album ownership preflight before media storage

Date: 2026-10-31. Scope: full MAIN Kinfolk Social in `kinfolk-social/`, excluding Kinfolksworld.

## Starting point and inspections
- Continued from Recovery373 draft PR #70, exact final head `236ee2bb1f69fff5ad62f5a8a47d7760551ee08b`, without merge, restart or redesign.
- Inspected Recovery373/372 reports, README, effective Phase106 album upload helper, Recovery373 and Recovery236 synthetic tests, Library prelaunch/continuation notes, latest nonproduction Vercel deployments, and read-only isolated Supabase alpha tables.
- Latest inspected Vercel nonproduction READY deployment is `https://kinfolk-social-demo-lbsrrbshk-alstoda59-9779.vercel.app/` at Recovery373 intermediate commit `bb797793e98baced58c3f40a4c94ee61f38712b2`. This is not a Recovery374 preview or a functional test.
- Isolated alpha Supabase `viantpfagtbgyyzavmtv` has 14 public tables, all RLS-enabled and empty. `photo_albums` and `album_photos` are missing. No isolated backend schema or users were changed.

## Application fix
- Phase106 `addOne` now queries `photo_albums` for the exact `id,owner_id` before any `kinfolk-media` storage upload. The returned album ID and owner must match the initiating account.
- The initiating session/form is checked both before and after the asynchronous ownership lookup. Missing, foreign-owned, mismatched, RLS-rejected, or stale-session lookups fail closed without creating a storage object.
- The existing exact-row-count insert acknowledgment, cleanup of confirmed unlinked media, ambiguous-commit preservation, 5 MB photo preflight, and dark mobile design are preserved.
- This client preflight is defense in depth, **not** a substitute for real Supabase RLS. Album uploads remain backend-blocked until reviewed schema parity and two-user RLS tests are completed in the isolated project.

## Source and synthetic verification
- Application: `bca9d819c86fa3be82d8ae0fed8f5418e87c4022`.
- Six additional source-executed cases in the existing Recovery373 native media source gate: `91ae2d80748ed405d53f5101cd01b9fd2d34f736`. They cover ordering, foreign owner, missing album, mismatched ID, lookup error and account switch.
- Historical Recovery236 fixture now models the ownership read: `200fe29c524619288a0ffc9a1bb38208d6e9548a`.
- CI and exact-head preview status must be checked after the final commit; do not report inherited Recovery373 results as Recovery374 results.

## Boundaries and blockers
No shared live Supabase schema/data/auth/security, production aliases or deployments, Kinfolksworld files, real accounts, paid resources or app-store submissions were changed. Real email verification, two-account RLS, backend media/messaging, native signed Android/iOS builds and physical-device QA remain unverified. **Not launch-ready.**
