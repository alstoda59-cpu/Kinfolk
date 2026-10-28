# Recovery292 | Account-safe video reaction loading and ESM CI coverage

Date: 2026-10-28 (America/Los_Angeles). Scope: full main Kinfolk Social `kinfolk-social/`; Kinfolksworld excluded.

## Baseline inspected
- Recovery291 and Recovery290 reports, current Recovery29x branches, `kinfolk-reels159.js`, the core `index.html` reactions loader, Recovery289 ESM Reels regressions, and source GitHub Actions workflow.
- Library Recovery226/232 continuation notes and nonproduction Vercel branch deployment metadata.
- Recovery291 code preview READY at commit `9d9edba`; no verified current native APK/iOS Simulator or real isolated-backend E2E.

## Application fix
- `20c5caeea6f1a94d0aeab177872d906e1869e680`: guard `loadVideoReactions` responses by latest request serial, authenticated account ID and auth-session epoch. A slow request for account A or a prior session can no longer overwrite newer account B or a more recent response's reaction rows. A stale backend error is ignored rather than perturbing newer state.
- `cb5f2c3d03f138ba84fbc1374796e5435931f7d0`: five Node synthetic regressions for normal success, account switching, logout/relogin with the same ID, out-of-order responses and stale errors.
- `680227b75ab09fb75689b4711d9c5e7391ea9b95`: source CI now runs both `*.test.cjs` and `*.test.mjs` under `kinfolk-social/tests/`. Previously its main Node command omitted the newer ESM regression files, including recent Reels checks.

## Verification evidence
- Local Node test runner executed the **five committed regression tests** against an exact 922-character copy of the new loader extracted from GitHub blob `5f16bfecfea854313462b907adfd6e01917e1a1b`: **5/5 passed**. Independently compared FNV32 `64b0df0d` of the GitHub loader and local copy, and FNV32 `484f8773` of the committed test file and local test copy. This is focused source-level synthetic evidence, not a full repository test run.
- Nonproduction Vercel preview READY for CI commit `680227b75ab09fb75689b4711d9c5e7391ea9b95` at https://kinfolk-social-demo-luydhey3z-alstoda59-9779.vercel.app/ . READY does not establish runtime correctness.
- **GitHub Actions CI result not verified** for this checkpoint; no current native Android/iOS build, real isolated Supabase synthetic-account authentication, email delivery, cross-account RLS, or physical-device QA established.

## Remaining launch blockers
Run current full CI including ESM tests; repair any failures without weakening guards. Verify real synthetic-account email verification, login/logout/session restore and two-account RLS in the designated isolated backend. Build current Android/iPhone alpha and test Home/Reels/Channels, profiles/music/themes, uploads/posts/comments, messaging/notifications and teen safety on devices.

No production deployment or aliases, shared live Supabase schema/data/auth/security, Kinfolksworld, paid infrastructure or store submission changed.
