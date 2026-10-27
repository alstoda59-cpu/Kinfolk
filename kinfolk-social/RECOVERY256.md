# Recovery256 | Stop legacy authentication modules truncating signup passwords

Date: 2026-10-27. Scope: FULL MAIN Kinfolk Social, under `kinfolk-social/`, excluding Kinfolksworld.

## Start
- Recovery255 branch `kinfolk-social/alpha-readonly-acl-audit-20261027`, head `eec24684a7c9596a387acbfbd63ce125271ba24f`.
- Root cause found from real GitHub Actions browser output: Recovery221's 13-character synthetic signup password became mismatched even though HTML validity was true. Its Auth mock was never called.
- Tracing all loaded auth scripts exposed three conflicting legacy handlers. Phase88 wrapper and Phase98 reset signup to 5–12 characters, and Phase88 Core also set 5–12 and displayed an obsolete hint. These ran repeatedly on mobile, conflicting with Phase79/95's 12–128 policy.

## Implemented
- `7c597904e1f27f4a8883177c5fc7e0dbe181f7ed`: Phase88 signup repair now enforces 12–128.
- `a97bb8f75321528a5fa88afd09d8f2ec637a3b44`: Phase98 signup mode uses 12–128 while the login path remains unrestricted.
- `244e428af98d290e32da66051f38aee79027fbbd`: Phase88 Core respects 12–128 in signup, removes signup limits from login, and updates its help text.
- `5e782b4168c76e33c98c8719bbfb87203ebf62ca` and `59b5292c8663c6b9798c2967247ff78d193851e1`: new synthetic runtime regression tests in `tests/recovery256-legacy-password-bounds.test.cjs` exercise both wrappers individually and together, repeated polling and Phase88 Core.
- `27952869dd88c15ae2cad3a62676f0ec92cff3da`: Recovery212's obsolete 5–12 test expectation updated to 12–128, preserving its reused-form login↔signup assertions.
- The native `alpha:verify` script now executes the Recovery256 test explicitly in addition to its existing backend isolation, local SDK, email-signup readiness, and RLS regressions.

## Actual verification
- Full GitHub Actions CI run [40495620015](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/40495620015), source `27952869dd88c15ae2cad3a62676f0ec92cff3da`, completed **successfully**. This verified the complete synthetic Node suite, mobile-browser regressions, Reels/profile/audio checks, JavaScript syntax and native local-web packaging on that exact commit.
- The CI success predates the subsequent native verification-script wiring and this documentation. It is **not** evidence for those later file changes until their own CI passes.
- A nonproduction Vercel preview reached READY on an early Recovery256 commit. READY is not Auth, physical device or signed binary evidence.
- Isolated Supabase Alpha Test still had zero Auth users and public profile rows when inspected. No real signup, confirmation email, two JWT RLS accounts, backend media/DM smoke, native functional Android APK/iPhone IPA or physical-device QA has been established.

## Launch gate
Proceed with isolated backend Auth settings inspection, authorized synthetic confirmed accounts, owner-private fixture RLS probes, real login/logout/session restore and uploads/DM/Reels tests; then install functional native packages on Android/iOS and complete age/privacy/security/store review. Do not use production accounts or backend, merge to production, incur paid charges or submit app-store releases without approval.
