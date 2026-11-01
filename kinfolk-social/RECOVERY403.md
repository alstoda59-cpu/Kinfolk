# Recovery403 | Restore DM privacy action after mobile modal remount

Date: 2026-11-01 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social under `kinfolk-social/`; Kinfolksworld excluded.

## Starting checkpoint
- Continued from Recovery402 exact head `f235e689429a3b80e5756ff7e2c73c729c293734`, draft PR #99. No restart or merge.
- Read Recovery402 and Recovery401, the effective Phase107 messaging/block source, Recovery400 synthetic privacy tests, existing native Android/iOS safety source gate, Library Recovery232 notes and native packaging README.
- Recovery402 [GitHub Actions run 41357406018](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41357406018) is now **verified SUCCESS**: one completed job, 47 successful steps. This proves synthetic source/browser/native verification, not real Supabase or physical devices.
- Recovery402 [nonproduction Vercel preview](https://kinfolk-social-demo-9qt4y9wjf-alstoda59-9779.vercel.app/) is READY at exact commit `f235e689429a3b80e5756ff7e2c73c729c293734`.

## Application fix and regression evidence
- `5d427fdefd33942f6f2981ed1ae3dfcf35789bdc`: the Phase107 Block Account action is inserted as a **sibling** before the DM form. Previously, the one-time `kf107Privacy` dataset flag prevented re-creating the button if a mobile modal rerender removed that sibling but retained the same form. The effective `addDmBlock` now checks the actual sibling node, restores the action if removed or detached, and removes a connected orphan if the form was reparented. The handler still reads the current peer on click and uses the existing account/activation-aware `blockPeer` safety guard.
- `dbce9b9d35be110355af29c1621b8cdaa25fc610`: five synthetic source-executed regressions in `tests/recovery400-block-confirmation.test.cjs` cover repeated enforcement without duplicates, removed sibling remount, form reparent and orphan removal, missing button reconstruction, and absence of a peer. This test file already runs in the existing native `alpha:safety:source:test` gate; no second runner was added.
- Draft PR [#100](https://github.com/alstoda59-cpu/Kinfolk/pull/100) targets Recovery402 only and remains unmerged.

## Read-only isolated backend check
- `Kinfolk Social Alpha Test` Supabase project `viantpfagtbgyyzavmtv` is ACTIVE_HEALTHY.
- All 16 public tables have RLS enabled; all 16 report zero rows. Security advisor returned no findings.
- These checks do not prove the RLS policies enforce access between authenticated synthetic accounts. No database, Auth, storage, policy or security settings were changed.

## CI, preview and native limits
- Recovery403 final-head CI and exact-head Vercel READY must be checked independently after commits; no result is presumed from Recovery402.
- No real synthetic-account signup, confirmation email delivery, login/logout/session restoration, two-user RLS, backend-connected media or messaging was performed.
- No fresh signed Android APK, physical-iPhone IPA, physical device or native email callback QA was produced.
- No production deployment/alias, shared live Supabase, Kinfolksworld, paid resources or store submission changed.

## Next priority
Verify Recovery403 CI and preview. Then prioritize isolated synthetic Auth/email confirmation and cross-account RLS tests, followed by fresh Android/iOS packaging and physical-device acceptance.
