# Kinfolk Social Recovery149 | session restoration retry guard

Date: 2026-10-24 America/Los_Angeles (2026-10-25 UTC). Scope: full main Kinfolk Social only; excludes Kinfolksworld.

## Inspected before editing
- Read Recovery133 and Recovery142 Library continuation notes; GitHub README, validation.json, INTEGRATION.md, Recovery148 notes, actual index.html session boot code, Phase95 login code, reaction tests and CI workflow.
- Previous latest Recovery148 branch commit 2e4fd088563c70724cda069a414646c7b42b42ae; preview dpl_9H5im5iTwa99SsKCDcZUW3joZs5m READY, target null.
- No dedicated nonproduction Supabase backend or authorized real test account established. No shared backend writes authorized.

## Bug and implementation
- Found Retry handler `window.kf129Retry` called `sb.auth.getSession()` and directly activated its session without checking the user's unchecked Stay Logged In preference. Initial `boot()` did enforce same-tab-only restoration. This created inconsistent behavior after a failed account load or Retry.
- Recovery149 branch: `kinfolk-social/recovery149-session-retry` from Recovery148.
- Fix in `kinfolk-social/index.html`: central `kf129RestorableSession()` used by both boot and Retry. Nonpersistent session is allowed in the original tab (sessionStorage marker), and signed out locally in a different tab. Storage errors fail closed for cross-tab restoration. Existing features/layout preserved.
- Code commit: `91ff4c66adda9dde46da2a9810430ae312184e3a`.
- Offline Node regression: `kinfolk-social/test_recovery149_session_retry.js`, commit `9bd9163de7b28e75436f1e4b801d4d740dc06b4f`.
- CI workflow now invokes offline test: commit `044604f7de21c87b87d88ffd79695c625bc4bec6`.

## Verification
- Isolated V8 execution of the actual extracted restoration helper passed five synthetic cases: persistent session; nonpersistent original tab; nonpersistent new tab triggers local sign-out; blocked local storage triggers local sign-out; signed-out visitor remains signed out.
- Checked-in Node test additionally covers Retry and sign-out failure; its GitHub Actions run outcome has **not** been independently confirmed.
- Preview deployment: `dpl_95kKjqwsgJqy6ZVpUba6PFT7B8uj`; READY, target null; commit `044604f7de21c87b87d88ffd79695c625bc4bec6`.
- Preview URL: https://kinfolk-social-demo-nyip3xice-alstoda59-9779.vercel.app/
- Authenticated Vercel fetch returned HTTP 200 for / and contained `kf129RestorableSession` and `window.kf129Retry`. This is an asset check, **not** a rendered/authenticated browser or real backend/device test.

## Still blocked / next steps
1. Verify GitHub Actions full CI result and resolve failures if any.
2. Test actual signup/login/logout, Retry, same-tab refresh and cross-tab behavior with authorized synthetic accounts on an isolated Supabase branch. Shared live Supabase untouched.
3. Test settings/theme/music, posts/media, messaging, notifications, age/privacy RLS, and post_dislikes migration only in nonproduction; mutual-exclusion backend enforcement pending.
4. Android/iOS debug builds, native email callbacks, physical-device QA, app-store policy/privacy review and owner approval remain outstanding.

No production deploy, merge, alias change, live Supabase mutation, Kinfolksworld change, APK/AAB/IPA build, or store submission. READY and HTTP 200 do not establish release readiness.
