# Recovery271 | Mobile login email and in-flight form identity protection

Date: 2026-10-27 (America/Los_Angeles). Scope: full main Kinfolk Social `kinfolk-social/` only. Kinfolksworld excluded.

## Baseline inspected
- Latest Recovery270 branch/report and its four-commit comparison against Recovery269; Recovery270 is the latest named recovery branch before this checkpoint.
- Phase95 login/token/session flow, Phase98 login field cleanup, Phase79 signup, Recovery226/227 login reports and regression files, native isolated-backend configuration and Auth readiness gate, Recovery226/232 Library notes, and Vercel nonproduction deployment history.
- Recovery270 Vercel READY exists for test commit `50664886`, not for its final documentation commit. The latest Recovery270 combined Vercel status was a build-rate-limit failure.

## Actual application fixes
- `8d7f76e878fb56eaf4b0612207613eb6f871e959`: Phase95 rejects a password-login token response without a user email or whose email differs from the submitted email. It also checks the email on the session returned by Supabase `setSession` before trusting the account.
- `34387b0d10c1d7455a2dc33fddbb2bf972c7ee55`: Verify the email again on the active `getSession` result. Reject stale login responses when the email or password field changes during asynchronous login, including after app activation; existing rollback/cleanup paths remain in use.
- `b130b9861c9a7f71351acd0d4704844287972dec`: Update the existing successful synthetic login token fixture to include its email.
- `397413e50e3b07f0260fbc6d20c2ec411295e324`: Add seven synthetic token/adopt/async-guard regression tests.
- `8830258b9bc497d7c395161991d3f517d09d09ec`: Add two full Phase95 synthetic DOM/auth tests that edit the email or password while the token request is pending and verify zero stale `setSession` or app activation calls.

## Verification
- Re-fetched exact GitHub Phase95 source blob `1e11f8f363e6f93a519a6a9e47e30fa945ada1ab` and the committed regression test sources.
- **15/15** focused synthetic tests passed in a custom V8 adapter: seven new token/session/guard scenarios, two new full Phase95 form scenarios, three existing Recovery227 token/body-timeout tests, and three Recovery215 login-navigation checks. Phase95 and new tests also passed V8 syntax compilation.
- This was **not a Node.js test runner, full GitHub Actions CI, real Supabase authentication, browser/device testing, or proof of email delivery**. The in-memory tests use synthetic accounts and mocked Auth/DOM/fetch.
- Full native alpha packaging, Android/iPhone builds, physical-device QA, real synthetic-account signup/email verification/login/logout/session restoration, cross-account RLS, media/posts/messaging/notifications and teen safety E2E remain unverified.

## Read-only isolated Supabase inspection
- The existing designated alpha project `viantpfagtbgyyzavmtv` is `ACTIVE_HEALTHY`. No new project or organization was selected and no billable resource was created.
- All **14 public tables** currently reported by the isolated project have RLS enabled. The security-advisor endpoint returned zero lints. A read-only `pg_policies` inventory showed policies for the account, posts, comments, messaging, notification and teen-safety tables.
- For the inspected messaging/notification UPDATE policies, `information_schema.column_privileges` limits authenticated UPDATE privileges to `messages.first_read_at` and `notifications.read_at`, respectively. This does not replace adversarial two-user tests.
- No database rows were inserted, updated or deleted. This was a structural inspection, **not real login, RLS penetration testing, or proof of teen privacy**.
- Vercel reports a READY nonproduction preview for code/test commit `397413e5` at https://kinfolk-social-demo-mdw95m3e5-alstoda59-9779.vercel.app/ . Later test/docs commits are not verified READY; the latest docs commit has a build-rate-limit status. READY is deployment state only.

## Boundaries
Only `kinfolk-social/` files changed on a new isolated branch. No shared live Supabase schema/data/auth/security, production aliases, Kinfolksworld, paid infrastructure or app-store submissions were modified.
