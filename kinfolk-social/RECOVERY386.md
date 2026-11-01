# Recovery386 | Cross-account RLS checks must prove authenticated row filtering

Date: 2026-10-31 (America/Los_Angeles). Scope: full MAIN Kinfolk Social under `kinfolk-social/`; Kinfolksworld excluded.

## Verified continuation
Continued directly from Recovery385 final commit `5b124869c44651df28a7ee54a45f1b4f594348b1` and draft PR #82. Verified GitHub Actions run [41273215860](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41273215860) concluded SUCCESS with the source-check job and all reported steps successful. Inspected the latest Recovery report, RLS verifier and regression suite, native package scripts, historical Library notes, branch history, Vercel nonproduction previews and read-only isolated Supabase state. No restart, merge, redesign, or production changes.

## Actual source and tests
- Source commit `b2b331120dfb53faf27d330eb9cab99a5f3c1264` in `native/scripts/verify-two-user-rls.mjs`: an authenticated cross-account HTTP 401/403 now fails the privacy acceptance probe. Such a denial could mean the synthetic JWT became invalid or expired, rather than that RLS hid the other account's row. Authenticated cross-account probes must return HTTP 200 with an empty JSON array; anonymous HTTP 401/403 remains acceptable.
- Regression commit `7ddc767e86e59066600e12c61f2620c9cc1f4ec0` in `native/tests/alpha-two-user-rls.test.mjs`: both authenticated 401 and 403 are rejected; anonymous 403 remains acceptable after authenticated owner and cross-account reads. Existing `native/package.json` `alpha:rls:test` and `alpha:verify` gates remain unchanged.
- Isolated draft PR [#83](https://github.com/alstoda59-cpu/Kinfolk/pull/83) targets Recovery385, unmerged.

## Evidence boundaries
- Exact test-commit nonproduction Vercel deployment [READY](https://kinfolk-social-demo-ej5i935ht-alstoda59-9779.vercel.app/) at `7ddc767e86e59066600e12c61f2620c9cc1f4ec0`. READY is deployment status, not a real authenticated browser or device test.
- GitHub Actions for Recovery386 had not returned a matching workflow run at the time of initial verification. Do not claim CI success until an exact-SHA completed run is observed.
- Read-only isolated Supabase Alpha Test `viantpfagtbgyyzavmtv`: ACTIVE_HEALTHY, 0 Auth users, 16/16 public tables with RLS enabled, security advisor 0 lints. Table-level RLS configuration is not two-user enforcement proof.
- No approved deliverable synthetic inbox or two authenticated test JWTs/fixtures were available. No real email delivery/confirmation, two-user RLS enforcement, backend-connected media/messaging, signed native builds or physical Android/iPhone QA was completed.
- No changes to shared live Supabase schema/data/auth/security, production deployment or aliases, Kinfolksworld, paid resources, real accounts, or app-store submissions.

**Not launch-ready.** Next: verify Recovery386 source CI; obtain approved synthetic inbox and run opt-in isolated signup and email confirmation; establish two distinct authenticated fixtures for actual RLS enforcement; complete backend-connected Android/iPhone native acceptance and physical-device QA.
