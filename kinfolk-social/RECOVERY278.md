# Recovery278 | Refuse signup over an authenticated session

Date: 2026-10-27 America/Los_Angeles. Scope: full main Kinfolk Social `kinfolk-social/` only; Kinfolksworld excluded.

## Inspected baseline
- Recovery277 and its signup session/email identity fix, Recovery276 redirect restrictions, Phase79 signup and Phase95 login flows, native alpha verification scripts, and Recovery226 native build evidence.
- Library Recovery232 notes: historical isolated preview and CI were not backend/device proof. The designated isolated alpha project from later reports is not the shared live project; no project was created or modified in this recovery.
- Latest verified pre-change Vercel READY for Recovery276 final commit `3256be85`. Recovery277 latest Vercel status was rate-limited; no Recovery277 READY was claimed.

## Implemented
- `2e84a2ff8bb6fcb1efab9f9e83fbe679fde32b7d`: Phase79 signup now fails closed when Supabase cannot confirm there is no active session, and refuses to start signup when any session is present. This prevents an existing signed-in account from being replaced by signup on a stale mobile auth screen. Rechecks the original signup screen and all submitted fields after the asynchronous preflight and before sending signup credentials.
- `5a097fe6d9be738838f1a5801786692b76426004`: seven Node-style regression cases against the actual Phase79 helper and its integration order, covering signed-out, signed-in, malformed session, missing session result, unavailable auth, auth error and preflight ordering.
- `0b681728eff3815b0e23b1187cc05d59a70435b9`: integrate Recovery278 regression into `native/package.json` `alpha:auth:source:test`, which is invoked by `alpha:verify`.

## Evidence
- Re-fetched committed Phase79 blob `04458b23248e501426943bc0bd84ec0761b29438` and ran **7/7 focused synthetic V8 checks** against its exact helper and call order; full Phase79 passed JavaScript syntax compilation.
- The committed Node test file was **not executed with the Node test runner** in this turn. No full GitHub Actions CI pass, real Supabase signup/email delivery/login, RLS, current APK/IPA or physical-device QA is established.
- Vercel READY nonproduction preview for integration commit `0b681728`: https://kinfolk-social-demo-amiu34pr8-alstoda59-9779.vercel.app/ . READY is deployment state, not functional browser QA. Documentation commit may have a different deployment status.

## Remaining blockers
Real synthetic-account email verification/login/logout/session restoration, two-user RLS and teen safety on the isolated backend; complete mobile Home/Reels/Channels/profile/media/messaging functional E2E; current Capacitor Android and iOS builds and physical-device QA. A session can still change concurrently after preflight; backend auth events and end-to-end tests must validate this race. No production, shared live Supabase, Kinfolksworld, paid infrastructure or store changes.
