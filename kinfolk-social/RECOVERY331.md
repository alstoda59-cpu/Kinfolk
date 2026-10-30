# Recovery331 | Active Phase95 login completion lock

Date: 2026-10-29. Scope: full main Kinfolk Social only, `kinfolk-social/`. Isolated continuation from Recovery330 final commit `c2d26fbe7aef591fadb240fb251e932cd602631e`. No production or shared live backend changes.

## Verified before editing
- Recovery330 source CI at exact final commit: GitHub Actions run 40979912430 concluded SUCCESS.
- Recovery330 report and nine Phase73 auth tests reviewed; the active `kinfolk-phase95.js` installs a capture-phase login submit handler and can override Phase73's `onsubmit`. The previous Phase73 test suite alone therefore did not exercise the effective login handler.
- Read the current native `prepare-web.mjs` and `verify-alpha-package.mjs`: offline native compilation rewrites shared-live Supabase URLs/keys to a deliberately unreachable CI-only backend and fails if live credentials remain. These offline builds are not functional login tests.
- Recovery330 nonproduction Vercel previews were READY at intermediate commits; READY does not prove real auth or device functionality.
- Library prelaunch audit documents public-media/privacy, auth, teen safety, RLS and physical-device blockers. No live backend changes authorized.

## Actual application fix
- Phase95 previously reset the login button to enabled in its `finally` block even after verified account activation succeeded. If navigation had not removed the form yet, another submit could start a second login.
- After successful account activation and confirmation that the same login screen is still present, pin completion to the exact login-title DOM element and keep the submit button disabled.
- The Phase95 capture-phase handler now consumes and ignores duplicate submit events for that completed login screen; the earlier Phase73 handler cannot run as a fallback.
- A failed activation still rolls back, unlocks the button and permits retry. A newly rendered login screen has a different title element and is not permanently locked.
- No change to Supabase backend configuration, credentials, native callback policy, app layout, or feature set.

## Tests and CI scope
- Added `tests/recovery331-phase95-login-completion-lock.test.cjs`: three source-backed synthetic VM regressions for success lock, duplicate suppression and failed activation retry.
- Integrated into `native/package.json` `alpha:auth:source:test` and included the isolated Recovery331 branch in offline-only Android/iOS workflow triggers.
- First source CI run 40985664669 executed 644 synthetic Node tests: 642 passed and 2 legacy static fixtures failed because they expected the old one-line success notice rather than the new guarded completion block. Updated Recovery183/215 fixture assertions to retain their original title-identity and post-activation checks; the three new Phase95 runtime regressions passed in that run. Full CI must be rechecked at the repaired exact head.
- CI, native compilation and preview results must be checked at the exact final commit. Real isolated-backend signup, email verification, two-account RLS and physical device QA remain unverified.

## Remaining blockers
- Functional isolated Supabase signup, email callbacks, login/logout/session restoration and two-account RLS.
- Missing Community/membership/Channel/Video tables, private media verification, messaging, notifications, teen safety enforcement.
- Physical Android/iPhone QA, approved HTTPS callback destinations, signed iPhone distribution, and store review.
- No shared live Supabase, production Vercel deployment/aliases, Kinfolksworld, paid infrastructure, or app-store modifications.
