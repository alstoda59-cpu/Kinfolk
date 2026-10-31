# Recovery363 | Functional alpha must execute two-account RLS verification

Date: 2026-10-31 America/Los_Angeles. Scope: FULL MAIN Kinfolk Social in `kinfolk-social/`, excluding Kinfolksworld.

## Verified starting point

- Based on Recovery362 branch commit `dd07d321b50cc4989b1b47df1d829ea4f73b6945`; reviewed Recovery360/362, the real-signup smoke probe, native functional gate, RLS probe and tests, source CI, Vercel preview history, and Library recovery notes.
- Recovery362 reported real HTTP calls to the isolated Supabase project `viantpfagtbgyyzavmtv`: Auth settings HTTP 200, but signup rejected (initial missing birthday HTTP 500, corrected reserved-email attempts HTTP 400). No confirmed synthetic account or email delivery established.
- Isolated Supabase project `viantpfagtbgyyzavmtv` was listed ACTIVE_HEALTHY. Shared live project `zojajuzmfjpvubzibzgg` was not modified.
- Most recent READY nonproduction Vercel preview inspected: `dpl_6Qoy5NfbApNgjUAJhzzfm9m8qLSz`, from Recovery362 intermediate commit `4059d453f498fe332cbeb3275adbae63beee2fa0`, target null. It does not contain Recovery363 and is not device/backend E2E proof.

## Implemented

1. Added `native/scripts/functional-rls-gate.mjs`. It requires explicit `KINFOLK_ALPHA_SYNTHETIC_ACCOUNTS_ONLY=1` and both synthetic JWT/ID pairs, calls the actual read-only `verifyTwoUserRls` function, and refuses an incomplete proof.
2. Updated `native/scripts/verify-functional-alpha.mjs` to **await the executed RLS gate**, not merely import a module whose real probe only runs under a direct CLI guard. It checks the generated native package first and isolated Auth signup readiness afterward.
3. Added `native/tests/alpha-functional-rls-gate.test.mjs`: five-table/two-owner/anonymous read paths, missing opt-in or JWT, missing owner fixture, cross-account exposure, anonymous exposure and foreign-backend refusal. Wired into `alpha:verify` and `alpha:functional:gate:test`.
4. Strengthened the existing functional-backend regression to reject a return to the import-only bypass. Corrected an inaccurate smoke-test assertion that had assumed any generic email domain proves a non-synthetic user; the actual opt-in and approved inbox are separate requirements.
5. Opened unmerged draft PR #60 against Recovery362. No production promotion, alias changes, store submission, Kinfolksworld changes, or shared live Supabase mutations.

## Verification and limits

- Source CI automatically runs synthetic Node and mocked-browser suites, plus native web asset verification. The exact final-head result must be checked after this documentation commit. Previous intermediate CI runs were cancelled by later branch commits; cancellation is not a pass.
- **No actual two-account RLS pass**: requires two owner-approved confirmed synthetic accounts, JWTs and private-row fixtures in the isolated backend. The functional gate is intentionally blocked without them.
- No successful real signup/email callback, login/logout/session restoration, uploads, messaging, notifications, teen safety, physical Android/iPhone QA, signed iPhone IPA or store acceptance proof.
- The Recovery363 source change is a fail-closed release gate, not a new user-facing feature or a launch-ready build.

**NOT launch-ready.** Preserve isolated draft status and obtain owner approval for deliverable test inbox and any cost before further backend test provisioning.
