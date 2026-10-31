# Recovery354 | Token identity at both mobile login activation checkpoints

Date: 2026-10-30 America/Los_Angeles. Scope: FULL MAIN Kinfolk Social in `kinfolk-social/` only. Continued from exact Recovery353 head `3959c6072038be063f94864a068085422ce36d44` on isolated `kinfolk-social/recovery354-post-activation-token-guard-20261030`. No merge or production release.

## Inspected before changes

- Recovery353 branch, draft PR #51, `RECOVERY353.md`, README, Phase95 effective login handler, prior Recovery182/183/193/285/331/352/353 tests, native alpha package test gate and source/native CI workflows.
- Recovery353 exact-head source run [41144464178](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41144464178) **SUCCESS**, with the synthetic source job successful.
- Recovery353 exact-head offline Android APK and iOS Simulator build run [41144453466](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41144453466) **SUCCESS**; neither proves backend-connected operation or physical device QA.
- Nonproduction Vercel READY intermediate Recovery353 deployments; final Recovery353 SHA not found in the inspected deployment listing.
- Library historical Kinfolk continuation notes and the separate isolated Supabase project `viantpfagtbgyyzavmtv`, ACTIVE_HEALTHY with 14 empty RLS-enabled public tables. Shared live project `zojajuzmfjpvubzibzgg` is forbidden and untouched.

## Actual application fix

The effective Phase95 login path verified only `user.id` after adopting an auth session and again after asynchronous `kf129ActivateSession`. A newer login for the *same user* could replace the access token between these steps, yet the older login could still announce success or open a stale account screen.

- Added `verifyActiveLoginToken(session)`, which reads the current Supabase session and requires **both exact account ID and access token** to match the adopted session. Missing tokens, unavailable auth and read errors fail closed.
- Called it immediately after `adopt(tokens)` and immediately after account activation. Existing token-scoped, local-only rollback still preserves newer sessions. No shared auth or schema mutations.
- This guards the two observed checkpoints, not an atomic transaction against external concurrent auth refreshes; real isolated-backend and device QA remain required.

## Regression and CI integration

- New `tests/recovery354-post-activation-token-guard.test.cjs` exercises exact token, newer same-user token, different user, missing active/expected token, auth read failure, unavailable auth and both source call sites.
- Extended Recovery331 effective-handler regressions to cover same-user replacement before and during activation.
- Updated historical Recovery182/183/193/285 synthetic fixtures and source-order assertions to model access tokens and new error messages.
- Added Recovery354 tests to `native/package.json` `alpha:auth:source:test` and the isolated offline-only Android/iOS workflow branch allowlist. CI backend remains unreachable packaging-only placeholder.
- Initial intermediate source run [41150116591](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41150116591) **FAILED**: 811/821 Node cases passed, 10 older fixtures failed because they omitted adopted tokens or asserted outdated source text. Those fixtures were corrected; final-head CI must be checked independently.

## Release gates and safety

The real isolated backend still has no verified synthetic-account signup/email confirmation, logout/session restoration, cross-account RLS, uploads, posts, messaging, notifications or teen-safety enforcement. Community/Channel/group-chat backend schema and physical-device Android/iPhone QA remain blockers. An Android debug APK is not a store-ready build; an unsigned iOS Simulator app is not a physical-iPhone IPA. Do not claim launch readiness.

No shared live Supabase schema/data/auth/security, production Vercel deployment/aliases, Kinfolksworld, paid resources or store submissions were changed. Final source CI, native compilation, final-head Vercel preview and artifact IDs must be verified from their exact commits rather than inferred from earlier READY previews.
