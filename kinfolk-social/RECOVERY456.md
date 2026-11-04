# Recovery456 | Token-bound unconfirmed session cleanup
Date: 2026-11-04. Scope: main Kinfolk Social only; Kinfolksworld excluded.

Baseline: Recovery455 branch kinfolk-social/recovery455-signout-failure-regressions-20261104, report commit 03e26e05ff4442677f55936f74a892702462edd5. Reviewed Recovery455 report, index.html effective session handlers, Library prelaunch audit, branch search, and Recovery454 READY Vercel deployment dpl_ARBusYXii4aqCojwkCx4yRtkzsh9.

Application change: kf338RejectUnconfirmedSession now accepts the rejected session rather than just its user ID, and signs out only if the current local session has the exact same user ID and nonempty access token and is still unconfirmed. This prevents a delayed rejection of an older unconfirmed session from signing out a newer same-user login with a different token. Private UI is still cleared before asynchronous verification. Commit 5f0d8b192ed4ae8faadcad153703664015cb7e7f.

Regression source: tests/recovery456-unconfirmed-token-isolation.test.cjs extracts the effective handler and exercises six synthetic scenarios using Node built-ins. Commit 0ba381cbe53ac49b7044eb5f4f9ada4c068138e5. The tests were committed but execution and CI are not independently verified; no passing result is claimed.

Deployment: only the older Recovery454 READY result was independently verified. No Recovery456 preview READY, backend email test, two-account RLS test, Android/iOS compilation, or physical-device QA has been established.

Remaining alpha gates: isolated Supabase organization selection and nonzero cost approval; real signup/email verification and two-account RLS/private-media checks; backend-connected uploads, comments and messaging; native Capacitor build and device QA. No shared live Supabase, production, aliases, Kinfolksworld, paid resources or store changes.
