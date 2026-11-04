# Recovery453 | Require a real access token for confirmed mobile sessions
Date: 2026-11-04. Scope: full main Kinfolk Social only; Kinfolksworld excluded.

Baseline: Recovery452 exact-head f4547f8d6f09ee1a984d1f7ec56bcc7a7023ef6c, Vercel deployment dpl_AVGy8kPLC711Y3erY5ZmBHjdj2PT READY. Reviewed Recovery452, source of the confirmed-session predicate, regression tests and CI workflow.

Application fix: the effective kf338ConfirmedSession predicate previously accepted a user object with an ID and confirmation timestamp even when no access token existed. The session activation gate now also requires a nonempty string access_token, preventing malformed restored or synthetic sessions from being treated as authenticated private access. Does not change email verification policy, production resources, or visual design.

Application commit: 02da06cedd07cdc077d56ebdc9d4e49454857dc6. Regression commit: 297b5ef1604488f1b0fc7f6030a4bc2c8400a32a. The existing executable confirmed-session regression now includes missing, whitespace and non-string access-token cases, and updates valid fixtures to include a synthetic token.

Evidence: GitHub accepted commits. Vercel READY for Recovery452 is deployment-only evidence. The updated Node regression and GitHub Actions results are not independently confirmed at report authoring; no real Supabase auth/email, two-account RLS, connected uploads, native build or physical-device QA claimed.

Remaining gates: isolated Supabase organization selection and any nonzero cost approval, synthetic account end-to-end email verification and session restoration, two-account privacy/RLS/media, native Capacitor compilation and device testing. No shared live Supabase schema/data/auth/security, production deployment or aliases, Kinfolksworld, paid resources or stores modified.
