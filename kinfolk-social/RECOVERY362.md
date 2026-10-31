# Recovery362 | Real signup request smoke test against isolated Supabase Auth

Date: 2026-10-31 America/Los_Angeles. Scope: FULL MAIN Kinfolk Social only, kinfolk-social/. Kinfolksworld excluded.

## Verified starting point and safety boundary

- Created an isolated continuation branch from Recovery361 commit `17432b30b48600f313aec385c5f62ba0a1dd6e34`, rather than modifying the default branch or live app.
- Existing separate project **Kinfolk Social Alpha Test** `viantpfagtbgyyzavmtv` was ACTIVE_HEALTHY. Its auth.users aggregate count before testing: zero (0) total and zero (0) confirmed.
- Read Phase79 production signup handler, its required metadata, email-confirmation source regressions, and isolated native backend config. An actual Phase79 signup uses `signup_birthdate`, `display_name`, `profile_display_name`, `username`, `preferred_language`, and `profile_private`. It requires ages 13–99 and a 12–128 character password.
- No live Supabase project `zojajuzmfjpvubzibzgg` calls, no schema/security mutations, no production deployment, no app store operations, no Kinfolksworld changes.

## Actual nonproduction Auth requests and evidence

Requests were issued via a one-off GitHub Actions workflow against the **isolated** Auth HTTP endpoint with only the publishable client key, never service-role credentials:

1. 2026-10-31 07:17:10 UTC: `GET /auth/v1/settings` returned HTTP **200**; `POST /auth/v1/signup` returned HTTP **500** with database trigger error `Birthday is required for alpha signup`. The first smoke request omitted Phase79's `signup_birthdate`. The smoke request payload was corrected; the app signup already sends that field.
2. 2026-10-31 07:17:59 UTC: `GET /settings` returned 200; corrected signup with birthday but an `example.invalid` test address returned **400 email_address_invalid**.
3. 2026-10-31 07:18:34 UTC: `GET /settings` returned 200; corrected signup with a reserved `example.com` address returned **400 email_address_invalid**.
4. A read-only aggregate check following these requests still showed **zero auth users, zero email-confirmed users**. No test signup was accepted, so session rejection after signup and email-link delivery could not be verified.

Do not interpret these failures as proof that the actual UI signup succeeds or fails: the smoke requests exercise the real Auth API but not a complete browser/native flow. Reserved test domains are not acceptable substitutes for an owner-controlled, deliverable inbox.

## Implemented code and tests

- `native/scripts/verify-real-signup-smoke.mjs`: fail-closed isolated project check; exact publishable-key shape, auth signup-readiness check, required Phase79 metadata, random synthetic profile username, strict unconfirmed-session rejection, and password login denial verification. Real request execution requires `KINFOLK_ALPHA_REAL_SIGNUP_OPT_IN=1`, `KINFOLK_ALPHA_TEST_INBOX_APPROVED=1`, and `KINFOLK_ALPHA_TEST_EMAIL`. Invalid or reserved email domains are blocked. No email address or generated password is logged.
- `native/tests/alpha-real-signup-smoke.test.mjs`: synthetic mock tests for payload, nonproduction isolation, metadata, pre-confirmation denial, invalid response handling, and refusal of reserved addresses. Added to `alpha:auth:source:test` in `native/package.json`.
- Branch-scoped GitHub Action `.github/workflows/kinfolk-recovery362-isolated-signup-smoke.yml`: runs only on explicitly tagged `[signup-smoke]` branch commits. Credentials and approved test inbox now come from GitHub environment secrets/vars instead of hardcoding a project key. Further remote smoke test requires the owner to authorize and supply a deliverable test inbox.
- Draft PR: https://github.com/alstoda59-cpu/Kinfolk/pull/59. Unmerged. No native device QA in this recovery.

## Remaining validation boundary

- Verify the newest exact-commit source CI and synthetic unit tests before claiming pass. Earlier source workflow `41180107889` was **cancelled** by later commits after its Node suite stage succeeded.
- A real end-to-end signup needs an owner-approved inbox, receipt of the verification email, callback/deep-link handling and a confirmed login/logout/session-restoration run on Android and iPhone.
- Two-account RLS remains unverified. Recovery361's static import of `verify-two-user-rls.mjs` does not itself call its exported `verifyTwoUserRls` function; the release gate still needs correction.
- The separate backend and native APK/iOS compilations do **not** establish launch readiness.

**NOT launch-ready.**
