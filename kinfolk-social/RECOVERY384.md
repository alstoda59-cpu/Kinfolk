# Recovery384 | Strict isolated Auth settings recognition

Date: 2026-10-31 (America/Los_Angeles). Scope: full MAIN Kinfolk Social under `kinfolk-social/` only; Kinfolksworld excluded.

## Continuation and actual change
Continued from Recovery383 exact commit `8a4d798a3275eaf54556e50025a37f472a31065b`, draft PR #80, after inspecting current native Auth verifier, source tests, package gates, recent GitHub Actions, Library continuation notes, isolated Supabase project details, and Vercel preview history. No restart or redesign.

- `native/scripts/verify-isolated-auth.mjs`: Auth settings response recognition now requires a non-array `external` object and boolean `disable_signup` and `mailer_autoconfirm` settings together. Previously a single present field could pass the reachability probe. Functional signup readiness still additionally requires enabled email provider and explicit confirmation.
- `native/tests/alpha-auth-reachability.test.mjs`: valid synthetic response fixtures now provide all fields, with explicit partial-settings rejection cases.
- `native/tests/alpha-auth-signup-readiness.test.mjs`: replaces the obsolete partial-response compatibility assertion with fail-closed cases and complete-response acceptance.
- Commits: source `416e85443b3b9bc3c9355e03b737cea505d37fdb`; reachability regressions `2af45aeb76e10dad3103166142adb08cee9683b6`; signup readiness regression `c30414190b6869beb8db164a04f1f8924e12b198`.
- Draft PR #81 targets Recovery383; unmerged.

## Evidence boundaries
- Initial source-only commit CI run [41267864145](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41267864145) **failed** at offline native package verification because preexisting test fixtures expected partial settings to succeed. Tests were corrected in subsequent commits. Do not count this run as passing.
- Corrected test commit CI run [41269137941](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41269137941) was **pending** when this note was written. Verify its final conclusion before claiming success.
- Nonproduction Vercel preview for source commit `416e8544` was READY; READY is build status, not authenticated app/backend/device proof. A preview for final test commit was still BUILDING at inspection.
- Isolated Supabase project `viantpfagtbgyyzavmtv` read-only project inspection reported ACTIVE_HEALTHY. No Auth account, email, cross-account RLS or device test was executed in this recovery.

## Remaining release gates
Real synthetic email signup and confirmation; login/logout/session restoration; authenticated two-user RLS enforcement; backend-connected media, messaging and notifications; signed Android/iPhone installation and physical-device QA. No production, shared live Supabase, Kinfolksworld, paid project, store or release alias changes. **Not launch-ready.**
