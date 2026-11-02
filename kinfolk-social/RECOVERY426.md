# Recovery426 | Activation-isolated profile wallpapers and repaired native source gate

Date: 2026-11-02 (America/Los_Angeles). FULL MAIN Kinfolk Social only, `kinfolk-social/`, excluding Kinfolksworld. Continued directly from Recovery425 commit `ce504ca5f1cb9fc16e90a8aed508c42a8d858a7f` on isolated branch `kinfolk-social/recovery426-wallpaper-activation-isolation-20261102`; draft PR #123 remains unmerged.

## Starting verification
- Inspected Recovery425/424 reports, latest branch and PR #122, source/native Actions, relevant source and regression tests, historical Library audit notes, and Vercel nonproduction deployments.
- Recovery425 exact-head source run [41527975121](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41527975121) **failed** one outdated test assertion (1203/1204 Node tests passed), and its native run [41527958097](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41527958097) failed at the same source test before Android compilation; iOS job canceled. The READY Recovery425 preview was at exact commit `ce504ca5`, not backend-connected QA.
- Read-only Supabase inspection confirmed existing separate `Kinfolk Social Alpha Test` project `viantpfagtbgyyzavmtv` is healthy, with **0 Auth users, 0 wallpaper objects, 0 safety settings rows**. Shared live `zojajuzmfjpvubzibzgg` was not queried or modified.

## Actual implementation
- `156b11ab`: effective Phase76 wallpaper renderer now captures the current account and `kf129Epoch` activation; stale same-account relogin and account-switch asynchronous results cannot render prior-session media. Existing wallpaper layer is removed immediately when owner or activation changes, before backend fetch resolves. A signing exception safely resolves to empty media rather than leaving a stale wallpaper or rejecting the refresh. Deferred post-Settings wallpaper refresh also rechecks activation at timer execution.
- `04dc2344`: repaired the actual Recovery425 CI failure by checking the complete extracted handler, rather than slicing before the expected success toast; added three source-executed deferred-refresh tests.
- `ef4e449a`, `a0a87465`, `5421fce9`, `0ec07726`: expanded and corrected the source-executed wallpaper lifecycle harness to cover same-account reactivation, immediate old-layer clearing on account switch, and signing exceptions, with stable path resolution for native working directory.
- `2945cd82`: updated private-wallpaper renderer source assertions to match the new guarded code.
- `f4daf306`, `1852a947`: enabled this isolated branch in the existing offline-only Android/iOS workflow and included the wallpaper lifecycle suite in the native media gate.
- The initial intermediate CI runs exposed a stale source-extraction anchor and incorrect new test regexes; both were corrected before the final application/test checkpoint `0ec07726`. Only the actual final-head Actions results establish a pass.

## Safety and evidence boundaries
- No changes to shared live Supabase, isolated Supabase schema/data/auth/security, production Vercel deployment or aliases, Kinfolksworld, paid resources, real users, or app stores.
- The native workflow still packages with an intentionally unreachable CI-only Supabase backend; a compiled APK or unsigned iOS Simulator app does **not** prove a connected Android/iPhone alpha.
- Source CI: [branch runs](https://github.com/alstoda59-cpu/Kinfolk/actions?query=branch%3Akinfolk-social%2Frecovery426-wallpaper-activation-isolation-20261102). Native build: [workflow](https://github.com/alstoda59-cpu/Kinfolk/actions/workflows/kinfolk-alpha-native.yml). Do not claim success until each final-head job is complete.
- Real signup/email confirmation, login/logout/session restoration with two actual synthetic accounts, authenticated RLS, connected media/messaging, physical Android/iPhone QA, and signed physical-iPhone IPA remain unverified.

## Next
Check final-head CI, Android/iOS build outcomes, and exact-commit nonproduction Vercel READY. If source tests fail, repair on this isolated branch. Then move to owner-approved synthetic inbox/isolated Auth and backend-connected device testing, without any shared live changes or store submission.
