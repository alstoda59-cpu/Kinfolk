# Recovery400 | Confirm DM block writes before claiming privacy protection

Date: 2026-11-01 (America/Los_Angeles). Scope: full MAIN Kinfolk Social in `kinfolk-social/`; Kinfolksworld excluded.

## Verified starting point
- Recovery399 final head: `75c76780c307493d8514566ca0ef953978d89cee`, draft PR #96. Final-head GitHub Actions [41342091564](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41342091564) completed SUCCESS (synthetic/offline source checks, not live backend).
- Latest Recovery399 Vercel preview `kinfolk-social-demo-coj1pppi5-alstoda59-9779.vercel.app` was READY, target null, at the exact Recovery399 commit.
- Reviewed Recovery399 notes, native package scripts, existing DM privacy/block regressions, Library continuation notes and the isolated alpha Supabase project's read-only block policies before modifying code.

## Application correction
The effective `kinfolk-phase107.js` DM Block account action previously treated an error-free PostgREST INSERT as proof that the block existed. A zero-row or ambiguous acknowledgment could still show **"Account blocked"**, falsely reassuring a member that a privacy protection had taken effect.

- Application commit `c6b0213d3e3e655c6224662ba0cb8c486ef4fe21`: request `count:'exact'` and require exactly one affected block row before success. Zero, missing and multiple counts fail closed with a check-Blocked-Accounts message. Preserve the existing unique-duplicate behavior and one-click mobile action. Also pin the async completion to the original authentication activation, preventing a previous same-account session from closing or toasting in a new one.
- Existing test fixture commit `b2248bc39bfea259102ccb732ddd14c86377ceb4`: model the exact-count request and successful acknowledgment in the Recovery237 synthetic DM tests.
- New synthetic test commit `5255ef325f051eb34e3706bbd027322f4a3a2b05`: seven source-executed cases covering one-row success, zero/missing/multiple rows, RLS rejection, existing unique block, same-user session change (success and error), and reused peer form.
- Native gate commit `0e99599bfc71b59620a8961283782b4a27e872df`: include the new test in the existing Android/iOS offline safety verification command.

## Backend verification boundary
Read-only SQL against the **separate** `Kinfolk Social Alpha Test` project (`viantpfagtbgyyzavmtv`) confirms `public.blocks` has RLS enabled and authenticated blocker-scoped SELECT, INSERT and DELETE policies. Auth user count remains zero. These static policy facts do **not** prove that a real authenticated block or cross-account privacy enforcement works.

## Still outstanding
- Final-head CI, Vercel READY at the new exact commit, real signup/email confirmation, two-account RLS, backend media and messages, fresh Android APK and iOS simulator builds, signed physical-iPhone package, and physical Android/iPhone QA are separate gates. Do not claim launch readiness from mocked tests.
- No shared live Supabase schema/data/auth/security, production deployment/alias, Kinfolksworld, paid project, real accounts or app-store submissions were modified.
