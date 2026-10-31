# Recovery372 | Hard deadline for password-token login and JSON body

Date: 2026-10-31. Scope: FULL MAIN Kinfolk Social in `kinfolk-social/` only; Kinfolksworld excluded.

## Starting evidence and nonduplication
- Continued from Recovery371 draft PR #68, exact head `349ba8d023afda30a1aabea22f18c2a6c5eef144`, on a new isolated branch. Inspected latest Recovery branches, PR, README, Recovery371/370 reports, effective Phase95 login handler, synthetic tests, native package source gate, Library continuation notes, Vercel previews and isolated Supabase project.
- Recovery371 CI run `41210643095` previously reported SUCCESS (900 Node tests); this is inherited evidence, not Recovery372 CI.
- The most recent inspected READY Vercel nonproduction preview is `https://kinfolk-social-demo-k1pjctgil-alstoda59-9779.vercel.app/` at Recovery371 intermediate commit `d2d28c0f197136555ce8638e091d20fc2f3c6409`. This does not prove Recovery372 deployment or functional signup.
- Read-only isolated project `viantpfagtbgyyzavmtv`: 0 Auth users, 0 confirmed users, 14 public tables and 14 with RLS enabled. These facts do not establish two-account RLS enforcement.

## Actual application fix
- Phase95 password-token login previously relied only on `AbortController.abort()` after 15 seconds. A fetch wrapper, service worker or response-body reader that ignores abort could hang indefinitely or resolve after the intended deadline, allowing a stale login response to continue.
- `tokenLogin` now races the complete request plus JSON body read against a hard 15-second deadline. The timer aborts the request, but the race itself rejects even if abort is ignored. Late fetch/JSON success cannot authorize that timed-out login.
- Existing HTTP error mapping, email identity and confirmation checks, response completeness, input guards and Stay Logged In ordering remain unchanged.
- No UI redesign, Supabase configuration, backend writes, production deployment, Kinfolksworld, paid resources, or app-store changes.

## Changes and tests
- Application: `e443905595bf5f92a7b822dfbc9e4b6410c9f817`.
- Synthetic source-executed regression file: `7e30bfa13656d898f092b6e18f2e26095c27d8dc`, ten tests covering hung fetch, hung JSON, late successes, valid confirmed login, invalid credentials, wrong/unconfirmed identity, network failures, malformed response, and Stay Logged In ordering.
- Native Android/iOS source gate: `8863663ad581faab6b84be2bb8cf32ebb4e8b662`.
- Direct V8 source syntax validation and three synthetic runtime smoke cases (valid token, hung fetch, hung body) passed before this note. This is NOT Node CI, browser QA, a real Supabase test or physical-device testing.
- Recovery372 exact-head CI and READY preview must be checked after PR creation; do not infer success from earlier Recovery371 runs.

## Release blockers
Real isolated signup/email delivery and callbacks, two confirmed synthetic accounts with RLS fixtures, backend-connected uploads/messaging/notifications, signed installable Android/iPhone packages and physical-device QA remain unverified. Native offline packaging is not a functional backend build. Vercel previews remain fail-closed against shared live Supabase until isolated configuration is approved. **NOT launch-ready.**
