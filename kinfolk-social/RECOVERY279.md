# Recovery279 | Native alpha email confirmation callback gate

Date: 2026-10-27 America/Los_Angeles. Scope: FULL MAIN Kinfolk Social `kinfolk-social/` only; Kinfolksworld excluded.

## Baseline inspected
- Recovery278 branch/report and latest GitHub branches (no Recovery279 branch existed before this run), Phase79 signup/resend, isolated native backend configuration, Capacitor web packager, native functional/backend/package verifiers, and source test scripts.
- Library Recovery226/232 notes: earlier offline Android/iOS Simulator CI artifacts are historical packaging proof, not current native functional or physical-device QA.
- Vercel confirmed READY for Recovery278 final documentation commit `a125de227aaff17def9303091a3c3cfb7201affd`; this is a nonproduction deployment status, not rendered/browser E2E.

## Actual application and native packaging changes
- `d3542f866e774713ea21e9c7405677829a25082e`: Phase79 refuses native signup and verification resend without an explicit valid HTTPS `KINFOLK_EMAIL_REDIRECT_URL`. Capacitor WebView origins no longer silently fall back to the Supabase project's default Site URL. Ordinary HTTPS web-preview fallback remains unchanged.
- `2b35944aaf8d93fb42682fe7ab68392fc5cfa560`: seven runtime redirect regression cases.
- `9bdb11356d5c65d322ba8a2c529910b0127d5f57`: integrate redirect tests into native auth source gate.
- `00c6bd8fd62fd36640cf337a334d17b5461de419`: native callback URL validator rejects non-HTTPS, loopback, credentials, fragments; callback remains optional for offline packaging checks.
- `4109fc506d292ad64c4c2fdf0d090997d6f22650`: native packager injects the configured HTTPS callback into Capacitor HTML before app scripts, without changing the web preview.
- `22a5c950868de0c9ec249b84a6ff6fb6ee73a729`: functional native alpha verification requires explicit callback configuration.
- `3442c93950703b642aa57386804b822d01e8355d`, `4db6acae68f5c05ce3c151199e4e62e5eef01568`: package verifier checks callback matches environment, including corrected regex for absent callback.
- `676e8bd2f158fa441900f94469103bde4c15316d`, `de302527d24eb695db24b98d7b1e60f0a078604b`: callback validator/wiring tests integrated into native alpha verification.

## Executed evidence
- Local Node.js 22 test runner: **7/7** runtime redirect tests passed against a byte-matched copy of the exact committed Phase79 helper (FNV-1a `3687325c`, 1,096 characters).
- Local Node.js 22 test runner: **3/3** callback validator tests passed against byte-matched committed validator (FNV-1a `94ce24e2`, 874 characters).
- Eight exact-GitHub-source syntax/static/isolated packager-snippet checks passed: Phase79 syntax, callback injection, local SDK preservation, offline packaging without callback, functional gate, package verifier, corrected regex, and test wiring. The existing `index.html` has exactly one closing `</head>` and expected SDK replacement anchor.
- These are **not** a full native `npm run alpha:verify` run, GitHub Actions CI, full package compilation, real Supabase signup/email delivery, callback App Links, browser integration, Android/iOS builds or physical-device QA. The fourth committed native callback test (static file wiring) was inspected against exact source but not executed in the Node runner.
- Nonproduction Vercel READY was observed for Recovery279 application and initial packaging commits, but not established for the final checkpoint; READY is deployment state only.

## Outstanding blocking configuration
The owner-approved isolated Supabase project exists, but no verified, approved HTTPS email callback destination/allowlist and Android/iOS App Links association were established here. Functional native alpha now deliberately fails closed until `KINFOLK_ALPHA_EMAIL_REDIRECT_URL` is supplied and the isolated Supabase redirect allowlist is independently verified. Do not set this to the shared live or production domain by assumption. No backend configuration was changed.

Real synthetic-account email verification/login/logout/session restoration, two-account RLS and teen privacy, Home/Reels/Channels/profile/uploads/messages/notifications E2E, current native artifacts, and physical-device QA remain unverified. No production aliases, shared live Supabase schema/data/auth/security, Kinfolksworld, paid resources, or store submissions changed.
