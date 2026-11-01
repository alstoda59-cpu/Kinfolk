# Recovery393 | Profile media commit-uncertainty safety and browser CI repair

Date: 2026-11-01 (America/Los_Angeles). Scope: full MAIN Kinfolk Social under `kinfolk-social/`; Kinfolksworld excluded.

## Verified starting checkpoint
Continued from Recovery392 commit `c3e90e7e57860613e565b00f394d82bfe8f474ba` on the isolated Recovery392 branch. Reviewed Recovery392 and README, native packaging/test commands, effective Phase100 profile media save, existing profile regressions, older Library continuation notes, latest Vercel preview list, and GitHub Actions. Recovery392 preview `dpl_BLAQfCPMiiuxP5UNpURkCyyPSF5a` was READY (nonproduction, exact Recovery392 SHA). Recovery392 CI run `41306252439` **FAILED** after its Node regression step passed: the historical Recovery223 browser fixture expected a second signup immediately after an in-flight first signup resolved following Login -> Signup navigation, contrary to the new 60-second duplicate-request cooldown.

## Actual changes
- Effective `kinfolk-phase100.js`: after uploading a new avatar/wallpaper, a profile UPDATE may commit even when its HTTP response is lost. The previous catch block deleted the uploaded file on any error before `profileSaved=true`, potentially breaking a newly committed profile reference. The new `profileWriteMayHaveCommitted` flag is set immediately before the profile UPDATE is dispatched. Uploaded media are preserved after uncertain errors, missing/malformed affected-row counts, or account/editor changes following dispatch. Cleanup remains permitted before profile UPDATE and after an explicit successful zero-row acknowledgment. This is conservative media integrity protection, not proof of transactionality or eventual reconciliation.
- `tests/recovery393-profile-media-uncertain-commit.test.mjs` executes the actual Phase100 database-update block with synthetic Supabase responses. Six tests cover one-row success, explicit zero rows, network rejection, PostgREST error, missing/unexpected counts, and source cleanup placement.
- Existing `native/package.json` profile source gate includes this regression for offline Android/iPhone packaging verification.
- `test_recovery223.py` now verifies that the 60-second signup cooldown blocks a duplicate request, then advances synthetic browser time before exercising its original successful retry and wrong-email rejection cases. It no longer expects an unsafe immediate second signup.

## Evidence boundaries and next gates
Code commits: `d564d96c52f1ec88ecb5aa95ba7f0ba748d654c2` (application fix), `b8ee6e0461de7156713b19e555969fcdec44636a` (browser fixture), `c9e42d5dc66d19387e2b950e2ce30b2b5e5c34e3` (regression), `357793112f0fe1bb8c8ca32773ab316d94c935a6` (native test gate). CI/preview at the Recovery393 head must be independently verified after the PR is created. A READY preview only proves a deployment built; synthetic CI is not real Supabase or physical-device QA.

No new Supabase organization/project, paid resources, real accounts, live schema/auth/security changes, production deployments or aliases, Kinfolksworld edits, store submissions or merges. Real signup/email confirmation, two-account RLS enforcement, backend-connected media/messaging and signed Android/iPhone physical-device acceptance remain unverified. **Not launch-ready.**
