# Recovery340 | Restore auth-event CI coverage after Recovery339 policy extraction

Date: 2026-10-30 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social, `kinfolk-social/`, excluding Kinfolksworld. Base: Recovery339 commit `b267516e37766d1deeacca31d6efa602e43f05f4`. Draft PR #38 targets Recovery339, not production.

## Verified starting state
- Recovery339 draft PR #37 remains open. Its final source CI run [41033539295](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41033539295) FAILED, despite the complete Node regression suite and simulated mobile browser tests passing. The failure occurred at the separate legacy auth-event test `test_recovery151_auth_preference.js`: `ReferenceError: kf339RestoreAllowed is not defined`.
- A second source run [41033551207](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41033551207) failed at the same legacy test. The Recovery339 native workflow [41033538930](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41033538930) SUCCEEDED for Android debug APK and unsigned iOS Simulator build. Those packages have a CI-only unreachable backend.
- Vercel showed READY previews for Recovery339 intermediate commits; READY is not real signup, live login, or device verification. No Recovery339 final-commit preview was independently confirmed.
- Library prelaunch audit and older run notes were reviewed. The existing nonproduction Supabase project `Kinfolk Social Alpha Test` (`viantpfagtbgyyzavmtv`) was inspected read-only and remains ACTIVE_HEALTHY, with 14 empty public tables, all RLS-enabled, and no current security advisor lints. This does not establish correct policies or working end-to-end authentication. Community and Channel tables remain missing.

## Changes
- Commit `cc6d94176311b9590d74918ea0bf98b942d8c8f3`: update the Recovery151 synthetic auth-event VM to extract the complete production restoration policy beginning with `kf339RestoreAllowed`, not just the later `kf129RestorableSession`. Assert that the restored VM includes the session function and both access/refresh token rotation guards. This repairs test coverage, not production behavior.
- Commit `44ea66fffdc4e763c9d394371bea2bedc9b854a9`: enable the isolated Recovery340 branch in offline Android/iOS native build workflow.
- Existing production authentication logic remains unchanged; Recovery339 race guard is retained.

## Verification boundaries
- CI results for the Recovery340 final documentation commit must be checked separately. Do not infer a pass from a committed fixture or a READY preview.
- Real isolated Supabase signup, email delivery, session restoration, two-account RLS, private media, messaging, teen-safety, and physical Android/iPhone tests remain unverified.
- No live/shared Supabase schema, data, auth or security; production Vercel deployments/aliases; Kinfolksworld; paid infrastructure; or app stores were modified.
