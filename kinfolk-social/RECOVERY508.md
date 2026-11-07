# Recovery508: preview guard idempotence and fail-closed CSP regression (2026-11-07)

Base: Recovery507. Isolated branch: `kinfolk-social/recovery508-preview-guard-idempotence-20261107`.

## Evidence
Earlier GitHub Actions source-check run 42304549440, job 128190482512, showed two Recovery317 failures: the test expected `connect-src 'self'` although the shipping preview guard intentionally blocks all connections with `connect-src 'none'`; executing the guard twice installed two CSP meta nodes (2 versus 1).

## Changes
- `kinfolk-preview-isolation.js`: introduce a separate installation marker only after inserting the restrictive CSP. Do not rely on the publicly preseedable `__kinfolkPreviewBackendBlocked` state to skip isolation. This prevents duplicate CSP and submit interceptors on repeated execution.
- `tests/recovery317-preview-isolation.test.mjs`: require `connect-src 'none'`, `worker-src 'none'`, reject the permissive `connect-src 'self'`, assert single installation, and explicitly preseed the public blocked flag before guard execution.

## Verification boundary
Commits accepted by GitHub: `c3c8ea8c4ad6ac44570d0d400a102b1fc5c4f767`, `95a0693d97f48de4f33b7f92e5efd8e5be53dfa2`, `dce9ef4b1d154d2fbab6dc2f1473c5791a68a326`. Changes were reviewed against source and historic failure output. No local Node run (GitHub network unavailable from build container), passing Recovery508 CI, preview READY, Android APK, iOS build, connected isolated Supabase Auth/RLS or physical device result has been verified.

## Boundaries
No Kinfolksworld, live Supabase schema/auth/data/security, production deployment/aliases, paid resources or app stores modified. Continue by checking Recovery508 CI and remaining source failures, then native compilation and synthetic device QA. Isolated Supabase organization and any nonzero cost still require owner confirmation.
