# Recovery405 | Account-safe mobile group chat creation

Date: 2026-11-01 (America/Los_Angeles). Scope: full MAIN Kinfolk Social app only, `kinfolk-social/`. Kinfolksworld excluded.

## Starting checkpoint
- Continued from Recovery404 draft PR #101, exact branch head `ed2768db70d5c40b266edacad1894861809cd37c`, without merging or restarting.
- Inspected Recovery404 and Recovery403 reports, effective `index.html` group creation and group messaging, Phase107 Send form interception, synthetic messaging tests, native source gates, Library Kinfolk prelaunch audit and Recovery226 notes, Vercel preview history, and GitHub Actions.
- Recovery404 final-head GitHub Actions run [41367462832](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41367462832) is now **SUCCESS**. One job, all 47 steps succeeded, including synthetic Node/browser and offline native source checks. It does not prove real Supabase or physical device behavior.
- Recovery404's latest READY nonproduction preview was at `3a9d3b75`, before the documentation-only final head.

## Actual application fix
- `ee8bd53a281a5882f0c4f175d9db6f810aaa42f7` changes the effective `openGroupCreate` handler in `kinfolk-social/index.html`.
- The asynchronous friends lookup is now tied to the initiating user and auth activation. A stale lookup cannot open a new member's group-creation modal after account switching.
- The Create Group form captures its account, auth activation, modal epoch and exact DOM node. It rejects submits from a replaced modal, another account, or a reauthenticated session.
- Duplicate taps are locked before the first INSERT. An uncertain response cannot silently retry group creation and create duplicate groups; the member is directed to check Group Chats. Invalid local title input remains retryable.
- Successful creation requires a returned group ID and matching owner. Friend invitations are limited to the accepted-friend set and require an exact count acknowledgment. An invitation failure is reported as a **created group with unconfirmed invitations**, rather than pretending the group itself failed.
- Existing dark mobile layout, group UI, message send logic and other features are preserved.

## Regression and native source coverage
- `3070ee86429ac60cd22a0d9f3ddc0f7a83d63db1` adds nine synthetic source-executed cases in `tests/recovery405-group-create-session.test.cjs`: stale lookup, invalid title retry, confirmed group/invitations, duplicate taps, uncertain group acknowledgment, wrong-owner response, account switch during insert, unconfirmed invitations and replaced modal.
- `b8a08caf982776cfd7ee2c681ef133b61c8758b1` includes the new cases in the existing Android/iOS `alpha:messages:source:test` gate, not a second runner.
- Final-head CI: [GitHub Actions run 41372218874](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41372218874), **pending at report creation**. Do not claim a pass until it completes.
- Nonproduction Vercel preview at test/native-head `b8a08caf` was **READY**: https://kinfolk-social-demo-jdnjv8bj5-alstoda59-9779.vercel.app/. Deployment readiness does not establish real functionality.

## Backend, packaging and release boundaries
- No shared live or isolated Supabase schema, Auth, data, policies, storage or security settings were changed. No synthetic accounts were created. No production deployment or aliases, Kinfolksworld files, paid infrastructure, app-store submissions or merges were touched.
- Real signup/confirmation email, login/logout/restoration, authenticated two-account RLS, backend-connected group creation/invitations/media/messaging, signed native Android/iPhone artifacts and physical-device QA remain unverified.
- The Library prelaunch audit identifies privacy/storage and safety requirements that cannot be inferred resolved by synthetic CI.

## Next priority
- Verify Recovery405 final-head CI and exact-head preview independently.
- Use only authorized isolated Supabase synthetic users for real signup/email and two-account RLS, followed by group invitation, upload and messaging integration tests.
- Build fresh installable Android/iOS alpha artifacts and test on actual devices before any launch-readiness claim.
