# Kinfolk Social Recovery180 | signup storage failure handling

Date: 2026-10-25. Scope: FULL MAIN Kinfolk Social app only. Kinfolksworld excluded.

## Inspected baseline
- Continued from isolated branch `kinfolk-social/recovery179-signup-session-tab`, not Recovery133 or a guest demo.
- Read README, validation.json, INTEGRATION.md, RECOVERY178.md, RECOVERY179.md, Phase79 signup, Phase95 login, the index.html session restoration policy, Recovery179 regression tests, Recovery133 and Recovery139 Library notes, and recent Vercel deployment history.
- Prior Recovery179 isolated preview `dpl_4Y4W7VRxTEGpk6Tuzuj7g9NtV6zg` was READY. Production was not targeted.

## Defect and code change
- Previously Phase79 `saveStay()` swallowed all Web Storage errors. A partial write could leave one preference updated and another stale, or leave the same-tab marker absent while signup claimed to be opening Kinfolk.
- On successful immediate-session signup, Phase79 now snapshots both preference keys and the tab marker, applies all three writes, and attempts rollback if any operation fails.
- When storage fails, the app shows an explicit error and attempts Supabase local sign-out instead of silently claiming successful login. The account may already have been created; the user is told to enable browser storage and log in again.
- Email-confirmation signup without a session still does not change preferences. Existing dark UI, signup age checks, Phase95 login, Home/Reels, settings/music, uploads, messaging and native scaffolding remain unchanged.
- App code commit: `52db728c2bd9d0a351732009cfa8be7b478afa84` (`kinfolk-phase79.js`).
- Regression test commit: `62a33937ec43d0b7837a528129935dada7a6784f` (`tests/recovery180-signup-storage-atomic.test.cjs`).
- CI workflow commit: `2678bb4c4849baec95d429a37246d202300f00cd` (`.github/workflows/kinfolk-recovery180-auth.yml`).
- Recovery179 test fixture now models Web Storage reads, so it remains compatible with the atomic preference implementation: commits `bf8d5c6cc5e6bbefd35757749b1040e589066767` and `1e9816a7bfc654d02f4339fa6b44f7e1153179b6`.

## Verification
- Exact committed Phase79 and both regression files parsed successfully in a V8 JavaScript evaluation.
- **9/9 synthetic test cases passed** when the exact committed Recovery179 and Recovery180 test files were executed using a V8 harness with mocked Node test/assert/fs/vm APIs. This is NOT a Node process or GitHub Actions result.
- Synthetic cases cover immediate-session signup with Stay on/off, unconfirmed signup, error and underage signup, partial preference failure, tab-marker failure, and rollback plus local sign-out.
- GitHub Actions execution and real browser authentication are **not verified**. The connector's workflow-run lookup is limited to PR-triggered runs and returned no runs; do not interpret that as a failed or passing CI run.
- Isolated Vercel preview `dpl_3cedAWQGgoHito1LadgrzRh7M4of`, URL `https://kinfolk-social-demo-n7xu2n8yq-alstoda59-9779.vercel.app/`, state READY, target null, source commit `2678bb4c4849baec95d429a37246d202300f00cd`. Authenticated Vercel fetch returned HTTP 200 for `/` and `/kinfolk-phase79.js`.
- HTTP 200 and READY do not verify the rendered login screen, signup, Supabase access, or mobile functionality.

## Blockers and next work
1. An owner-approved isolated nonproduction Supabase project and synthetic test accounts are still needed for real signup, login, logout, token refresh, Stay Logged In, email confirmation, RLS, media and messaging tests. Never use the known live project `zojajuzmfjpvubzibzgg` for destructive tests.
2. Confirm GitHub Actions Node test conclusion; run actual browser/device session and blocked-storage scenarios. A failed local sign-out is currently only logged, so that edge case also needs a real-browser security review.
3. Verify teen protections and backend policies in nonproduction, then Android/iOS Capacitor builds, deep-link callbacks, safe-area/keyboard behavior, store content policies and owner-approved release steps.

No production merge, promotion, alias change, Kinfolksworld edit, shared Supabase write, real-user messaging, payment commitment, or store submission occurred.
