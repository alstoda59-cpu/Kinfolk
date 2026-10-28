# Recovery294 | Prevent stale private-video downloads after account switching

Date: 2026-10-28 (America/Los_Angeles). Scope: full main Kinfolk Social `kinfolk-social/`; Kinfolksworld excluded.

## Baseline inspected
- Recovery293 and Recovery292 reports, latest Recovery29x branch inventory, video reaction/download code in `index.html`, Reels/Shorts module, existing reaction regressions, Recovery226/232 Library notes and nonproduction Vercel deployment metadata.
- Recovery293 final commit `92f05304b501929afecb83df9fb11e34bd6a32b4` was confirmed READY in a nonproduction preview. No full current CI, real Supabase E2E, or device build evidence.

## Implemented
- `6e69ebc66fc154089ac01dce4338200e9959b7d9`: capture the initiating user ID and auth epoch in `downloadKinfolkVideo`. Check both after storage signing, network fetch and blob reading. A download started by a prior account or session cannot trigger a browser download after logout, account switching, or same-account reauthentication. Stale failures no longer display errors on the next account. Storage signing errors are now handled by the existing download error message rather than escaping as unhandled rejections.
- `4ab845c775ff07baace55703d8d93d5dea02d066`: seven Node-style synthetic regressions for success, signing/fetch/blob account transitions, stale errors, current errors, and private-video authorization.

## Verification
- Re-fetched committed `index.html` blob `e980cbb6e0445feb6e97c3df6571b94c2ab91d7e`, extracted the actual 1,349-character download handler and executed seven synthetic V8 scenarios against it: **7/7 passed**.
- This is **not** execution of the committed Node test file, GitHub Actions CI, real Supabase authorization, browser download QA or physical-device testing.
- Vercel reported READY nonproduction previews for the application commit and the test commit. Test commit preview: https://kinfolk-social-demo-ml7w80w9l-alstoda59-9779.vercel.app/ . READY is a deployment state, not an E2E pass.
- The commit workflow lookup returned no PR-triggered runs, which does not establish full CI success or failure.

## Remaining alpha blockers
- Current full Node/ESM CI and Android APK/iOS Simulator builds.
- Real synthetic-account signup/email verification/login/logout/session restoration and adversarial two-account RLS against designated isolated Supabase.
- Integrated mobile Home/Reels/Channels, profiles/themes/music, uploads/posts/comments, messaging/notifications, teen safety/privacy and physical Android/iPhone QA.

## Boundaries
No changes to shared live Supabase schema/data/auth/security, production deployment/aliases, Kinfolksworld, paid resources, or app-store submissions. No real accounts or user data used.
