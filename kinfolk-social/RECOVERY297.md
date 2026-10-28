# Recovery297 | Mobile Settings hub and account-safe safety controls

Date: 2026-10-28 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social under `kinfolk-social/` only. Excludes Kinfolksworld.

## Baseline inspected
- Recovery296 final report, `kinfolk-phase78.js` Settings/age safety, `kinfolk-phase81.js` appearance/music, existing account/profile layout modal, Phase114 Settings injection, native verification scripts, and Recovery295 Gold Star tests.
- Library Recovery226 notes: historical source CI and Android debug/iOS Simulator builds succeeded on Recovery226 only; these do **not** validate Recovery297.
- Confirmed Recovery296 nonproduction Vercel deployment `dpl_DhQ5bNoa3Cqp8T4keNvBjYPPXxyC` READY at application/test commit `fdea97fc`. Not functional QA.

## Implemented commits
- `a965f1011fd67437925b6c613b38982032394a6a`: bind safety reads, teen enforcement and adult filter writes to initiating user ID. Ignore stale safety responses and close the sheet on account switch. Stop silently clearing the adult daily safety timer merely by opening Settings; explicit adult filter Save remains the write path.
- `9a70a14392aab398a02e6cc344d6e3807adbf03a`: add Facebook-style dark Settings & privacy hub with Account & profile, Appearance & music, Privacy & safety, and Notifications navigation. Mobile sheet fills the viewport with safe-area padding and sticky header; desktop retains modal behavior. Reuses existing profile editor, safety and notification views.
- `23140b13703dccdfaf5b1e29327e5262933f67db`: expose the existing Phase81 appearance/musical controls for hub navigation, without creating another profile editor.
- `dad704cf5f8f0af561a9e9e5aea02740495a74d9`: add five Node regression cases for stale reads, scoped teen/adult writes, no implicit adult timer reset, and hub wiring.
- `d8fec31278f5f7f12759fdd6ac3d792cd2ce083b`: include those tests in `alpha:profile:source:test`.

## Verification
- Re-fetched exact committed Phase78 blob `9ae12ab18a8eb715eddea372e2ff70322c90693a` and Phase81 code, compiled both in V8, and executed **12/12 focused synthetic V8 checks** covering stale reads, correct owner IDs for teen and adult writes, rejected stale writes, hub categories, appearance integration, and no implicit adult timer mutation.
- The committed Node test file is **not yet verified under Node or GitHub Actions**. No current native packaging build, real backend signup/email/login/session, cross-account RLS, browser UI or physical-device test was executed.
- Vercel returned READY for nonproduction deployment `dpl_7XVzbVyeGXdNkw5rh3eSkqXdCTrU` at test commit `dad704cf`: https://kinfolk-social-demo-636oiegod-alstoda59-9779.vercel.app/ . READY is deployment status, not proof the Settings UI works on devices. Later native package script/report commits are not confirmed deployed.
- GitHub comparison before this report: five commits ahead of Recovery296, zero behind, files confined to `kinfolk-social/`.

## Remaining blockers
- Full current GitHub CI, isolated Supabase real synthetic-account auth/email/RLS, current Android/iOS build and physical-device QA, end-to-end media/messaging/notifications and teen server-side policy enforcement. Nonproduction Supabase organization and any nonzero project cost require owner confirmation.
- Gold Star gifting and subscription entitlements need isolated-backend testing; no grants or billing mutations made.
- No production deployment, shared live Supabase changes, Kinfolksworld edits, paid resource upgrades, or store submissions. **Not launch ready.**
