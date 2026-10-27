# Recovery263 | Bound stalled signup requests on mobile

Date: 2026-10-27 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social `kinfolk-social/` only, excluding Kinfolksworld.

## Baseline inspected
- Continued directly from Recovery262 `kinfolk-social/recovery262-resend-timeout-20261027` at `6a5b5612e051f298e2da7694e62fead950390a04` after reviewing Recovery262, Phase79 and its existing test harness, Recovery226/232 Library notes, Vercel READY preview metadata, GitHub branch comparison and native verification script.
- The isolated `Kinfolk Social Alpha Test` Supabase project `viantpfagtbgyyzavmtv` reports ACTIVE_HEALTHY. This does not prove email delivery, auth correctness or RLS enforcement.
- Found that a never-settling `sb.auth.signUp()` request left the signup button disabled and the signup lock active indefinitely. Resend had a timeout from Recovery262, but signup did not.

## Implemented
- `65507924428551c807aabb98a64cff38120110f4`: limit the signup UI wait to 25 seconds using `Promise.race`, release the signup button and lock on timeout, and show neutral messaging that the server may still have created an account. No false signup success or email-delivery claim. Prevent immediate duplicate account-creation requests with a 60-second in-memory retry hold; login navigation remains available. Ignore late responses after timeout. Fail closed on malformed null signup responses.
- `2a13847ee03a2f9503ac9168c505de2c7155b8f4`: four additional synthetic Node-test scenarios for stalled signup, duplicate prevention, late completion, navigation and malformed responses; extend fake timers to exercise 25-second signup timeout.
- `5cffb88237c773471c5591832c187ad19d70c167`: update the existing guard-count assertion to account for the added timeout navigation guard.

## Verification evidence
- Re-fetched exact GitHub Phase79 source blob `d068aaed0d851dde85979830ccda5f201898f41d` and test blob `f915c2192ce3f1dce6c44880606f00c410455371`.
- Executed **21/21** committed regression scenarios in a synthetic V8 adapter with mocked DOM, Auth, timers, Node test/assert and URL APIs. No failures. Both committed files compiled with V8 `Function` syntax. This is NOT a real Node test runner, browser, GitHub Actions, backend email test or device test.
- Nonproduction Vercel preview `dpl_CWovPEAvuBdtz9WEJyENr3Ztit6B` reports READY at test commit `5cffb882`, target null: https://kinfolk-social-demo-foeh371g0-alstoda59-9779.vercel.app/ . READY does not establish rendered UI or backend functionality. Final documentation commit deployment not yet checked at note creation.
- GitHub combined commit status shows Vercel success; full GitHub Actions CI remains unverified.

## Remaining blockers and scope
- Real isolated synthetic signup, email confirmation, login/logout, session restoration, two-account RLS, Home/Reels/Channels, media/profile, messaging, notifications and teen privacy need end-to-end testing.
- No functional Android/iPhone build or physical-device QA verified in this checkpoint. Prior Recovery226 native CI artifacts do not prove current code is packaged.
- No shared live Supabase schema/data/auth/security, production deployment or aliases, Kinfolksworld, paid resources or app-store submissions changed.
