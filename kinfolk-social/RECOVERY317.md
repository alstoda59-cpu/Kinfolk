# Recovery317 | Fail-closed Vercel preview before live backend access

Date: 2026-10-29 (America/Los_Angeles). Scope: full MAIN Kinfolk Social in `kinfolk-social/`, excluding Kinfolksworld. Continued from Recovery316 head `f11224b8427132331e17fb053909c8fe76a2be68`.

## Inspected before changes
- Recovery316 report and README, native `prepare-web.mjs`, `alpha-backend-config.mjs`, native package/verification scripts, auth startup HTML, source CI, native workflow, Recovery226 build evidence, and Library prelaunch/Recovery139/232 notes.
- Recovery316 final source CI runs [40873606625](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/40873606625) and [40873601168](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/40873601168) completed SUCCESS (synthetic only).
- Vercel Recovery316 preview READY; its source still embeds the shared live Supabase project, making it unsafe for signup or test writes.
- Read-only isolated Supabase `viantpfagtbgyyzavmtv` inspection: ACTIVE_HEALTHY, 14 public tables with RLS enabled. Communities, memberships, channels and videos are absent. No backend writes.

## Actual changes
- `e68634ed`: add `kinfolk-preview-isolation.js` to fail closed on `*.vercel.app`. Before SDK initialization it injects a CSP that blocks cross-origin API requests, images, media, form submissions and frames, plus an accessible dark warning overlay and capture-phase form protection. This is defense-in-depth, not proof of full backend isolation on every host.
- `80ea4d6c`: load the guard before the Supabase CDN and main-app auth boot. Production custom domains and Capacitor localhost do not match the preview hostname rule.
- `03d9f094`: prevent duplicate CSP/overlay registration.
- `3736f06f`: seven synthetic Node tests for hostname scoping, CSP directives, overlay, form suppression, idempotence and boot order.
- `22b1ebed`, `1e228c4e`: require the Node tests in native `alpha:verify` and preserve the guard in the complete Capacitor bundle.
- `9dba0728`: browser regression fixture intercepts every request and checks a synthetic attempted live fetch is blocked by CSP on Vercel host, while localhost is unaffected.
- `b041daaf`: include browser regression in existing Chromium/WebKit source CI.
- Draft [PR #17](https://github.com/alstoda59-cpu/Kinfolk/pull/17) targets Recovery316 only. Do not merge to main/production.

## Verification and limitations
- The source/test commit `1e228c4e` passed the GitHub Actions **Complete Node regression suite (synthetic only)** step on run [40882838638](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/40882838638); the full workflow was not yet completed when this report was drafted.
- Nonproduction Vercel preview for source/test commit `3736f06f` is READY: https://kinfolk-social-demo-es8dkdzrp-alstoda59-9779.vercel.app/ . READY only means deployed. It intentionally displays a blocked-preview warning rather than a usable login; no real browser request to this preview was executed in this run.
- New Chromium/WebKit synthetic browser regression and final branch CI still require a completed workflow result. No claim of browser pass until that result is checked.
- Native package parity is source-checked; no new APK, iPhone IPA, iOS Simulator build, physical device test or real isolated signup/RLS test was completed.

## Next launch gates
1. Configure an owner-approved, zero-unapproved-cost isolated backend for **functional** preview/native alpha; review organization/project and publishable key before any backend writes. Do not use the shared live project for tests.
2. Finish missing isolated Communities/Channels/Video schema and RLS only after approval; verify email confirmation, login/logout/session restoration, teen/privacy, media, messaging and reporting with synthetic accounts.
3. Produce current native debug Android APK and iOS Simulator build; verify real Android/iPhone behavior and signed distribution separately. Offline CI packaging artifacts are not functional login builds.

No production aliases/deployments, shared live Supabase schema/auth/security/data, Kinfolksworld, paid resources or app stores changed.
