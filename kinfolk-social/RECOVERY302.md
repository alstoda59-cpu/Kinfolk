# Recovery302 | Account-isolated video upload composer

Date: 2026-10-28 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social under `kinfolk-social/` only; Kinfolksworld excluded.

## Inspected baseline
- Based directly on Recovery301 head `3878f5e08369408b6ca62fcddaac4c8f21b307f3`; inspected Recovery301 report, source and native package scripts, GitHub Actions failure logs, current Vercel previews and Library Recovery226/232 notes. Did not restart or duplicate previous account-isolation fixes.
- Recovery301 workflow run `40794582439` failed at a legacy reaction-lock source assertion; a later Recovery301 commit `3878f5e0` repairs that assertion, but a full passing workflow for the final branch is not established here.
- Read-only isolated Supabase project `viantpfagtbgyyzavmtv` has 14 public tables, all with RLS enabled, and private `kinfolk-media` and `kinfolk-video` storage buckets. `kinfolk_videos` is **absent**. No SQL writes or authentication changes.

## Implemented code
- `4c3fa0024a323ea095247f123cce05d5d987a200`: replace unguarded video upload handler. Capture initiating user ID and session epoch, bind file/metadata to the original modal, prevent duplicate submits, verify selected channel belongs to initiating user, and reject stale account/session/modal responses before inserting video metadata. Always insert with captured `creator_id` and storage path, not the account that happens to be signed in after upload.
- The same fix suppresses stale success/error UI, disables and restores the submitting button, and attempts best-effort cleanup of a stored file when metadata insertion fails while the initiating account remains current. Cleanup is not guaranteed, and server-side RLS remains mandatory.
- `16eec19093d4a125d20ccd1da87bac4188029f54`: nine Node synthetic regression cases for successful upload, account switch during storage upload, same-account session rotation, modal replacement, double-submit, channel ownership, insert failure cleanup, account switch during insert, and storage error.
- `8b7ee1c323136c13201cb10aada218ffc32ad017`: add the regression suite to native `alpha:verify`. Existing GitHub Actions already includes `*.test.mjs` in the full Node suite.

## Verification
- Re-fetched exact committed `index.html` blob `92a69ed10e873f1692661825cc514a4ba9044611` and regression blob `3e545bea010ee27821d7931509b6fca4678d6969`. Executed nine tests in a synthetic V8 harness against the extracted committed upload handler: **9/9 passed**. The harness adapted Node VM and assertions to the available V8 runtime; this is **not** a Node CI run, browser test, real upload or device test.
- Vercel nonproduction deployment `dpl_3n5KdvQbnqEq3UmCqbTAtbYddTg3` for `8b7ee1c3` is **READY**, `target=null`, at https://kinfolk-social-demo-7mpt1sdes-alstoda59-9779.vercel.app/ . READY is deployment only.
- GitHub Actions final CI, isolated-backend upload, actual account auth and RLS, Android APK/iOS build and physical-device QA **not verified** in this checkpoint.

## Blockers and boundaries
- Isolated alpha backend lacks `kinfolk_videos` and other required application tables; do not claim functional video upload. No schema changes were made because isolated organization/cost approval and migration review remain separate from this source fix.
- Upload cancellation does not cancel an in-flight HTTP request; if an insert already reached the server before a session switch, the server must enforce the captured user via RLS. Client guards alone do not prove cross-account authorization.
- No shared live Supabase schema/data/auth/security, production deployment/aliases, Kinfolksworld, paid infrastructure or app-store submission changed. Keep private beta/launch blocked until real end-to-end proof.
