# Recovery325 | Account-security password change session isolation

Date: 2026-10-29. Scope: **FULL MAIN Kinfolk Social** in `kinfolk-social/` only. Base: Recovery324 final commit `88fbcc1875a0e7f405f98c5f7f5cdcb8be1445e8`. Draft, nonproduction branch; no merge.

## Inspected before editing
- Recovery324 report, draft PR #23, Recovery323 password-reset regressions, native scripts, source CI workflow, current Vercel preview deployment metadata, Library continuation notes, and read-only isolated Supabase table/advisor summaries.
- The latest verified nonproduction preview was READY at Recovery324 commit `21f28fe1`, not at this Recovery325 head. Protected preview is not a functional signup test.
- Separate **Kinfolk Social Alpha Test** Supabase project `viantpfagtbgyyzavmtv` is ACTIVE_HEALTHY. Read-only table listing: 14 empty public tables, all RLS-enabled. Security advisor: zero lints. Community, membership, Channel and Video tables absent. No project settings, auth, policies or records changed.

## Actual application fix
- `kinfolk-phase76.js` Account security password update now pins the opening user ID, authentication activation epoch, and exact sub-screen form.
- An old screen cannot submit after account switch, logout, same-user reactivation or replacement by a new Account security screen.
- Duplicate taps cannot send overlapping `updateUser` calls from the same form. The submit button remains disabled during a pending request.
- A delayed success or failure cannot close another account's/newer screen or show its feedback.
- A success toast requires a returned Supabase user matching the opening account; null/mismatched user response is treated as unconfirmed. Successful updates clear both password fields.
- Existing 12–128-character password policy and dark mobile screen are preserved.
- This client-side guard does **not** replace server-side auth/RLS, prove email delivery, or guarantee cancellation of a request already sent to Supabase.

## Synthetic tests and packaging
- New `tests/recovery325-password-change-session-guard.test.cjs`: nine cases for confirmed success, policy/mismatch, duplicate submits, account switching, same-account activation, replaced screens, auth errors/retry, unconfirmed results and signed-out access.
- Updated the existing password policy fixture to assert the renamed guarded variable without weakening 12–128 enforcement.
- Wired the regression into `native/package.json` `alpha:safety:source:test`, and added this isolated branch to offline-only Android/iOS native compilation workflow.
- GitHub Actions outcomes for the **final commit** must be checked independently. Intermediate Recovery325 source runs failed because of an outdated password policy fixture and a test's assumption about the return value of a mocked toast; both fixtures were corrected. Do not count those failed runs as passes.

## Evidence boundaries / blockers
- Offline CI uses an intentionally unreachable Supabase placeholder; no real signup, email verification, two-account RLS, messaging, media or teen-safety backend tests.
- No physical Android/iPhone tests, signed physical iPhone IPA, production deployment or store submissions.
- A separate owner-confirmed nonproduction backend organization, verified HTTPS email/reset callbacks, real synthetic accounts and native device QA remain necessary before a functional alpha claim.
- No shared live Supabase, production Vercel deployment/aliases, Kinfolksworld, paid infrastructure or stores changed.
