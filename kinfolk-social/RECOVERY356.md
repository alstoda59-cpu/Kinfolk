# Recovery356 | Stay Logged In rollback ownership

Date: 2026-10-30 America/Los_Angeles. Scope: **FULL MAIN Kinfolk Social** in `kinfolk-social/`, excluding Kinfolksworld.

## Verified starting point
- Continued directly from isolated Recovery355 draft PR #53, head `86814b99bc5948ed73fb55aeb5b5244f22bab47f`. No merge or redesign.
- Inspected Recovery355, README, effective Phase95 login implementation, native packaging and source-test gates, existing Library notes and latest Vercel nonproduction deployments.
- The latest observed Recovery355 Vercel preview was READY at intermediate commit `0ce06a1853ab5678309c31e7d0240cbdc081f9bb`. READY alone does not prove Auth, RLS, real uploads or device functionality.
- Read-only project listing identifies the separate `Kinfolk Social Alpha Test` Supabase project `viantpfagtbgyyzavmtv` as ACTIVE_HEALTHY. The shared live project was not modified.

## Actual runtime change
`kinfolk-phase95.js` previously returned a `restoreStay` callback that blindly restored pre-login local/session storage values when a later adoption or account-activation step failed. A newer login or another tab could change the user's Stay Logged In preference while that old login was pending, and the older callback would overwrite the newer choice.

- Version each in-tab preference write; an older rollback cannot undo a newer write, even if both wrote identical values.
- Compare the three saved storage keys before asynchronous rollback. If another tab or session changed any of them, leave all keys untouched rather than clobbering newer intent.
- Keep forced rollback of partially written preferences when the initial synchronous storage write fails.
- Preserve existing login/session/token guards and the dark mobile UI.

## Synthetic verification
- Added seven source-executed Node regression cases in `tests/recovery356-login-preference-rollback.test.mjs`, covering normal rollback, same-value newer saves, changed cross-tab preferences, changed tab markers, partial-write failures, missing original keys and newer nonpersistent preference.
- Wired the test into `native/package.json` auth source gate and added this isolated branch to the existing offline-only Android/iOS CI workflow.
- Exact-head source CI, Android/iOS build CI and final-head Vercel preview must be verified separately; tests committed do not imply they passed.

## Open release gates
Real isolated Supabase email confirmation, two-account RLS, private media, messaging, teen-safety enforcement, backend-connected Android/iPhone packages, signed iPhone IPA and physical-device QA are **not verified**. The existing CI backend marker is unreachable by design. Vercel READY is not an end-to-end test. Not launch-ready.

No shared live Supabase schema/data/auth/security, production deployment or aliases, Kinfolksworld, paid infrastructure or app stores were modified.
