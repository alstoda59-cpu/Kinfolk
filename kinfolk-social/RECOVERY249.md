# Recovery249 | Mobile signup password length consistency

Date: 2026-10-26 America/Los_Angeles. Scope: FULL MAIN Kinfolk Social app in `kinfolk-social/`, excluding Kinfolksworld.

## Checkpoint and problem
- Based on isolated `kinfolk-social/alpha-native-backend-pin-20261027`, latest checkpoint `75aeca4d7cc043efb60fcdd95a1f5a0434284bf0`. Reviewed Recovery247/248, Library Recovery226 and prelaunch audit, newest branch and nonproduction Vercel deployments before changes.
- The Phase79 signup handler, Phase76 form, and password confirmation all require 12–128 characters. Phase95's periodic login guard instead forced the shared signup password input to `minLength=5` and `maxLength=12`, truncating longer passwords and conflicting with signup validation.
- Commit `f88ec56ce53b7b694aa004197300b26996cc18e2` fixes Phase95 to use 12–128 while retaining unrestricted login password entry.
- Commit `838fa6992e50bfdf4d9fa7fd0c8f58c6d347950c` adds four Node regression tests executing the real Phase95 script in a synthetic DOM, including Login -> Signup -> Login reuse.
- Commit `53f85d8ae68f2fe71bb8dfd719c191a4aa6ffcf0` wires tests into native `npm run alpha:verify` and adds `npm run alpha:auth:test`.

## Evidence
- Reproduced the original bug from the exact fetched Phase95 source: Signup -> Login -> Signup produced limits `5/12 -> unrestricted -> 5/12`.
- Re-ran the exact committed Phase95 source (Git blob `bab12fa76ff216c7b63cff17323529cdb775505e`) in a synthetic V8 DOM harness: **4/4 focused checks passed** for signup bounds, login bounds, repeated navigation, and Phase79 validation alignment.
- GitHub branch comparison: three commits ahead, zero behind at the source/test/package checkpoint. Vercel nonproduction preview for the source/test commit `838fa699` reported READY; latest package commit was BUILDING when inspected.
- The committed Node test file was not executed in a real Node process in this run. Full GitHub Actions CI, real email confirmation, two-account Supabase/RLS, physical Android/iPhone and signed native builds remain **unverified**. Vercel READY is not functional QA.

## Next blocking work
- Finish isolated Supabase app schema, verify real synthetic signup/email callback/login/logout and session restoration, and test two-account RLS and teen privacy before treating backend as ready.
- Run full CI and native packaging using isolated publishable credentials, then Android/iPhone physical-device QA.
- Do not alter production, shared live Supabase, Kinfolksworld, aliases, paid infrastructure or stores without explicit owner approval.
