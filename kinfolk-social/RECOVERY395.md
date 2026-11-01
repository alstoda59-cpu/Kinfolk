# Recovery395 | Cross-account profile editor field isolation

Date: 2026-11-01 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social only, `kinfolk-social/`. Kinfolksworld excluded.

## Verified starting checkpoint

Continued directly from Recovery394 PR #91, commit `426d987aed5dc45f756dd9da48ce906739f80a4e`. Fresh GitHub Actions inspection confirms source workflow run [41316530023](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41316530023) completed **successfully** (all 47 listed steps successful), correcting the previous pending status. Vercel's latest verified READY preview for Recovery394 is `00e4add6` at https://kinfolk-social-demo-otrgml2hk-alstoda59-9779.vercel.app/; this predates Recovery394 final head and does not prove real backend or device behavior. Reviewed Recovery394 report, effective Phase100 profile save, existing Recovery230 source-executed regression harness, Library continuation notes, and the isolated Alpha Test Supabase project. The separate project `viantpfagtbgyyzavmtv` is ACTIVE_HEALTHY and its read-only security advisor reports no lints. No live data or auth mutations.

## Actual application fix

The Phase100 save guard correctly stopped stale async writes after account changes, but its unconditional `restoreEditorFields()` in `finally` could re-enable controls on a reused editor DOM node after a different account's privacy/validation logic disabled them. This is a cross-account UI integrity race. The old save now restores original input disabled states only if its account still owns the active original editor. Same-account auth reactivation still restores the original editor, including fields that were disabled before saving. The existing Save Profile button restoration and media commit-uncertainty safeguards remain unchanged.

- Source commit: `470236e6bfd271b5800b7bd39bf2cbedcdd37981`.
- Synthetic source-executed regression commit: `c0eab5755aea95833e8079225e22dd56335bd6c1`.
- Reused the existing Recovery230 harness already required by native `alpha:profile:source:test` and `alpha:verify`; no parallel test runner or new feature.
- Corrected harness fidelity: `querySelectorAll('input,textarea,select')` now returns actual input controls rather than a button.
- New tests: account-B privacy-disabled input stays disabled when account-A's upload finishes; same-account relogin restores editable fields but preserves originally disabled fields.

## Verification boundaries and next steps

The prior Recovery394 final-head CI is verified SUCCESS. Recovery395 source and regression commits are recorded, but full Recovery395 CI, exact-head Vercel READY, live synthetic email confirmation, authenticated two-user RLS, connected uploads/messages, Android/iPhone signed packaging and physical-device QA must each be verified independently. A passing source test or preview does not establish backend or native end-to-end behavior.

No shared live Supabase schema/data/auth/security, production deployment or aliases, Kinfolksworld, paid resources, real accounts, or store submissions changed. **Not launch-ready.**
