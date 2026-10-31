# Recovery366 | Reject obfuscated or mismatched identities in real isolated signup proof

Date: 2026-10-31. Scope: FULL MAIN Kinfolk Social only, `kinfolk-social/`; excludes Kinfolksworld.

## Verified starting point
- Continued directly from Recovery365 commit `f1d01485d9f0351d6f2bc74cda527b20a2bfbedb` on a new isolated branch, not `main` or production.
- Recovery365 source CI [41184361599](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41184361599) succeeded. The exact Recovery365 preview `dpl_4rdLkdGUoLNawp6zzkDYfrZHsrsJ` was READY at its commit, but READY is not proof of backend signup or native device functionality.
- Inspected Recovery365/364/363/362 reports, Phase79 effective signup, real isolated signup smoke, native package gate, RLS gate, existing synthetic tests, Vercel history and Library Recovery226 notes.

## Substantive change
- `native/scripts/verify-real-signup-smoke.mjs` no longer treats an HTTP 200 and any UUID-shaped user as proof that a **new** synthetic account was registered.
- It requires the returned user's email to match the submitted synthetic email and requires a matching `email` identity with the same user ID and identity email. A missing/empty identities array (including a possible obfuscated existing-user response), wrong provider, wrong owner or wrong address fails closed **before** the password-login confirmation probe.
- Matching ignores email case and surrounding whitespace. The existing checks for an unconfirmed session, denied pre-confirmation password login, approved inbox, designated isolated backend and synthetic-only CLI opt-in remain in place.
- The ordinary mobile app signup path is unchanged; this hardens the credibility of the real-backend acceptance probe rather than claiming an end-to-end user-facing fix.

## Source changes and tests
- Code commit `3df6bf54d5ed8aa9fa4366ade616cbabdaf61136`.
- Synthetic fixture update `277fb69e1e603e7efaa3e3ea41f96fd8530c4d1c`.
- Negative/positive regressions `fddfa9e9b16e8bb82599f22ba2a42f4223f2f67d`: missing/mismatched returned email, missing/empty/malformed/wrong-provider/wrong-owner identities, and case-insensitive matching. No network requests are made by these tests.
- Exact-head CI and preview status must be checked separately. No claim of a passing Recovery366 run is made in this note.

## Unverified and protected boundaries
- No real signup or verification email was sent during this recovery. The isolated project still requires an owner-approved deliverable test mailbox and callback before a valid real signup can be proven.
- Two confirmed isolated synthetic users and private-row fixtures are still needed for the actual read-only two-account RLS gate.
- No backend-connected Android/iOS E2E, uploads, messaging, notifications, teen-policy proof, physical-device QA, signed iPhone package or store review has been established.
- No shared live Supabase schema/data/auth/security, production deployment or alias, Kinfolksworld, paid resources, or store submissions changed. Draft/unmerged. **NOT launch-ready.**
