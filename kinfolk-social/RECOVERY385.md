# Recovery385 | Hard deadline for real isolated synthetic signup smoke

Date: 2026-10-31 (America/Los_Angeles). Scope: full MAIN Kinfolk Social under `kinfolk-social/` only. Kinfolksworld excluded.

## Verified continuation
Continued from Recovery384 exact commit `3b64e059049db3b662fb56f70c403171bad519e4`, draft PR #81, successful source CI run 41269178553 and exact-SHA READY nonproduction Vercel preview. Reviewed latest Recovery report, native Auth/functional gate scripts, existing synthetic signup tests, native package test commands, Library continuation notes, GitHub branch history and Vercel previews. Isolated Supabase Alpha Test project remains ACTIVE_HEALTHY by read-only listing. No restart or redesign.

## Actual changes
- `native/scripts/verify-real-signup-smoke.mjs`: each GET settings, POST signup and POST unconfirmed password-login check now races the entire fetch and JSON body read against a hard deadline, not just AbortController. An abort-ignoring network adapter or body reader cannot indefinitely hang the opt-in real synthetic signup acceptance probe. Timeout values must be safe integers between 1 and 60000 ms before any network request.
- `native/tests/alpha-real-signup-smoke.test.mjs`: three new synthetic regression cases for stalled signup fetch, stalled signup JSON body, and invalid deadlines without network access. Existing native `alpha:auth:source:test` already runs this file; no parallel runner added.
- Source commit `de3f74083583464f172a12c5db81d9079f01efa8`; regression commit `a54d6232d66e740f24a3eb9c8cf1633f8a79e135`.
- Draft PR #82 targets Recovery384; unmerged. No backend writes or account creation performed in this recovery.

## Evidence and release boundaries
- Source CI run [41273172243](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41273172243) was in progress at note creation; its Node regression step had passed. Do not claim full CI success until final conclusion is checked.
- [Nonproduction READY preview](https://kinfolk-social-demo-fzmz1i7ak-alstoda59-9779.vercel.app/) is associated with exact regression commit `a54d6232d66e740f24a3eb9c8cf1633f8a79e135`. READY only means deployment completed, not a real Auth or device test.
- Isolated Supabase project `viantpfagtbgyyzavmtv` was listed ACTIVE_HEALTHY. No synthetic test inbox was approved or accessed, so no real signup/email confirmation, authenticated two-user RLS, backend media/messaging, signed APK/IPA, or physical-device QA was performed.
- No shared live Supabase schema/data/auth/security, production deployment or aliases, Kinfolksworld, paid resources, real accounts or store submissions were changed.

**Not launch-ready.** Next: verify full CI for this branch; obtain approved deliverable synthetic inbox and use opt-in isolated Auth smoke; establish two authenticated fixtures for RLS; then complete backend-connected Android/iPhone QA.
