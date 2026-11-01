# Recovery391 | Bound duplicate signup risk after uncertain Auth responses

Date: 2026-11-01 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social in `kinfolk-social/` only. Kinfolksworld excluded.

## Verified continuation
Continued from Recovery390 exact commit `49b7a20b3989da10ace21c559cd2441de82f85c9`, draft PR #87, and its completed successful source CI run `41297844735`. Reviewed Recovery389/390 notes, effective Phase79 signup handler and existing source tests, native auth gate, Library continuation notes, and nonproduction Vercel preview. No restart or merge.

## Actual application fix
When `sb.auth.signUp` has been dispatched, a failed fetch, connection reset, timeout, HTTP 408, or HTTP 5xx response may leave the account creation result unknown. The existing handler previously surfaced a generic error and allowed an immediate duplicate Create Account request. The effective `kinfolk-phase79.js` catch handler now imposes a 60-second retry cooldown for these ambiguous failures and directs the member to check the original inbox or try login before retrying. Known HTTP 4xx validation and 429 rate-limit errors retain their normal correction messages. Preflight failures before dispatch do not trigger this cooldown. Existing stale-screen and edited-form guards remain ahead of the new branch.

Source commit: `0c37815c02f0c45c1c9ca4d2f2b58614274b6afc`.

## Regression coverage and packaging
`tests/recovery391-signup-uncertain-error.test.mjs` source-executes the effective catch branch with synthetic transport, 408, 503, validation, rate-limit and preflight cases. Added to existing `native/package.json` `alpha:auth:source:test` for Android/iOS verification; no duplicate test runner. Test commit: `1161dac3378721f585f2c4c7989e75961b4562f0`; native gate commit: `c9c75f4d2065401bf033feb435696fd0c4866793`. A local isolated execution of the extracted source branch confirmed the intended behavior; full GitHub CI must be verified separately.

## Evidence boundaries
Read-only isolated Supabase Alpha Test project `viantpfagtbgyyzavmtv` is ACTIVE_HEALTHY, with 0 Auth users and RLS enabled on all 16 public tables. This is not proof of two-user enforcement, real email delivery, or end-to-end login. No approved deliverable synthetic inbox was supplied, so no real signup was initiated. Nonproduction preview READY status and source CI must be checked against the exact final commit independently. No physical Android/iPhone device testing or signed store-ready packages were performed.

No changes to shared live Supabase schema/data/auth/security, production deployments or aliases, Kinfolksworld, paid infrastructure, real accounts, or app stores. No Supabase project or organization created.

## Remaining alpha blockers
Real synthetic email confirmation and restored sessions; authenticated two-user JWT/RLS checks; backend-connected posts/media/messaging/notifications; signed installable Android/iPhone packages; and physical-device QA. **Not launch-ready.**
