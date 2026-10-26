# Kinfolk Social Recovery213 | async signup cleanup and test fixture repair

Date: 2026-10-25 (America/Los_Angeles). Scope: full main Kinfolk Social only; Kinfolksworld excluded.
Source of truth: GitHub isolated branch `kinfolk-social/recovery207-signup-navigation-guard`.

## Inspected before changes
- Recovery133 Library continuation notes (Library ID `libfile_1a804a431c048191af039af7a3118003`), plus current branch README, INTEGRATION.md, validation.json and Recovery212 notes.
- Current Phase79 and Phase95/98 authentication code, four earlier signup regression fixtures and GitHub Actions configuration.
- Vercel preview history; existing production remains outside this scope.

## Implemented
- Fixed a stale UI race in `kinfolk-phase79.js`: a local sign-out triggered by failed Stay Logged In storage can await network completion. If the signup form has been removed or switched to login during that wait, the old signup storage error is no longer displayed on the replacement screen.
- Updated the Recovery179, Recovery180, Recovery181 and Recovery205 synthetic signup fixtures to model `form.isConnected=true`. The Recovery207 navigation guard relies on this DOM property; without it, these fixtures erroneously modeled every active form as detached.
- Added three deferred-auth synthetic tests in `tests/recovery213-signup-async-navigation.test.cjs`: navigation during signup response, navigation during session verification, and navigation while storage-failure sign-out is pending.
- Added the new test to the existing GitHub Actions workflow. No real accounts, data or schema changes.

## Commits
- Fixture updates: `59eafda8063c3480e27fb008e8eb3647742d9387`, `26b6de31068d99b1ed6e4a0149cbb1bcc6fb4b76`, `a0488673550e11bc4cc68818c82fb93bf7d3ca0d`, `742f298dc1da17d0672cbd7359f3298c31fde309`.
- App fix: `e7ac490d0692584b8b1d7b491f8905393f1e30a4`.
- New synthetic tests: `d2298bce4ad39eb4507d6e323d771b8d796837fc`.
- CI workflow: `05d0106426517e441fd5d22159934064383b8912`.

## Verification
- Fetched exact committed Phase79 source and five committed Node test sources (Recovery179/180/181/205/213). Executed their 21 test bodies in a V8 harness with Node `fs`, `vm`, `test`, `assert`, URL and console adapters: **21/21 passed**. This is synthetic V8 execution, **not** a native Node test runner or real browser/backend/device test.
- Preview deployment `dpl_A2qQBmYaCx24Tzu2YiHtNPNtpAin` is **READY**, target `null`, from app-fix commit `e7ac490d0692584b8b1d7b491f8905393f1e30a4`. URL: `https://kinfolk-social-demo-5wi23qx0e-alstoda59-9779.vercel.app/`.
- Authenticated HTTP fetch of preview `/` and `/kinfolk-phase79.js` returned **200**; Phase79 response contains the storage-error navigation guard. READY and HTTP 200 are not rendered-app or end-to-end evidence.
- Newer workflow commit reported Vercel build-rate-limit failure. No READY preview including all Recovery213 test/CI commits confirmed; the READY preview does include the application fix.
- GitHub Actions success for these commits, native Node execution, real isolated Supabase auth, Android/iPhone device testing and store builds are **not verified**.

## Next
1. Verify full native Node/Playwright CI on branch, then rendered signup/login mode changes in a mobile-sized browser.
2. Run authorized synthetic signup/login/logout/session restoration against a dedicated nonproduction backend.
3. Continue mobile Home/Reels, settings/theme/music, uploads, messages, notifications, backend RLS and age protections.
4. Prepare Android/iOS Capacitor builds, native callback and device QA; review store policies before any launch.

No production deployment, production alias change, Kinfolksworld edit, shared live Supabase mutation or store submission.
