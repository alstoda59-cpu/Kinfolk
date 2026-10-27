# Recovery252 | Functional native email-signup readiness gate

Date: 2026-10-27 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social only, `kinfolk-social/`. No Kinfolksworld or production edits.

## Starting checkpoint
- Branched from Recovery251 `8efd3a8e6916c0be3763c7374158e18c55f006d3` after inspecting current alpha branches, Recovery251, native scripts/tests, Library notes and nonproduction Vercel deployments.
- Recovery251's read-only Auth GET considered any recognizable HTTP 200 settings response reachable, including configurations with disabled signup, disabled email provider, or automatic email confirmation. That was insufficient to classify an email-verification alpha as functionally configured.
- Official Supabase Auth settings schema includes `disable_signup`, `external.email` and `mailer_autoconfirm`. This change checks the explicit server response, without modifying Auth configuration.

## Implemented on isolated branch
- `0f915f8b3b2f71b26d84c9e1f9e57522a1cf2a16`: `verify-isolated-auth.mjs` now exposes `assertEmailSignupReady` and an opt-in strict mode. It fails closed unless signup is enabled, the email provider is enabled, and email autoconfirm is explicitly disabled. Existing read-only reachability-only mode remains backward compatible.
- `b0e4d109dc0316d2120167b6d7780b624d90c8b6`: functional native gate opts into strict email-signup readiness. The probe remains GET-only, isolated-project pinned and credential-safe.
- `bcc97e0e7f4048e40fbd88d953266f2dbc153d56`: seven new synthetic Node regression tests.
- `60c03d2323a8874ae51a3744b596643789fcb839`: new tests added to `alpha:verify` and functional-gate test scripts.
- `5c32c032e69315179612606474ffb49b2c817353`: fixed the preexisting reachability test's exact-string assertion after the strict-mode argument was added.

## Verification and limits
- Node 22.16.0 locally ran the seven new and six existing reachability tests: **13/13 PASS** after the existing fixture assertion was corrected. The first combined run was 12/13, exposing the fixture mismatch; it was not reported as passing.
- `node --check` passed on all four affected source/test JS modules.
- Local source and test files were Git-blob-hash-matched to the exact committed files: `b245eabdd6541adffeb1405ec932d7aa6b86eaed`, `4986d6f443126394d2e7be7b6872ad13fb06ba4e`, `cb77676948a966584c3a977d76d76bd1a9469d8e`, `e4482c9f2b576e00e65cbeb318531f99d2c59696`.
- Vercel READY was verified for code-and-test integration commit `60c03d23`, nonproduction deployment `dpl_3zXStAGLn8NUfbg6HhHpJrYiSS9j`. It predates the final legacy-test fix and this note. READY is not real backend/device validation.
- Read-only isolated Supabase inspection: 14 public tables with RLS enabled and zero rows; 14 migration records; RLS policy inventory exists, but no two-user policy enforcement was tested.
- Full GitHub Actions CI, real GET using isolated publishable key, signup/email delivery, session restoration, real RLS, native functional APK/IPA and physical Android/iPhone QA remain **unverified**.
- No account creation, SQL mutation, live backend or production changes, paid infrastructure, Kinfolksworld edits, or store submission.

## Next substantive work
Run functional packaging with isolated credentials and real Auth settings response. If strict readiness fails, review the nonproduction project's Auth settings with the owner rather than weakening the gate. Then use synthetic accounts to verify email confirmation, login/logout/session restoration, two-user RLS and media/messaging. Native builds and device QA follow only after those gates.
