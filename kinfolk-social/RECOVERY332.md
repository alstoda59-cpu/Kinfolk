# Recovery332 | Unexpected adopted session rollback

Date: 2026-10-29. Scope: full main Kinfolk Social in `kinfolk-social/` only. Isolated continuation from Recovery331 final commit `33eb6cab9e3e7c6420b207710eb49acd462be01c`. No production or shared live backend changes.

## Inspected before editing
- GitHub Recovery331 report and effective `kinfolk-phase95.js` login implementation.
- Exact Recovery331 source CI run 40985765368: SUCCESS.
- Recovery331 Vercel branch: four earlier nonproduction deployments READY, none evidence of real signup or backend/device QA.
- Native functional gate and read-only Auth settings tests; these are not live email, signup or RLS tests.
- Library Kinfolk prelaunch audit: private-media, teen safety, two-account RLS, real auth and device QA remain blockers.

## Actual application fix
- Phase95 `adopt()` verifies Supabase's `setSession()` account matches the account returned by the password token request.
- Previously a mismatch threw an error, but its catch handler only attempted local signout for the **requested** account ID. If Supabase had actually adopted another ID, the cleanup skipped it, leaving an unexpected local session active.
- The mismatch error now carries the exact adopted account ID. The existing rollback only signs out locally if that same ID remains the active session and there was no previously signed-in account. This avoids signing out a newer unrelated session.
- No changes to login layout, signup policy, Supabase project credentials, callback URLs, or production.

## Tests
- Added five source-backed synthetic VM regressions: mismatched adopted ID tagging, local cleanup, protection of newer account, successful matching adoption, and the effective login handler passing the unexpected ID to rollback.
- Included in `native/package.json` `alpha:auth:source:test` and enabled isolated Recovery332 offline Android/iOS workflow trigger.
- GitHub source CI, native compilation, preview status and physical device tests must be verified at exact final head; this report does not claim results before checks complete.

## Outstanding launch blockers
- Real isolated-backend signup/email confirmation, login/logout/session restoration and two-account RLS.
- Missing Community/membership/Channel/Video backend tables; private media, messaging, notifications and teen safety need server-side validation.
- Signed native packages, approved HTTPS callbacks and physical Android/iPhone QA.
- No shared live Supabase, production aliases/deployments, Kinfolksworld, paid resources or app stores modified.

## CI follow-up
- Initial Recovery332 source CI run 40991915666: 649 synthetic Node tests, 648 passed, 1 failed. All five new session-cleanup regressions passed; legacy Recovery214 static assertion still required the old cleanup call text.
- Updated the Recovery214 fixture to require the new adopted-session-aware cleanup while preserving the existing preference-restoration-before-rollback assertion. Rerun must be checked at the repaired exact commit; full CI success is not assumed.
