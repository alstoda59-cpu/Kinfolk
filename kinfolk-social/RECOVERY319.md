# Recovery319 | Community create pending-request isolation across same-account reauthentication

Date: 2026-10-29. Scope: full MAIN Kinfolk Social only (`kinfolk-social/`); Kinfolksworld excluded. Based on Recovery318 branch; no production merge.

## Prior inspection
- Read Recovery318/317 reports, README, existing community source, Recovery307 and Recovery318 tests, native verification scripts, Library Recovery232/226 and prelaunch notes.
- Recovery318 has auth-epoch guards for stale directory/insert completions, but `pendingCreates` was still a Set keyed only by user ID, and success `notice` was also keyed only by user ID.
- A pending INSERT from a logged-out session could block a newly authenticated session for the same account; when the old request completed, its `finally` could delete the new session's pending lock. A previous success banner could reappear after reauthentication.
- Vercel reported Recovery318 code commit `4dd98ab5` READY at https://kinfolk-social-demo-3tj3z6smy-alstoda59-9779.vercel.app/ . This is a fail-closed preview, not a functional auth test.
- Read-only isolated Supabase project `viantpfagtbgyyzavmtv` remains ACTIVE_HEALTHY with 14 public tables, all RLS enabled; no communities, memberships, channels or videos tables. No database writes.

## Implemented
- `30f50523`: use a per-request token and captured auth epoch for Community creation. Same-session duplicate submits remain blocked, but new auth epochs can submit without inheriting an old pending lock. An old completion only clears its own token. Community creation notices are also scoped to the epoch.
- `d072f505`: add three VM-driven runtime tests covering overlapping creates after same-user reauthentication, stale `finally` lock removal, stale failure isolation and success-notice privacy.
- `1e60f2c`: include Recovery319 tests in existing native `alpha:communities:source:test` and therefore `alpha:verify`.

## Verification boundaries
GitHub commits establish source/test changes, not execution. GitHub Actions and new Vercel deployments must be checked separately. Runtime tests are synthetic; they do not verify Supabase auth, email confirmation, RLS, physical Android/iPhone, or installable packages. No new functional backend or native QA was performed.

## Next
Confirm GitHub CI and nonproduction preview for the new branch. Then prioritize real isolated signup/email verification, two-account RLS and current Capacitor Android/iOS builds only with approved nonproduction backend configuration. Do not use the shared live Supabase project for tests.

No shared live Supabase schema/data/auth/security, production deployment/aliases, Kinfolksworld, paid resources or app-store submissions changed.
