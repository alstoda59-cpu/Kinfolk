# Recovery324 | Password-reset retry ownership and browser CI repair

Date: 2026-10-29. Scope: **FULL MAIN Kinfolk Social only** in `kinfolk-social/`. Based directly on Recovery323 commit `26fc3b5530d97e9067b1b62fb6e7ed32bf4f351a`. Isolated draft only; no production or Kinfolksworld changes.

## Pre-change verification
- Inspected Recovery323/322 reports, latest recovery branches, draft PR #22, source and native workflow, password-reset implementation and synthetic tests, Library continuation notes and recent Vercel previews.
- Recovery323 source CI [run 40930651445](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/40930651445) **failed** in Chromium browser fixture `test_recovery143.py`, which still expected the old word "sent" after Recovery323 intentionally changed the UI to "reset link has been requested". Its Node regression stage passed; the full workflow did not.
- Recovery323 native [run 40930628375](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/40930628375): Android debug APK succeeded; iOS Simulator job cancelled. No two-platform pass.
- Vercel had READY nonproduction previews at earlier Recovery323 commits, but preview protection prevents use with shared live Supabase. READY does not prove auth or backend functionality.
- Read-only Supabase inspection: `Kinfolk Social Alpha Test` (`viantpfagtbgyyzavmtv`) ACTIVE_HEALTHY, 14 empty public tables all with RLS, zero security advisor lints. Community, membership, Channel and Video tables remain missing. No database mutations.

## Actual fix
- In `kinfolk-phase76.js`, editing the email while a reset request is pending now immediately invalidates the old request **and unlocks the button**, allowing a new email to be submitted without waiting up to 20 seconds.
- The old request's `finally` can only unlock the button when it still owns the pending request token. A late response from the old email cannot unlock a newer request, expose its status, or interfere with the newer request's pending state.
- Added synthetic overlapping-request regression in `tests/recovery323-password-reset-form-isolation.test.cjs` covering the old request finishing while the new request remains pending.
- Repaired the stale Chromium fixture `test_recovery143.py` to assert the actual noncommittal status and not claim email delivery.
- Added this isolated branch to existing offline-only Android/iOS workflow. CI uses unreachable placeholder backend, never live credentials.

## Evidence boundaries
- GitHub source and native workflow results for the **final Recovery324 head** must be independently verified. Source changes and synthetic tests do not prove live email delivery.
- No real isolated Supabase auth, two-account RLS, uploads, messaging, teen-safety, signed iPhone IPA, physical-device QA, or production release verified.
- No shared live Supabase schema/data/auth/security, Kinfolksworld, production deployment/aliases, billable resources, or store submissions modified.

## Next
1. Confirm source CI and both native jobs at final Recovery324 head; repair any failures rather than treating partial stages as success.
2. Configure a confirmed isolated HTTPS verification/reset callback and nonproduction backend, then test synthetic two-account auth/RLS.
3. Perform physical Android/iPhone navigation, email deep-link, music, Reels, uploads, messaging and teen-safety QA before any alpha readiness claim.
