# Recovery320 | Native email callback safety and current offline build verification

Date: 2026-10-29. Scope: FULL MAIN Kinfolk Social (`kinfolk-social/`), excluding Kinfolksworld. Continued from Recovery319 final head `6e7d3cf33e3c572e38e4db87c295f145fb59678b` on an isolated branch. No merge to main or production.

## Inspected
- Recovery319/318/317 reports, main README, native packaging and callback validator, native alpha tests, GitHub Actions workflows, Recovery226 Library notes and current Vercel previews.
- Recovery319 full GitHub source checks run 40892427299: completed success on its final head. Its Vercel code preview for `d072f505` was READY but intentionally blocked from shared live Supabase access.
- Read-only Supabase project `viantpfagtbgyyzavmtv`: ACTIVE_HEALTHY; 14 public RLS-enabled tables; Communities, membership, Channels and Videos tables still absent. No auth, data or schema writes.

## Changes
- Strengthened native `alphaEmailCallback`: reject `*.vercel.app` destinations because these previews deliberately block Auth, `*.supabase.co` API endpoints, local names, literal IPv4/IPv6 hosts, fragments, credentials and nonstandard ports. Retain valid public HTTPS paths and query parameters. This is a configuration safety check, **not** proof that Android App Links or iOS Universal Links are configured.
- Added synthetic callback regression cases to the existing native test suite. The native `alpha:verify` script already runs this suite.
- Added this isolated Recovery320 branch to the existing `Kinfolk Installable Alpha (Android and iOS)` workflow's push triggers. Its jobs use the unreachable CI-only Supabase placeholder with `KINFOLK_ALPHA_PACKAGING_ONLY=1`, never real accounts. Android debug APK and unsigned iOS Simulator app are compilation artifacts, not functional login or physical iPhone builds.

## Verification boundaries
- A local isolated Node test harness for the callback validator passed 3/3 focused synthetic tests before commit; GitHub Actions is the authoritative verification for committed code.
- Check latest GitHub source CI, Android and iOS jobs, uploaded artifact IDs and Vercel deployment state separately. Do not treat a queued workflow or READY preview as functional QA.
- No real signup, email delivery, RLS, uploads, messages, physical-device QA or signed store package is proven.

## Blockers
- Functional alpha requires a verified owner-approved isolated Supabase configuration and approved HTTPS callback with real Android/iOS app-link association; do not change shared live Supabase or incur new costs without approval.
- Isolated project lacks Communities/Channels/Video schema. Real two-account RLS, email verification, messaging, teen privacy, and native device acceptance remain unverified.
- Offline-only packages may be installable for navigation inspection but cannot authenticate. Do not represent them as a testable functional alpha.

No production deployment/alias, shared live Supabase schema/data/auth/security, Kinfolksworld, paid resources or app-store submission changed.
