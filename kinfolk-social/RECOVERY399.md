# Recovery399 | Prevent duplicate Create Album after uncertain INSERT response

Date: 2026-11-01 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social only, `kinfolk-social/`. Kinfolksworld excluded.

## Starting verified checkpoint

- Continued from Recovery398 final commit `e1780377dc8386ef29a7f3fcb91422f602685a92` and draft PR #95. Recovery399 was not present when branch discovery was performed.
- Checked Recovery398, prior album acknowledgment/session regressions, existing native media source gate, Library continuation notes, GitHub Actions and Vercel nonproduction previews before editing.
- Recovery398 final-head CI [41337080013](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41337080013) completed with all 47 workflow steps successful, including synthetic Node and browser checks.
- Isolated Supabase Alpha Test `viantpfagtbgyyzavmtv` is ACTIVE_HEALTHY. All 16 public tables have RLS enabled; each table reports zero rows and the security advisor reports zero findings. This does **not** prove two-account enforcement, email delivery or native device behavior.

## Actual application correction

The Phase106 Create Album handler previously protected confirmed albums from duplicate submission, but an INSERT could commit while its response was lost or ambiguous. The original mounted editor could then send another INSERT after the failure, duplicating an album despite a warning to refresh.

- [Application commit](https://github.com/alstoda59-cpu/Kinfolk/commit/37f9d8227700e55f618350e1d5b19b46c16ced88): record an account-scoped uncertain Create Album outcome on the exact form **before** dispatching the INSERT. Prevent a second INSERT from that editor if the outcome may have committed, including across a same-user auth activation. Lock its Create button and direct the member to inspect Photos. Existing confirmed-album and session guards remain.
- An explicit, error-free `count:0` acknowledgment clears the uncertain marker so a genuine zero-row result can be retried. Preflight validation failures never set the marker.
- [Source-executed tests](https://github.com/alstoda59-cpu/Kinfolk/commit/d0d077fb610cc8bca4e1fffb77309be9b6c8111f): add five synthetic cases for lost response, PostgREST error, missing row count, explicit zero-row and preflight validation; align the existing Recovery376 expected disabled-state with one-shot safety.
- [Session regression adjustment](https://github.com/alstoda59-cpu/Kinfolk/commit/98d1180eb30b98b5f0e0975a1f0afbcfa880c94b): assert that an uncertain Create Album INSERT is not duplicated across a new auth activation. The Add Photos activation test remains intact.
- These tests run in the existing native `alpha:media:source:test` gate via Recovery376 and Recovery380, without introducing a second parallel test runner.

## Verification boundaries

- Initial application-only [CI run 41341944647](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41341944647) failed eight older synthetic assertions that expected the old retry/unlocked behavior. They were aligned with the new safety behavior in subsequent test commits.
- [Replacement CI run 41341992024](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41341992024) passed its main Node regression step; full workflow outcome should be checked independently.
- [Nonproduction Vercel preview](https://kinfolk-social-demo-gnmte8rhz-alstoda59-9779.vercel.app/) READY at `98d1180eb30b98b5f0e0975a1f0afbcfa880c94b`, which contains the application fix and test changes. Preview READY does not establish backend E2E or native-device success.
- No shared live Supabase schema/data/auth/security, production deployments/aliases, Kinfolksworld, paid resources, real member accounts, or app-store submissions were changed.

## Next priorities

Complete CI at final head; verify synthetic-account signup/email confirmation and authenticated two-user RLS in the isolated project using approved test inboxes; then connected media/messages and fresh Android/iPhone signed installation and physical-device QA. **Not launch-ready.**
