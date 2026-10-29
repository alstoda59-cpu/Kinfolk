# Recovery327 | Notification settings session and write integrity

Date: 2026-10-29. Scope: full main Kinfolk Social in `kinfolk-social/` only. Isolated continuation from Recovery326 final commit `dbad99917fc5501937d9580065ef69842e11b66c`. Draft PR #26 targets Recovery326, not production.

## Inspected first
- Recovery326 source and continuation report; previous source CI completed successfully at run `40957515757`.
- Recovery326 native run `40957489788`: Android debug build succeeded; iOS Simulator job was cancelled. Both are offline packaging only.
- Vercel nonproduction READY deployment `dpl_HBhgpJ2ePwzuWBDDTsWUMc8YxALg` at Recovery326 intermediate commit `c916df63`, not final Recovery326 source; preview intentionally blocks shared live backend.
- Library Kinfolk prelaunch/continuation notes and read-only Supabase Alpha Test schema. Isolated project `viantpfagtbgyyzavmtv` is ACTIVE_HEALTHY; `notification_preferences` has a `user_id` primary key and RLS enabled. No backend writes.
- Existing notification detail screen in `kinfolk-phase76.js` previously read preferences via an unpinned helper, rendered after an await, and upserted using `state.user.id` at submit time. An old screen could display or write against another account.

## Actual fix
- Read notification preferences for the opening user ID; do not render after account switch, same-user reauthentication, or screen replacement.
- Show loading state; fail closed on backend errors or a returned row belonging to another account.
- Bind each form submission to the opening account and current screen, snapshot the five email notification choices, and block duplicate submits.
- Require the upsert to return exactly one row matching the account and every submitted value before displaying success; zero rows, RLS-denied results, mismatched rows or errors never show a false save.
- A write already dispatched cannot be cancelled by this client-side guard. Database RLS remains mandatory.

## Verification scope
- Added twelve synthetic Node regression cases in `tests/recovery327-notification-settings-session-guard.test.cjs`, wired into `native/package.json` notification source suite.
- Enabled isolated Recovery327 offline Android debug and unsigned iOS Simulator build workflow. Neither package uses live credentials.
- Exact-head source CI, native compilation and preview must be checked separately. No real signup, email, Supabase two-user RLS or physical-device QA is claimed here.

## Remaining blockers
- Functional isolated-backend signup, verification callback, login/logout/session restoration and two-account RLS tests.
- Communities, membership, Channel and Video schema missing from isolated backend; uploads, messaging, notifications, teen server enforcement and media privacy unverified.
- Physical Android/iPhone QA, approved HTTPS callbacks, signed iPhone distribution and store policy review.
- No shared live Supabase, production aliases/deployment, Kinfolksworld, paid project or app-store modifications.
