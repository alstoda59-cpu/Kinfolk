# Recovery438 | Native signup username validation

Date: 2026-11-03. FULL MAIN Kinfolk Social only. Based on Recovery437 f86ddc4d6d17b2840ff773c12aae93ccc4e60e1b. Isolated and unmerged.

## Verified predecessor
Recovery437 exact-head source CI 41635369921 completed SUCCESS. This confirms synthetic/source checks, not connected backend or physical devices.

## Application change
f8e5937e0cc98f0aba4ab31e0ab7b50c327874a0 validates username against the same 3–24 ASCII letters/digits/underscore rule advertised by the signup HTML pattern before calling Supabase. Native requestSubmit or synthetic form submission can bypass browser constraint validation, previously permitting malformed usernames to reach backend metadata. The guard blocks those requests, reports an inline error, and leaves retry available. No schema/security changes.

## Regression
a845323d3afb9dc51a8a1891a501a0129c8c2fd2 adds executable synthetic tests for invalid usernames and boundary-valid usernames. Final-head CI execution is pending.

## Boundaries
No real email confirmation, synthetic two-account RLS, connected uploads/messaging, final native compilation, or physical-device acceptance verified. No shared live Supabase, production deployment/alias, Kinfolksworld, paid resources, or store changes. Not launch-ready.
