# Recovery410 | Exact DM write acknowledgment and duplicate-send prevention

Date: 2026-11-01 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social only, `kinfolk-social/`. Kinfolksworld excluded.

## Starting checkpoint
- Continued from Recovery409 draft PR #106, commit `f5f89ffd1af156c619b29a755bb981212659b7b9`, on new isolated branch `kinfolk-social/recovery410-dm-send-ack-20261101`; no merge or restart.
- Verified Recovery409 final-head source CI [41394505488](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41394505488) SUCCESS and offline Android/iOS native run [41394501572](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41394501572) SUCCESS. Native builds used deliberately unreachable CI backend and were not device or real Auth tests.
- Inspected Recovery409 report, current effective DM overlay, existing Recovery342 and legacy DM tests, native test gates, Library continuation notes, latest branches/commits, Vercel previews, and isolated Supabase metadata.

## Application fix
- `95bd8f580cb3eb2a25098e0aac99f0b2720dc6c2`: effective disappearing-message DM send in `index.html` requests PostgREST `{count:'exact'}` and requires exactly one confirmed inserted row before refreshing. Missing, unexpected, error or thrown acknowledgments keep the original form locked and warn the member to reopen/check the conversation before retrying. Only explicit zero rows permit retry.
- Preserves existing initiating account, auth epoch, peer and modal identity guards. Prevents duplicate DMs when a database write succeeds but its network response is lost.
- This is application code, not just a checklist or static assertion. Other app features and dark mobile design remain unchanged.

## Regression and packaging
- `d8f5991a39f3e54fb832c5f15695e54e23e032e5`: existing `tests/recovery342-effective-dm-overlay.test.mjs` now covers five additional synthetic scenarios: zero-row safe retry, missing count, multirow count, rejected network request, and locked original form until confirmed refresh. Updated existing synthetic success/error fixtures. This suite was already included in `native/package.json`'s `alpha:messages:source:test`.
- `c22d54c5843ce7bf4a8a4d560ab8bc90adfefec8`: opt isolated branch into existing offline-only Android/iOS build workflow. No real backend key or signed iPhone IPA.
- Initial source CI runs [41399411891](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41399411891) and [41399452060](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41399452060) exposed one outdated legacy synthetic fixture: it returned no affected-row count despite claiming a successful INSERT. The new Recovery410 cases themselves passed.
- `cfd86a7acf3170137a61c5306bb0995cf2eb5934`: corrected `tests/alpha-dm-account-guard.test.cjs` to simulate `count:1` and assert `count:'exact'`. This is a fixture correction, not a relaxation of the production write guard.
- [Draft PR #107](https://github.com/alstoda59-cpu/Kinfolk/pull/107), unmerged. Exact-final-head source CI and native build results must be checked independently before claiming success.

## Preview and backend boundaries
- Recovery410 isolated Vercel preview READY at code/workflow commit `c22d54c`: https://kinfolk-social-demo-og5d5ibr9-alstoda59-9779.vercel.app/ . READY is deployment state, not browser, backend, or device proof. Later commits need independent deployment verification.
- Read-only isolated **Kinfolk Social Alpha Test** project `viantpfagtbgyyzavmtv` ACTIVE_HEALTHY: zero Auth users and zero group conversation/member/message rows. Group tables RLS enabled; security advisor zero findings.
- Shared live Supabase project `zojajuzmfjpvubzibzgg` untouched. No Supabase Auth/schema/data/security mutations, production deployments/aliases, paid infrastructure, Kinfolksworld changes, store submissions or PR merges.

## Release blockers
Real synthetic-account signup and email confirmation, login/logout/session restoration, authenticated two-account RLS, backend-connected DMs/group messaging/media, signed physical-iPhone IPA, physical Android/iPhone QA and complete end-to-end mobile acceptance are not proven. Offline APK/iOS Simulator compilation is not launch readiness.

**Status:** committed substantive DM duplicate-send prevention and synthetic regressions; source CI/native builds and final-head preview require final verification. Kinfolk mobile alpha is **not launch-ready**.
