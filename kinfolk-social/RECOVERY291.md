# Recovery291 | Parallel private Reels signing and optional reactions

Date: 2026-10-28 (America/Los_Angeles). Scope: full main Kinfolk Social under `kinfolk-social/`; Kinfolksworld excluded.

## Baseline
- Searched current Recovery27x/28x/29x branches and found Recovery290 as the latest main-app recovery checkpoint. Read Recovery290 and Recovery289 reports, Reels source and regression tests, native package scripts, Recovery226/232 Library notes and current Vercel nonproduction deployments.
- Recovery290 reported initial source CI run 40696334167 failing 9 of 342 Node tests, followed by fixture corrections; no verified final replacement CI result was obtained in this run.
- Older Recovery226 offline Android debug/iOS Simulator builds are not current functional alpha builds.

## Application change
- `9d9edba09299a24658c0b617e9aab1af72a26bd6`: start the bounded optional reaction query and the bounded four-worker private media signing queue together via `Promise.all`. Previously the renderer waited up to 3.5 seconds for reactions **before** starting media signing. The account-generation/navigation guard still runs before any HTML render; both helpers retain their own failure/timeout handling.
- `8a784361c283c6f4740d977624028cdd6abe3c11`: update Recovery287 source guard assertion for parallel loading.
- `ca5ecf2dc29fa7140b3521ca88989d7e6b21390f`: update Recovery289 source guard and add behavioral regression proving private signing starts while the reactions request remains pending.

## Verification
- Re-fetched exact committed Reels source blob `ecd1de2af24b66dc19ba59bf72aae20f15b1057f` and ran it in a synthetic V8 DOM/auth/media adapter. Focused scenarios passed: signing begins before a pending reactions query completes; healthy reaction counts/video; rejected reactions still show video with unavailable controls; switching synthetic account before render does not paint stale feed (**4/4 focused synthetic checks**). This is **not** the committed Node test runner or GitHub Actions.
- Nonproduction Vercel deployment for application commit `9d9edba` is **READY**, target null, at https://kinfolk-social-demo-4y9p8uaft-alstoda59-9779.vercel.app/ . The later test commit encountered Vercel's build-rate limit, and is not confirmed READY. No paid upgrade was authorized.
- No real signed media playback, isolated backend account E2E, cross-account RLS, current native APK/iOS Simulator build or physical-device QA verified.

## Next
1. Run current full Node/CI suite including Recovery287–291 regressions; investigate any failures without weakening guards.
2. Verify isolated synthetic-account email confirmation, login/logout/restoration and two-account RLS with safe callbacks.
3. Build current functional-backend Android/iOS alpha and test actual mobile Home/Reels/Channels, profiles, uploads, messaging and teen safety.

No shared live Supabase schema/data/auth/security, production deployment/aliases, Kinfolksworld, paid infrastructure or app-store submissions changed.
