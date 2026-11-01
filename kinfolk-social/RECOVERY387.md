# Recovery387 | Reject already-confirmed isolated signup responses

Date: 2026-10-31 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social under `kinfolk-social/` only. Kinfolksworld excluded.

## Verified continuation
Continued from Recovery386 exact commit `4e15892e14ad113c9f987414bbe4abdbfb0454a3`, unmerged draft PR #83. Verified GitHub Actions run [41276764183](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41276764183) completed SUCCESS with the source-check job and all 47 reported job steps successful. Reviewed Recovery386, the existing isolated signup smoke verifier and its tests, native package scripts, earlier Library continuation notes and latest nonproduction Vercel deployments. No restart, production merge or redesign.

## Actual source and test changes
- `native/scripts/verify-real-signup-smoke.mjs` now rejects a signup response containing `user.confirmed_at`, even if `user.email_confirmed_at` is null. A general confirmed timestamp is not evidence of a fresh unconfirmed email signup and must not be accepted by the isolated verification gate.
- `native/tests/alpha-real-signup-smoke.test.mjs` adds a synthetic regression with matching email identity, `confirmed_at` set, `email_confirmed_at` null and no session. It requires rejection **before** the password-token request.
- Source commit `bd04b7d18870c0b3352cc62bb4321b3e3a54a9f8`; regression commit `63635e3b4154fefd5b2a48d7d175c997463777dc`. Existing native `alpha:auth:source:test` already includes the smoke test, so no duplicate runner was introduced.

## Evidence boundaries
- GitHub Actions and Vercel for the final Recovery387 commit must be verified independently. A READY deployment proves only preview build status, not authenticated functionality.
- No real synthetic signup was executed; approved deliverable test inbox and authenticated owner fixtures are still missing. No backend-connected uploads, messages, signed installable Android/iPhone packages or physical-device QA established.
- No shared live Supabase schema/data/auth/security, production deployments or aliases, Kinfolksworld, paid resources, real user data or app stores changed.

**Not launch-ready.** Next: verify Recovery387 CI and preview at exact SHA; establish approved synthetic inbox, email confirmation and two authenticated fixtures in the isolated backend; run real RLS and native acceptance tests.
