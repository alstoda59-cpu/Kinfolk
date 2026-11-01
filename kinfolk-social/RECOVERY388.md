# Recovery388 | Imported synthetic signup requires explicit approval

Date: 2026-11-01 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social under `kinfolk-social/` only. Kinfolksworld excluded.

## Verified continuation
Continued from Recovery387 commit `c9f8e359c95dbd00d14d38895decceb24ea997c1` and its unmerged draft PR #84. Checked Recovery387, existing signup verifier and synthetic tests, native package test wiring, recent Vercel previews, GitHub workflow status and relevant Library notes. Recovery387 source workflow run 41280811584 completed SUCCESS; exact SHA preview was READY. No restart or redesign.

## Source and test changes
- `native/scripts/verify-real-signup-smoke.mjs`: require explicit `syntheticAccountOnly: true` and `approvedInbox: true` in the exported verifier before any Auth network call. Previously these approvals were checked only by its direct CLI entrypoint; an imported caller could invoke real account creation without them. CLI now passes the flags only after its existing environment approval checks.
- `native/tests/alpha-real-signup-smoke.test.mjs`: existing synthetic fixtures explicitly opt in. New regression asserts missing, partial and nonboolean opt-in fail before network calls. The suite is already included in `native/package.json` `alpha:auth:source:test` and `alpha:verify`; no duplicate runner added.
- Source commit `a82f0f77a0efe4d2ad6f313bbf725bdc7f1cbe30`; test commit `11c8e353dd59529722aa6b4b213a88cc5acb49f5`.

## Evidence boundaries
- New branch source CI and Vercel preview status must be checked independently after this note. The source changes are committed, but do not infer CI success or actual backend behavior from code review alone.
- No synthetic accounts were created and no email was sent. Real email delivery/confirmation, confirmed login/logout/restoration, two authenticated account RLS, backend-connected media/messages, signed installable Android/iPhone packages and physical-device QA remain unverified.
- No changes to shared live Supabase, production deployment or aliases, Kinfolksworld, paid infrastructure, stores or real user data.

**Not launch-ready.** Next: verify exact-SHA CI, establish explicitly approved deliverable synthetic inboxes, execute real isolated signup and two-user RLS, and validate backend-connected Android/iPhone packages on devices.
