# Recovery341 | Fresh session verification for persistent mobile login

Date: 2026-10-30 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social only, `kinfolk-social/`. Base: Recovery340 `593fa7925c0c3b046d9f93c0e6114e8773c215b8`. Isolated draft PR [#39](https://github.com/alstoda59-cpu/Kinfolk/pull/39) targets Recovery340, not production.

## Verified starting state
- Recovery340 source push CI [41040944182](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41040944182) completed SUCCESS at the exact Recovery340 final commit. A separate source PR run [41040951051](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41040951051) also completed SUCCESS.
- Recovery340 native run [41040944130](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41040944130) initially concluded FAILURE: Android debug APK compiled and uploaded, while the iOS Simulator job was CANCELLED. A rerun of the cancelled iOS job was requested. Do not call that original native workflow fully successful until the rerun finishes successfully.
- Recovery340 final-commit Vercel preview `dpl_Hf9zScjd9z5HE6m6zH4TqxG87pZb` was READY, `target=null`; preview readiness does not establish working login or mobile QA.
- Read-only Supabase inspection on 2026-10-30 found `Kinfolk Social Alpha Test` (`viantpfagtbgyyzavmtv`) ACTIVE_HEALTHY, with 14 empty RLS-enabled public tables and no current security-advisor lints. Missing Community/Channel tables and absence of role-separated real auth/RLS tests remain blockers. No Supabase changes were made.
- Library prelaunch notes and previous Recovery reports were reviewed; preserve existing app features, native isolation and no-production guardrails.

## Application fix
- Commit `8e7aea66d8bb3ce47d638a2bc098a8bfb5f86317`: `kf129RestorableSession` in `index.html` now obtains a fresh `sb.auth.getSession()` result even when Stay Logged In or the same-tab marker permits restoration. Previously it could immediately return the first pending result, activating stale account A after account B signed in or using obsolete tokens. The second read becomes the only session eligible for activation. Preferences are evaluated after the fresh read; when disallowed, existing account/access-token/refresh-token equality checks still prevent signing out a newer session.
- Commit `c5708fce2894faad653d5c47652af9175fb49a5c`: update the existing Recovery339 synthetic assertion to expect two reads for persistent restoration.
- Commit `4577b0e50f615054d15d783baac91490457a0e46`: add nine source-extracted synthetic regressions for persistent account switches, token rotation, original-tab freshness, disappearing/error sessions, permission revocation/grant and absent first session.
- Commit `e59c615fda9cfc0a92da7f9cf7e72d771245ecb1`: include the new tests in native alpha authentication verification.
- Commit `a75ff48250c610be04d79f9a22f0dd91a3afc087`: enable Recovery341 in offline Android/iOS native compilation CI.

## Verification boundaries
- Recovery341 source CI, native builds and final-commit Vercel preview must be checked at their exact commit. An earlier READY preview or successful Recovery340 CI does not prove Recovery341.
- Tests are synthetic, not real email signup, isolated-backend login, two-account RLS or physical-device evidence. The Android debug and unsigned iOS Simulator builds, when available, still use an unreachable CI-only backend and are not functional live-backend alphas.
- No shared live Supabase schema/data/auth/security, production Vercel deployment/aliases, Kinfolksworld, paid infrastructure or app stores were modified.
