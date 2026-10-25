# Kinfolk Social Recovery179 | signup session persistence

Date: 2026-10-25. Scope: FULL MAIN Kinfolk Social app, excluding Kinfolksworld.

## Verified baseline
- Continued from `kinfolk-social/recovery178-isolated-auth-smoke` rather than Recovery133 or a demo.
- Inspected Recovery178 README, RECOVERY178.md, validation.json, INTEGRATION.md, Phase79 signup, Phase95 login, index.html boot session policy, prior tests and Recovery133 Library continuation notes.
- Reviewed Vercel's recent preview deployments; no production, Kinfolksworld, or shared live Supabase changes.

## Defect reproduced before fix
- Phase79 `saveStay(false)` wrote two localStorage preference keys as `0` after signup returned a session, but failed to write `sessionStorage['kinfolk_session_tab']='1'`.
- The existing `kf129RestorableSession()` in index.html allows nonpersistent sessions only when that same-tab marker is present. An immediate-session signup with Stay Logged In unchecked could therefore be signed out during the next session restoration check.
- Reproduced with a synthetic V8 fixture against pre-fix Phase79: two localStorage writes, zero sessionStorage writes.

## Code and tests
- Code commit `4f2d38f4d447e152668fca0e700fdc757b383346`: Phase79 now sets the one-tab marker for an immediate authenticated signup when Stay Logged In is off, and removes a stale marker when it is on. Email-confirmation signups with no session still do not save preferences.
- Test commit `fe14004a9cec95a41db2ae57f4c803cc713fc072`: `tests/recovery179-signup-session-tab.test.cjs` adds five Node test cases for session with Stay off/on, no-session signup, signup error, and underage rejection.
- CI workflow commit `2e9bf9ac1b9fbc4012ea2f26b3fb9b900ceb2dc6`: Node 22 checks new and existing Recovery174-178 suites without secrets.
- The exact updated GitHub Phase79 source parsed in V8, and **5/5 synthetic fixture assertions passed**. This is not a Node/GitHub Actions, real-browser, backend, or device result. GitHub Actions run status could not be confirmed from available connector results.

## Preview evidence
- Isolated Vercel preview `dpl_4Y4W7VRxTEGpk6Tuzuj7g9NtV6zg`, URL `https://kinfolk-social-demo-p9ff7jmhp-alstoda59-9779.vercel.app/`, state READY, target null, source commit `2e9bf9ac1b9fbc4012ea2f26b3fb9b900ceb2dc6`.
- Authenticated Vercel fetch of `/kinfolk-phase79.js` returned HTTP 200 and included the Recovery179 session marker fix. This is **not** rendered UI, successful login, backend testing or app-store readiness.
- No production deployment or alias changes; no Kinfolksworld edits, shared Supabase writes, store submissions or payment commitments.

## Remaining blockers
1. Authorized isolated nonproduction Supabase project and synthetic accounts are required for real signup/login/logout, confirmation callback, Stay Logged In across refresh/new tab, RLS, uploads and messaging QA. The Recovery178 smoke harness refuses the known live project.
2. GitHub Actions Node suite and browser-rendered tests remain unverified for Recovery179.
3. Android/iOS native builds, email deep-link callbacks, device safe-area/keyboard behavior, moderation/age enforcement, and store review remain pending.

## Next safe work
- Confirm Recovery179 GitHub Actions results and resolve any test failures.
- With owner-approved isolated Supabase credentials, run Recovery178 guarded auth smoke and a real browser session-restoration matrix.
- Continue independent code-level mobile/Home/Reels and privacy regressions without touching production.
