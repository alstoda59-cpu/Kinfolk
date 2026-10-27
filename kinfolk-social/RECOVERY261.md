# Recovery261 | Verification resend transient retry

Date: 2026-10-27 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social `kinfolk-social/` only, excluding Kinfolksworld.

## Baseline and inspection
- Continued from Recovery260 final commit `a023cee623e011294c1b63c3e5417f517b163385`. Reviewed current recovery and alpha branches, Recovery260/259 notes, Phase79 source and synthetic test harness, native README, Library Recovery226/232 notes, and Vercel deployment metadata.
- Recovery260 final nonproduction preview was READY. Separate designated alpha Supabase project `viantpfagtbgyyzavmtv` is ACTIVE_HEALTHY on a read-only project check. No backend mutations.
- Existing verification resend set a one-minute cooldown *before* requesting mail and kept that cooldown after network errors and HTTP 5xx failures, even when no resend was confirmed. This unnecessarily blocked immediate recovery from transient outages.

## Implemented
- `5e2cb055353478f40815007f7f328e36a765a5a1`: Phase79 clears the client-side resend cooldown after missing-status/network, HTTP 408, and HTTP 5xx failures. Keeps cooldown for HTTP 429 and other explicit client errors; keeps the existing duplicate-click busy lock and neutral delivery wording.
- `a8da4d31d7d2500bf4a9e0bf20803faa7f9f7f35`: two additional synthetic tests, one proving retry succeeds immediately after HTTP 503 and one proving HTTP 429 does not permit immediate retry. Existing harness now supports synthetic resend responses.

## Verification evidence
- Re-fetched exact committed GitHub blobs: Phase79 `047681ce7a2cac00743cdbf8075af8f975649658` and test `1fd5b0bf2f70e5971e5499ab230a05b854ffca80`.
- **15/15** tests passed in a synthetic V8 adapter executing exact committed source and test file with a mocked DOM/Auth and URL shim. The source compiled successfully in the adapter. This is **not** a Node test-runner execution, full GitHub Actions CI, real browser, email delivery, backend signup or physical-device test.
- Vercel reports **READY** for the test commit `a8da4d31`: https://kinfolk-social-demo-gxdifyl6j-alstoda59-9779.vercel.app/ (nonproduction target null). READY is deployment status, not application functional proof.
- GitHub PR-filtered workflow lookup returned zero runs for `a8da4d31`; full CI remains unverified.

## Remaining blockers
- Real isolated synthetic-account signup, email confirmation, login/logout/session restoration and two-account RLS fixture tests.
- Integrated Home/Reels/Channels, media/posts/comments, profile music/themes, messaging/notifications, teen privacy and storage tests.
- Functional Capacitor Android/iOS packaging, native deep-link callback validation, physical Android/iPhone QA and store approval.
- No production deployment or alias change, shared live Supabase schema/data/auth/security modification, Kinfolksworld edit, paid resource change or store submission.
