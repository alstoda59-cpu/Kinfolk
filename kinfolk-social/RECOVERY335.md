# Recovery335 | Confirmed email required after Supabase session adoption

Date: 2026-10-29 (America/Los_Angeles). Scope: full MAIN Kinfolk Social only, `kinfolk-social/`. Isolated continuation from Recovery334 commit `33842501413fdf1995f1a465a3541f03e0d936ad`. No merge to production.

## Inspected first
- Recovery334 source and report, earlier source CI `41002939901` succeeded at `f456df55`. A later documentation-only commit `33842501` had a cancelled source workflow; success is not claimed at that exact later head.
- Recovery334 Vercel nonproduction preview `dpl_9t5GK14EguEc8qrJS9R72HVFAQMW` READY at `33842501`; READY is not functional auth. Previews must remain fail-closed against the shared live Supabase URL.
- Existing Phase95 login and Recovery332/333 synthetic tests; older Library Kinfolk prelaunch audit and Recovery232/226 notes; offline-only Capacitor native build workflow.
- Phase95 verified `email_confirmed_at` on the password-token response, but did not recheck the account returned by `sb.auth.setSession` or `sb.auth.getSession` before opening Kinfolk.

## Actual fix
- Reject a Supabase adopted session whose user lacks a nonblank `email_confirmed_at`.
- Recheck the active session's confirmation before completing login. Keep the existing account-ID/email identity checks and rollback path.
- Add ten synthetic VM tests covering confirmed adoption, absent/null/blank/whitespace confirmation in adopted and active sessions, and an unconfirmed active session after a confirmed adoption.
- Update the older Recovery332 synthetic Supabase fixture to model a confirmed account rather than weakening production guards.
- Include Recovery335 in native auth source verification and offline-only Android debug / iOS Simulator CI. The packages intentionally use unreachable synthetic CI backend credentials.

## Verification boundaries and blockers
- Source CI and native compilation must be checked at the final commit, separately. A READY Vercel preview proves build only.
- Real isolated Supabase signup/email verification, login/logout/session restoration, two-account RLS, missing Community/Channel tables, private uploads/media, teen safety and messaging remain unverified.
- Physical Android and iPhone QA, approved HTTPS email callbacks, and signed iPhone distribution remain blocked.
- No shared live Supabase schema/data/auth/security, production deployment/alias, Kinfolksworld, paid infrastructure, or store submissions were modified.
