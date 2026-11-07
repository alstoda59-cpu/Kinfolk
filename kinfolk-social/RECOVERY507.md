# Recovery507: stale signup confirmation regression (2026-11-07)

Base: Recovery506. Isolated branch: `kinfolk-social/recovery507-signup-confirmation-regression-20261107`.

## Failure evidence
GitHub Actions source-check run 42304549440, job 128190482512, test 1243 (`recovery435-auth-form-rerender.test.cjs`) failed because its expected source pattern required `if(data.session)` immediately after the stale-form guard. The current runtime intentionally also checks `kf338ConfirmedSession(data.session)` before treating signup as a confirmed authenticated session. The prior assertion therefore rejected the stronger confirmation gate.

## Change
Updated the synthetic static regression to require both the stale-form identity guard and the confirmed-session gate. Added assertions that signup is awaited and the form identity is checked before the confirmation result can update the UI. No runtime authentication policy was weakened or modified.

## Verification
Test source commit: `e2b5bf7ece4241dc347c08e255b723bfa9cd0e6d`. Four relevant static patterns were evaluated against the actual Recovery507 auth renderer and all matched. This is not a Node test run or CI pass. Recovery507 source/native workflows, preview READY, Android APK, iOS build, real isolated Supabase Auth/RLS, and physical-device QA remain unverified.

## Boundaries and next actions
No Kinfolksworld, shared live Supabase, production deployment or aliases, paid infrastructure, or app stores were touched. Inspect fresh CI results and remaining failing tests before attempting native packaging. Real backend tests require approval of the isolated Supabase organization and any nonzero cost.
