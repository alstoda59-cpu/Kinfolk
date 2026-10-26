# Kinfolk Social Recovery227 | complete login response-body timeout

Date: 2026-10-25 America/Los_Angeles (2026-10-26 UTC).
Scope: **full main Kinfolk Social** only. Kinfolksworld, production, shared live Supabase, release aliases and real accounts untouched.

## Inspected before editing
- Latest Recovery226 Library continuation notes and Recovery133 baseline; current GitHub Phase95, README, validation.json, INTEGRATION.md, browser regression, source CI workflow and native README.
- Latest verified Recovery226 source commit `aee3b96ec9cd7a0887249c27b17f6e6d122b8e0d`, with READY isolated preview `dpl_EzTtvNRfGx54GngrAwcswfGaF4um` (source commit `aee3b96...`, target null).
- Recovery226 source-check run `40280697758` succeeded; native Android debug APK and unsigned iOS Simulator compilation run `40280812502` succeeded. Those builds are not device/backend tests.
- Supabase project `zojajuzmfjpvubzibzgg` has **no isolated development branches** currently listed. No shared live database or auth mutation is authorized.

## Bug and isolated fix
Phase95's password-token request used a 15-second AbortController timer, but cleared it as soon as the fetch returned **response headers**, before awaiting `response.json()`. A network stall while streaming/parsing the body could therefore leave the login promise and disabled Login button pending indefinitely.

- New isolated branch: `kinfolk-social/recovery227-auth-response-timeout`, created from the verified Recovery226 source commit `aee3b96...`.
- Application fix: `kinfolk-social/kinfolk-phase95.js`, commit `804c13f6c515103c58e310b64280c3d38a9274c4`. Keep the abort timer active through response-body parsing; preserve existing timeout message, friendly server errors, request-lock cleanup, session identity and rollback behavior.
- New synthetic regression: `kinfolk-social/tests/recovery227-token-body-timeout.test.cjs`, commit `d7ea4ecbc6f71043a571162ea596437c2e8f85b1`. Three scenarios: stalled body abort, successful JSON timer cleanup, malformed server error JSON. Existing `node --test kinfolk-social/tests/*.test.cjs` CI glob includes the new test automatically.

## Verification and boundaries
- Fetched committed Phase95 and test source back from GitHub; both pass V8 JavaScript syntax compilation.
- Ran an **in-memory synthetic V8 test** against the committed Phase95 tokenLogin function with a fake AbortController and synthetic fetch: stalled body produces the expected timeout, successful JSON returns the expected user ID, and malformed server error JSON returns a failure. No real network traffic.
- **Native Node test suite, GitHub Actions, browser, backend and physical-device tests are not yet verified for Recovery227.** Do not describe the synthetic V8 checks as those tests.
- Vercel currently reports build-rate-limit failure for the Recovery227 test commit; **no READY Recovery227 preview** is verified. Latest known READY preview is Recovery226 `dpl_EzTtvNRfGx54GngrAwcswfGaF4um` at `https://kinfolk-social-demo-b0a5ddwag-alstoda59-9779.vercel.app/`. HTTP/READY does not prove real authentication.
- No branch merge, production promotion, Supabase schema/data/auth changes, or Kinfolksworld edits.

## Next
1. Confirm full GitHub Actions Node and mocked browser results for Recovery227; investigate failures before review or merge.
2. Retry isolated preview after Vercel rate limit clears; verify source commit and rendered auth state.
3. With an owner-authorized **isolated nonproduction** Supabase environment and synthetic accounts, test real signup/login/logout/session restoration and native email callbacks.
4. Test physical Android/iPhone builds, teen backend protections, media, messaging, privacy/RLS, and store requirements. Do not submit or release without end-to-end evidence and explicit approval.
