# Kinfolk Social Recovery177 continuation | 2026-10-25

## Scope and verified baseline
- Full main app only: `alstoda59-cpu/Kinfolk`, folder `kinfolk-social/`.
- Started from `kinfolk-social/recovery176-appearance-account-guards`, preserving the Recovery174-176 safety, music and appearance fixes.
- Reviewed Recovery133 Library notes and latest Recovery176 GitHub notes, README, validation.json, INTEGRATION.md, Phase95 and Phase98 auth code, recent Vercel previews.
- Isolated branch: `kinfolk-social/recovery177-login-form-mobile-efficiency`. No merge to main, production release, Kinfolksworld edits or shared Supabase mutations.

## Source change
- `kinfolk-social/kinfolk-phase98.js` now uses the existing MutationObserver for immediate form changes plus a **2000ms foreground-only** fallback instead of an 80ms unconditional interval.
- This reduces periodic login-form DOM checks from 12.5 per second to 0.5 per second while visible, and none in background tabs. The login/password compatibility behavior is preserved.
- Source fix commits: `071c6fd10c51b6b95a021f1152d88723a97307d9`, `a1ecd8bd3398583161a58c9b73b26b5b9748a3f8` (line break correction).
- New regression file: `kinfolk-social/tests/recovery177-login-form-mobile.test.cjs`, commit `52a50342b3e550f39af7e533a471798d6c68b8fc`.
- CI workflow `.github/workflows/kinfolk-recovery177-regression.yml`, commit `0e89446c2927506649cc5d113f5442540861ff1f`. Includes prior Recovery174-176 suites.

## Evidence
- Before change, exact Phase98 GitHub source installed an **80ms** interval in a V8 harness.
- After change, the exact GitHub-committed source installed **2000ms** interval. Five checks passed using the exact committed Node regression source executed in a V8 shim: cadence, hidden-tab skip, foreground check, observer responsiveness, and login/password cleanup.
- These are **synthetic V8 checks**, not a confirmed GitHub Actions Node run, rendered Chromium login, real backend auth or device QA.
- Preview `dpl_3WoLzFosqGdBPzoPpw4dgKWAfydH` from commit `0e89446c2927506649cc5d113f5442540861ff1f`, state READY, target null.
- Preview URL: `https://kinfolk-social-demo-5msz3sno6-alstoda59-9779.vercel.app/`.
- Authenticated Vercel fetch verified HTTP 200 for `/` and `/kinfolk-phase98.js`, with new foreground-only 2000ms fallback in deployed script. HTTP 200 does not verify functional login.
- Vercel combined status succeeded for the CI commit. GitHub Actions push-run conclusion is **not yet verified**; connector's workflow lookup returned an empty PR-only list.

## Next launch blockers
1. Verify GitHub Actions Node run; execute rendered browser login and Stay Logged In tests.
2. Test authorized synthetic accounts against isolated nonproduction Supabase: signup, login, logout, restore, teen policies, uploads, messaging and RLS. Do not test or mutate shared live backend without authorization.
3. Validate native Capacitor Android/iPhone builds, callback, keyboard, safe areas and real devices.
4. Review content moderation, privacy, account deletion and app-store adult-content rules.
5. Do not declare launch-ready or release production without owner approval and end-to-end evidence.
