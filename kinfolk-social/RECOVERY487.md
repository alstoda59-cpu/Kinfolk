# Recovery487 | Reject not-yet-valid RLS credentials

Date: 2026-11-06. Continued from Recovery486 final head `f5ca00e142b79c9519833b64d9531b1ccf193fcf`.

## Implementation
- In `native/scripts/verify-two-user-rls.mjs`, validate optional JWT `nbf` against current Unix time. Reject future or malformed not-before claims before any Supabase request. Preserve support for synthetic offline fixtures that omit `nbf`.
- In `native/tests/alpha-two-user-rls.test.mjs`, add regression coverage for future `nbf`, string/fractional/null values, no network calls on rejection, and valid past `nbf`.
- Existing recovery push workflow already includes this test through the offline security suite and full native `alpha:verify`; no duplicate workflow added.
- Changes confined to main Kinfolk Social native verification code. No production, Kinfolksworld, database/auth/schema, or store changes.

## Commits
- `97a8a61d82bfddf3902f032fa554b91e3d27388e` native validation.
- `5567fa82ea069f4473566ee3178a72accf0954ef` synthetic regression.

## Evidence and blockers
- Recovery486 final-head Vercel preview `dpl_98whenhzefeQoeeJchegtSbihXtZ` was READY when inspected.
- GitHub accepted both source/test commits; this alone is not passing CI.
- No real isolated Supabase login/email-confirmation, live two-account RLS probe, native APK/IPA build, or physical-device test was performed.
- Separate nonproduction Supabase organization selection and any nonzero cost remain subject to owner approval.

## Next
Inspect push CI conclusions/logs and correct any failures; then obtain real isolated backend and device evidence before functional alpha designation.
