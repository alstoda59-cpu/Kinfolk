# Kinfolk Social Recovery230 | account-isolated profile saves

Date: 2026-10-26 (America/Los_Angeles). Scope: **FULL MAIN Kinfolk Social**, excluding Kinfolksworld. Development only, no production promotion.

## Source and baseline inspected
- Continued from Recovery229 branch `kinfolk-social/recovery229-wallpaper-session-guard`, commit `e6c26c442e8287bb136d106e1fee514c9c207766`. Recovery229 full GitHub Actions run `40292815792` **succeeded**.
- Reviewed Recovery229, Recovery228, Recovery226 reports, README, INTEGRATION.md, validation.json, Phase100 profile media save, Phase76/79/95, existing test suite and `index.html` profile form markup.
- Reviewed Library Recovery133 continuation notes and latest isolated Vercel deployment history.
- Supabase project `zojajuzmfjpvubzibzgg` still reports **zero development branches**. Shared live backend was not used for writes or account tests.

## Implemented
Branch: `kinfolk-social/recovery230-profile-save-account-isolation` (forked directly from Recovery229).
- Code commit `ac34ec420848b612d5852addbea2c7c225b932bd`: `kinfolk-phase100.js` now captures the original account ID, form identity, profile values and files before asynchronous media preparation or upload.
- Upload paths are pinned to the captured account ID, not the mutable `state.user.id`; both profile extras upsert and profile update use that captured ID.
- Before each subsequent upload/write and before account-specific UI refresh, the code rejects a switched account or replaced profile editor. Stale saves do not render or announce success for another account.
- On a canceled save before the profile update succeeds, the client attempts best-effort cleanup of media uploaded by that save. This cleanup is **not a guaranteed server-side transaction**, and partial extras writes may already have completed.
- No changes to appearance, signup, Reels, Channels, comments, messaging, payments, Kinfolksworld or native release settings.

## Tests and evidence
- Test commit `b0e417ccbaf7da1804ee66aba88abbb53d848ac3`: five new Node synthetic tests in `tests/recovery230-profile-save-account.test.cjs` for successful account-pinned saves, account switch during upload, switch after extras write, editor remount, and field snapshot consistency.
- The updated Phase100 compiled successfully with V8 `new Function`. Four independent in-memory V8 simulations passed before CI (normal save, account switch during upload, switch after extras write, editor replacement).
- GitHub Actions `Kinfolk Social source checks` run **40300340369 succeeded** for the test commit, including the complete Node regression suite, mocked browser regressions, JavaScript syntax and native web asset preparation. These are **synthetic/mocked**, not real Supabase or physical-device tests.
- Preview deployment `dpl_ESxCMnk5aN3CwchXwVSA6yUyeZXt`, source commit `b0e417ccbaf7da1804ee66aba88abbb53d848ac3`, state **READY**, `target: null`, URL `https://kinfolk-social-demo-7shetsxnl-alstoda59-9779.vercel.app/`. READY does not verify rendered browser login, real profile persistence, device operation or app-store readiness.

## Remaining blockers
1. Authorized isolated nonproduction Supabase project and synthetic test accounts are needed to verify actual signup/login/logout/session restoration, two-account profile/media writes, teen RLS/privacy, messages, uploads, comments and notifications.
2. Profile extras and profiles are separate writes; an account switch or failure between them may leave a partial update. Consider a backend transaction/RPC after isolated security review. Media cleanup can also fail after an auth switch.
3. Native Android/iOS app flows, email deep-link callbacks, keyboard/safe-area behavior, signed release builds and real devices remain unverified for this branch.
4. Adult/teen content protections, moderation, reporting, deletion and store policy require end-to-end security and compliance verification.

**Safety:** No production deployment, production alias change, main merge, shared live Supabase schema/data/auth write, real-user action, Kinfolksworld change, payment commitment or store submission.
