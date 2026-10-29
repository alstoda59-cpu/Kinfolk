# Recovery316 | Clear prior member state on authenticated account switch

Date: 2026-10-29 (America/Los_Angeles). Scope: full MAIN Kinfolk Social in `kinfolk-social/` only. Kinfolksworld excluded.

## Baseline inspected
- Recovery315 branch, report, README, authentication activation and native packaging scripts, existing synthetic auth tests and prior Library prelaunch/Recovery226/232 notes.
- GitHub Actions Recovery315 run [40865653539](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/40865653539): complete synthetic Node and mocked browser workflow job SUCCESS on reinspection. This is not real backend or device evidence.
- Latest Recovery315 preview [READY](https://kinfolk-social-demo-e8h37vvzp-alstoda59-9779.vercel.app/), but it still references shared live Supabase and is **not safe for test signups or writes**.
- Read-only isolated project `viantpfagtbgyyzavmtv` was ACTIVE_HEALTHY. Its 14 public tables all have RLS enabled; Communities, memberships, channels and videos remain absent. No schema/auth/security/data changes.

## Implemented
- [`090d8f7e`](https://github.com/alstoda59-cpu/Kinfolk/commit/090d8f7eedf2e24a27afbff7a62828704dd0f361): `kf129ActivateSession` synchronously clears the previous account's cached feed, videos, stories, notifications, channels, friend requests, reaction/comment/subscription maps, profile and extras, signed private-media URLs, account-specific people-suggestion cache, navigation selection and busy state before starting the next account's asynchronous hydration. Closes old modals/overlays and stops Reels/profile music. Repeated auth events for the same member preserve their active state.
- [`5bfe7101`](https://github.com/alstoda59-cpu/Kinfolk/commit/5bfe7101d41a3b65072a577b5436c0f459e8a5a2): six source-backed synthetic tests cover synchronous cache purging, playback/overlay cleanup, same-account preservation, login after sign-out, existing logout behavior and stale in-flight activation.
- [`0ef971a4`](https://github.com/alstoda59-cpu/Kinfolk/commit/0ef971a4203385194aa069da3899ebe6b0e89de7): include tests in `native/package.json` `alpha:auth:source:test` and thus `alpha:verify`.
- Draft [PR #16](https://github.com/alstoda59-cpu/Kinfolk/pull/16) targets Recovery315 only, not main or production.

## Verification boundaries
- Source/test/package commits confirmed by GitHub API.
- GitHub Actions [run 40873413177](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/40873413177) completed the **Complete Node regression suite (synthetic only)** step successfully. The mocked browser/native verification steps were still in progress at the first inspection; recheck before claiming complete CI.
- Vercel nonproduction preview for `0ef971a4` is **READY**: https://kinfolk-social-demo-2m34eygey-alstoda59-9779.vercel.app/ . This means deployed, not end-to-end tested. The preview still points to the shared live backend: **do not log in, register or send any data there**.
- No real email verification, signup/login, cross-account RLS or device test was performed. No current Android APK or iPhone build was produced.

## Remaining launch gates
- Confirm approved organization and any nonzero cost before backend provisioning or writes; use only authorized isolated synthetic accounts.
- Complete missing isolated Communities/Channels/Video schema and RLS only after approval; verify teen safety, private media, account isolation and moderation with two real synthetic accounts.
- Produce current native Android debug APK and iOS Simulator build; physical Android and iPhone QA and verified email callback are still required.
- No production deployment/aliases, shared live Supabase schema/data/auth/security, Kinfolksworld, paid resources or app-store actions changed.
