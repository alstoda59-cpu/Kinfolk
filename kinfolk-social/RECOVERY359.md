# Recovery359 | Exact-token signup session verification

Date: 2026-10-30 America/Los_Angeles. Scope: **FULL MAIN Kinfolk Social** under `kinfolk-social/`; Kinfolksworld excluded.

## Baseline and inspection
- Continued from Recovery358 final head `8ec8e1ab856b6a7a3e156d65c70c15092bfec106`, on a new isolated branch.
- Reviewed Recovery358 report, README, effective Phase79 signup handler, Recovery277/278 session tests, Recovery358 test, native alpha auth gate, Vercel nonproduction deployments and Library prelaunch notes.
- Recovery358 exact-head source CI run `41169043803` was successful. Most recent READY Vercel preview observed was an **intermediate** Recovery358 commit `a1b54bba86cee3e1a0f01246c5e0184b7bbbb456`, not the final head.
- Read-only inspection of `Kinfolk Social Alpha Test` project `viantpfagtbgyyzavmtv` showed ACTIVE_HEALTHY and 14 empty public tables with RLS enabled. This is **not** two-account RLS proof.

## Runtime correction
- `kinfolk-phase79.js` `signupSessionIsCurrent()` previously matched only account ID and email. When a signup returned a session, a newer login to the same account could replace its access token during asynchronous `getSession()`, but the old signup could still write its Stay Logged In choice or perform local sign-out after a storage error.
- Require the original signup session to carry a nonblank access token, and require the current session to have the **exact same token** plus the same ID and case-insensitively matching email. Missing token fails closed.
- The existing verifier is used before `saveStay(stay)` and again before local-only sign-out on storage failure. No server-side sign-out, backend mutations or UI redesign introduced.
- This is a client-side session identity guard, not proof of real signup, email delivery, Supabase RLS, or a guarantee against races between the final check and auth API calls.

## Tests and packaging
- Updated historical Recovery277 synthetic session fixtures to supply tokens, retaining ID/email checks.
- Added `tests/recovery359-signup-session-token.test.mjs` with eight source-executed synthetic tests: exact token success, same-account relogin, asynchronous token rotation, missing tokens, wrong identity, case-insensitive email, backend error, and save/cleanup ordering.
- Added the suite to `native/package.json` `alpha:auth:source:test` and enabled the isolated branch in the Android/iOS native CI workflow.
- Source CI and native compilation must be checked at the exact final commit. Android CI debug APK and iOS Simulator builds use offline backend isolation and do not prove physical-device or backend-connected readiness.

## Release boundaries and remaining blockers
- No live/shared Supabase schema/data/auth/security modifications, no isolated Supabase mutations, no production deployments/aliases, no Kinfolksworld changes, no paid infrastructure and no store submissions.
- Still missing: real isolated signup/email verification; two-account RLS; uploads/posts/comments and messaging end-to-end; teen safety/privacy E2E; backend-connected Android/iPhone builds; signed iPhone IPA; physical-device QA.
- **Not launch-ready.**
