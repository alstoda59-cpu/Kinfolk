# Recovery368 | Authoritative signup-session verification before persistence

Date: 2026-10-31. Scope: FULL MAIN Kinfolk Social in `kinfolk-social/` only, excluding Kinfolksworld.

## Starting point and evidence
- Continued from isolated Recovery367 branch `kinfolk-social/recovery367-signup-identity-runtime-20261031` and its commit `77c2f81fee99679fc1af605ff42c164c99079b35`; no merge into main or alpha.
- Read Recovery367, Recovery366, Recovery363 and Recovery360 reports, effective Phase79 mobile signup, existing source-executed synthetic session tests, native alpha test scripts, Library Recovery226 and prelaunch audit, GitHub branch list, Vercel nonproduction preview history and isolated Supabase project listing.
- The separate `Kinfolk Social Alpha Test` project `viantpfagtbgyyzavmtv` is ACTIVE_HEALTHY in the project listing. Shared live `Kinfolk` project `zojajuzmfjpvubzibzgg` was not touched.
- Recovery367 Vercel preview `dpl_FnkxwhSNZptXUqCMBT7kJQ9vtH1C` was READY at intermediate SHA `a9e4fd68`. READY is only a deployment status, not a backend or device test.

## Substantive production-source correction
- The existing `signupSessionIsCurrent` helper trusted `sb.auth.getSession()`, a locally cached session, as sufficient proof to persist Stay Logged In for a newly confirmed signup. A locally cached token can be expired, revoked or superseded while the UI waits.
- It now checks the exact signup access token and account/email against the first local session, calls `sb.auth.getUser(expectedToken)` for an authoritative Auth identity, requires the remote identity to have the same user ID and email with a nonempty `email_confirmed_at`, and re-reads the local session to reject login/logout/token changes during that remote request.
- Missing `getUser`, Auth errors, remote user mismatches, unconfirmed remote identity and stale local tokens fail closed. The same helper guards local-only sign-out after a signup preference-storage error.
- No visual redesign or changes to Home, Reels, Channels, profile/music, uploads, messages, communities, teen defaults or dark mobile styling.

## Commits and verification boundaries
- Runtime code: `51aaacd9d63f2fa816d20940849a47539608f359`.
- Existing synthetic fixture updates: `b0a34c7afe4ad7661d41d4cb81e116c07b4ddcab` and `05e55731761d12f6694bbc4024c30037a1fb777c`.
- Nine new source-executed synthetic cases: `ae0e745b8c6d858c836e04aaeaa988f691c20618`. They cover valid token verification, wrong/absent/unconfirmed Auth users, remote error, missing getUser, token rotation, logout, initial mismatch and second-read error.
- Native source gate wired by `681d4f22bd6a75b7b40609df4a877f99ee4230d8`.
- Draft PR #65 targets the preceding isolated Recovery367 branch; it is not merged.
- **Do not treat the above commits as passing CI without a completed exact-head workflow.** Source tests use mocked Auth responses only. No real Auth request or account is made by these tests.

## Remaining blockers and protected boundaries
- Real isolated email delivery/confirmation and callback require approved synthetic test inboxes; two confirmed isolated users and private-row fixtures are still needed for real two-user RLS enforcement proof.
- Backend-connected media, messaging, notifications, teen privacy and native device acceptance remain unverified. No signed physical-iPhone IPA or app-store release has been proven.
- No live/shared Supabase schema/data/auth/security mutations, production deployment or aliases, Kinfolksworld changes, paid resources, store submissions or real-user accounts. **NOT launch-ready.**
