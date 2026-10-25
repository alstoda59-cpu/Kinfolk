# Kinfolk Social Recovery143: password recovery hardening

Date: 2026-10-24 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social app only; Kinfolksworld excluded.

## Verified starting point
- GitHub integration branch: `kinfolk-social/recovery132-integration`, commit `328d5aeebeec8872f6d6390a5e0fcdcece1a7078`.
- Starting source-check CI run `40154590209`: success. Preview `dpl_9iScTkpAt7zmBFCWe7VJN41gmWCy`: READY, target null.
- Reviewed prior Recovery133, Recovery139 and Recovery142 Library continuation notes and current README, validation.json, INTEGRATION.md.
- Isolated review branch: `kinfolk-social/recovery143-password-reset`. Do NOT merge or promote without owner approval.

## Code and tests
- Found `kinfolk-phase76.js` Forgot password flow used `redirectTo: location.origin`, which becomes nonpublic `https://localhost` in Capacitor. The signup redirect was fixed in Recovery133, but password recovery was not.
- Added `passwordResetRedirectOptions()`. It omits nonpublic, loopback, and non-HTTPS recovery callbacks, letting Supabase use its configured Site URL. For web HTTPS origins, it preserves the HTTPS origin. Optional `window.KINFOLK_PASSWORD_RESET_REDIRECT_URL` accepts an explicitly configured HTTPS URL, but the URL must also be owned and allowlisted by Supabase before native release.
- Prevents multiple simultaneous reset requests by disabling Forgot password while the request is pending, then re-enabling after success or failure.
- Added `test_recovery143.py` and wired it into `.github/workflows/kinfolk-social-ci.yml`. Synthetic Chromium test covers missing email, rejected localhost and HTTP callbacks, valid HTTPS callback, fallback without a callback, rapid duplicate taps, and recovery error retry.
- All changes are isolated to the new branch. No new product features, payments, or changes to the existing dark mobile design.

## Verification and limits
- Preview `dpl_6GyoTd1BubdD4Xfz4Famsws3goFq` from commit `7fc83ff70a889555db539b806b4563cd47d4597d` was READY, target null: https://kinfolk-social-demo-isvn7gx7k-alstoda59-9779.vercel.app/
- Source-check CI for commit `7fc83ff70a889555db539b806b4563cd47d4597d`: https://github.com/alstoda59-cpu/Kinfolk/actions/runs/40158009893 (in progress when this note was drafted).
- Vercel deployment READY and HTTP 200 do NOT prove password recovery works with a real account.
- No recovery emails sent, no live Supabase schema/auth/security/data changed, no real accounts tested, no Android/iOS APK/AAB/IPA built, and no device tests performed.
- Password update page, recovery-link consumption and deep-link routing are NOT end-to-end verified; this fixes callback selection and duplicate sends only.
- The isolated nonproduction Supabase branch is still unavailable; real signup/login/logout, password reset, teen safety/RLS, messaging and upload authorization remain blocked pending an approved test backend and authorized test accounts.
- Production and Kinfolksworld remain untouched.

## Next
1. Verify Recovery143 CI; if green, review and merge only with owner approval.
2. Implement and test the recovery-link consumption/update-password flow in isolated browser and native environments.
3. Validate auth/session, backend RLS, media, messaging, and notifications against a dedicated nonproduction Supabase branch.
4. Build Capacitor debug Android/iOS apps, verify keyboard/safe-area and universal/app links, and complete physical-device QA before any store submission.
