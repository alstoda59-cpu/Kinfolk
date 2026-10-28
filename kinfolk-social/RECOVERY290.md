# Recovery290 | Bound stalled private Reels signing

Date: 2026-10-28 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social in `kinfolk-social/` only. Kinfolksworld excluded.

## Baseline inspected
- Recovery289 branch final commit `1ee0ce90eccc61259ceda03c37c617e9f7973baf`, `RECOVERY289.md`, README, Reels implementation and 287–289 tests, native verification script, Library continuation notes and Vercel preview deployments.
- Existing isolated Supabase `Kinfolk Social Alpha Test` project `viantpfagtbgyyzavmtv` was listed read-only as `ACTIVE_HEALTHY`; the separate shared live `Kinfolk` project `zojajuzmfjpvubzibzgg` was not modified.

## Application and regression changes
- `991137c3db956ce0c26465efd88bf24b2b7b2bac`: bound each private media signing attempt to 3.5 seconds (configurable for synthetic tests, clamped to 10 seconds). A hung signature now yields an unavailable slide and allows the existing four-worker queue to continue instead of freezing the entire feed. Reject non-string signer results; preserve URL scheme checks, account-generation cancellation and dark mobile design.
- `105b0e909644886b8a94cb1f001d9dafb39ac02b`: add three Node regressions for hung signatures, navigation cancellation and invalid signer results, while supplying timers to the existing Reels signing harness.
- `0c520b56a3d6bae43550332f9aa9cad7bd9c9ff2`: supply timers to account-switch synthetic harness.
- `2c4360e85261e7b763a369479b00123bab0d8590`, `865a5fd20cc37ba86eedb926cb452e09b324346c`: repair existing mobile viewport and hostile URL synthetic harness timers.
- `9ec5665a97ee8f898ab34f9739627739076d03a7`: align outdated Recovery201 navigation assertion with Recovery289 bounded reactions helper, retaining the guard.

## Evidence and limitations
- Local Node 22 synthetic helper scenarios: **3/3 passed** for hung signing, ordered bounded concurrency, and continuation after failure. This was a copied helper test, not the committed full suite.
- Initial GitHub Actions source run `40696334167` failed 9 of 342 synthetic Node tests due to missing timers in old VM fixtures and one outdated static assertion. Those fixtures were corrected in the commits above. The replacement run must be checked for completion; do not claim CI success without its final result.
- Nonproduction Vercel previews were READY for the application and test commits; READY is not real signed-video playback or backend proof.
- Real synthetic-account signup/email confirmation, two-account RLS/teen privacy, functional-backend native builds and physical Android/iPhone QA remain unverified. No live Supabase, production, Kinfolksworld, paid infrastructure or store changes.

## Next
1. Verify final Recovery290 source CI and native verification against exact commit; fix any remaining failures without weakening guards.
2. Validate isolated-backend auth and RLS with synthetic accounts and approved HTTPS callback, then native functional builds and physical-device QA.
