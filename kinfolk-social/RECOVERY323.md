# Recovery323 | Password-reset lifecycle isolation on mobile login

Date: 2026-10-29. Scope: **FULL MAIN** Kinfolk Social only (`kinfolk-social/`); Kinfolksworld excluded. Isolated branch based on Recovery322 final commit `a3ce1e8a2a06f084eb5f57a6ff86af627b5932bb`. Draft review only, no production release.

## Inspected before implementation
- Latest Recovery322/321 reports, Phase76 login/reset code, Phase79 verification resend, native packager, callback validators, native alpha test scripts, GitHub branches/PRs, Vercel previews, Library prelaunch/Recovery232 notes.
- Recovery322 source CI run [40921707372](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/40921707372) completed **success** at exact Recovery322 head.
- Recovery322 native workflow [40921683714](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/40921683714) completed **failure**: Android debug APK job **success**, iOS Simulator job **cancelled**. Not a two-platform pass.
- Latest Recovery322 nonproduction Vercel preview was READY for earlier test commit `2a7d7a73`, but previews are intentionally blocked from the shared live Supabase backend and cannot demonstrate real signup.
- Separate Supabase Alpha Test project `viantpfagtbgyyzavmtv` is ACTIVE_HEALTHY, with 14 empty public tables and RLS enabled; Community, membership, Channel and Video tables remain missing. No database writes.

## Actual application fix
- In `kinfolk-phase76.js`, the existing Forgot Password button now captures its originating email input, login screen, form, and signed-in account identity before calling Supabase.
- A delayed success/error response is ignored after an email edit, form replacement, login mode change or account switch. A one-time input listener invalidates the original request even if the email is changed back. Only the still-current form is unlocked.
- Password recovery callback validation runs before any reset request, preserving Recovery321's native fail-closed rule. Duplicate taps are blocked while pending. A 20-second UI timeout reports uncertainty rather than falsely claiming an email was delivered.
- Successful requests now say that a reset link **has been requested**, not that an email was delivered.
- Seven synthetic runtime regression cases added in `tests/recovery323-password-reset-form-isolation.test.cjs` and wired into native `alpha:auth:source:test` and `alpha:verify`.
- Recovery323 branch added to existing offline-only Android/iOS workflow. This does not enable a real backend.

## Verification boundaries
- The modified handler compiled and passed five direct synthetic V8 exercises in the development environment: success, email change, account switch, screen replacement, and timeout. These are not browser/device tests.
- GitHub CI results for the final Recovery323 commit must be checked separately; writing tests does not prove CI passed.
- Offline native compilation uses the unreachable CI-only Supabase placeholder. No real signup, email delivery, password reset, two-account RLS, media, messaging, teen enforcement, physical Android or iPhone testing was performed.
- A READY Vercel preview is only build/deployment evidence. It is intentionally not an isolated functional alpha.

## Blockers and safety
- A functional native alpha still requires confirmed isolated-backend configuration, verified HTTPS App Links/Universal Links and allowlisted callbacks, server-enforced teen privacy, missing Community/Channel/Video schema and real synthetic-account RLS tests.
- No shared live Supabase schema/data/auth/security, production deployment/aliases, Kinfolksworld, billable infrastructure or app stores were changed.
