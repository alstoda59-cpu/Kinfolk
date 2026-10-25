# Recovery199 | Android/iOS Shorts regression CI

Date: 2026-10-25. Main Kinfolk Social only. Excludes Kinfolksworld and production.

## Inspected before editing
Reviewed Recovery198 committed `kinfolk-reels159.js`, README, validation.json, INTEGRATION.md, prior Recovery195 test, existing GitHub Actions workflow, Library Recovery133/137/139 notes, and latest Vercel deployments. Earlier Recovery195 test asserted the obsolete fixed CSS `height:calc(...)`, while Recovery196-198 switched to `height:var(--kf159-viewport-height,...)`. The workflow did not execute the new Recovery195-198 mobile tests, so a green older CI run would not validate those changes.

## Work completed
- Updated `tests/recovery195-shorts-mobile-layout.test.cjs` to assert the current CSS variable and compact-screen min-height behavior. Commit `f3695215b2351434f44ff57c53cb40644317f7b4`.
- Added `tests/recovery199-mobile-viewport.test.cjs`: isolated synthetic Node VM scenarios for iPhone Safari-style visual viewport resize/scroll, cleanup after leaving Reels, and Android Chrome-style window resize with fixed bottom navigation. No live accounts or backend calls. Commit `8728e18a15e0705469829107f4995eefc3e12b59`.
- Wired both mobile Shorts tests into `.github/workflows/kinfolk-social-ci.yml` on branch pushes. Commit `6b98703de752c4a45d2f8535824815b497abbc07`.
- Re-fetched all committed source/test/workflow files and performed nine source-level assertions in the connector V8 runtime: **9/9 PASS**. These are source assertions, **not** Node CLI, GitHub Actions completion, Android Chrome, iPhone Safari, native build, or real backend tests.

## Preview
Vercel isolated preview for CI commit `6b98703de752c4a45d2f8535824815b497abbc07`: deployment `dpl_ENY1i8HMNPGAoQaWaiH6wDi4YAuf`, **READY**, `target: null`, URL https://kinfolk-social-demo-c6whf1vfa-alstoda59-9779.vercel.app/ . This preview includes inherited Recovery198 source; Recovery199 changed tests/workflow only. READY does not demonstrate functional Android/iPhone behavior.

## Remaining launch blockers
- New Node test suite execution/CI outcome **not independently confirmed** (commit-status connector reports Vercel success only, and workflow-run lookup returned no PR-triggered runs).
- No rendered Android Chrome/iPhone Safari mobile QA, physical-device tests, signed Android AAB/APK or iOS IPA.
- No isolated nonproduction Supabase with authorized synthetic accounts; real signup/login, session, media, messaging and two-account RLS tests pending.
- Store safety, privacy, content moderation and policy compliance remain unverified.

No production deploy/promotion, shared Supabase mutation, Kinfolksworld edits, real-user messaging, or app-store submission.
