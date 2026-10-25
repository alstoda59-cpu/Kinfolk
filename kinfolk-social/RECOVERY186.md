# Kinfolk Social Recovery186 | password-token account identity

Date: 2026-10-25. Scope: FULL MAIN Kinfolk Social only. No Kinfolksworld, production, or shared Supabase writes.

## Inspected before changes
- Latest Recovery185 GitHub README, INTEGRATION.md, validation.json, RECOVERY185.md, Phase79 signup, Phase95 login, Recovery182 test fixture and Node 22 auth CI workflow.
- Library Recovery133 continuation notes and Vercel isolated deployment history.
- Recovery185's 13/13 offline synthetic login scenarios were documented, but real Supabase and physical-device auth are still unverified.

## Bug and repair
Phase95 previously accepted an authenticated session whose user ID matched Supabase client `setSession/getSession` but **did not check it against the user ID in the password-token REST response**. A mismatched adopted account could therefore be activated. The REST password response is now required to contain a nonempty `user.id`, and `setSession` user ID must match it before proceeding to session verification and activation. Existing account-switch and preference rollback guards are preserved.

## Source, tests and deployment
- Application commit: `157dbef3625ce87dfbbaf5b3d90b5918f7e867d8` (`kinfolk-phase95.js`).
- Test commit: `071d03bb40a454ac4b44e2a305ee8d913a65df05` (two new offline cases in Recovery182 runtime test: missing token identity, mismatched token/adopted account).
- CI configuration commit: `5a9da627bf5c936f349216958a8cdfd930773c8a` (existing Node 22 auth workflow now triggers on Recovery186).
- Fetched the exact committed Phase95 blob `1964553fad417c9ae9c4d8b01edde2f76d1b4ac6`, evaluated it in a synthetic V8 browser fixture, and **4/4 targeted scenarios passed**: matching login, mismatched password-token ID, missing token ID, and mismatched adopted account. This is NOT a Node 22 CI run, real browser, or real Supabase validation. The new test file was committed, but its Node run result is not yet verified.
- Isolated Vercel preview `dpl_Cgj4an9DY756poAMiGggQjcDAxWR`, `https://kinfolk-social-demo-figd540gc-alstoda59-9779.vercel.app/`, READY, target null, GitHub commit `5a9da627bf5c936f349216958a8cdfd930773c8a`. A READY build does not establish functioning login or launch readiness.

## Blockers
1. Owner-authorized isolated Supabase project and synthetic accounts for real signup, login, logout, email confirmation, token refresh and persistence tests.
2. Browser-rendered Home/Reels/settings/media/messaging verification, backend RLS and teen/privacy enforcement.
3. Capacitor Android/iOS debug builds and actual-device testing, native email callback, store policy review.
4. CI run status must be checked. Do not declare passing CI without a completed workflow result.

No production deployment or aliases, live Supabase schema/data/auth/security, Kinfolksworld, real users, secrets, payment commitments, or app-store submission were touched.
