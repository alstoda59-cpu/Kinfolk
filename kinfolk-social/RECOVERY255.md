# Recovery255 | Read-only alpha database permission audit

Date: 2026-10-27. Scope: FULL MAIN Kinfolk Social in `kinfolk-social/` only.

## Source and isolation
- Continued from Recovery254 branch `kinfolk-social/alpha-rls-both-owners-20261027`, head `c4bb3640f7219c7929c07b6a551f5b592696fbb8`.
- New development branch: `kinfolk-social/alpha-readonly-acl-audit-20261027`.
- Isolated Supabase project: Kinfolk Social Alpha Test, project ref `viantpfagtbgyyzavmtv`.
- No shared live Supabase, Kinfolksworld, production Vercel alias, accounts, device installations, paid resources, or app-store submissions were modified.

## Implemented
- Commit `bf792783b43d918ec460214b3fdfd377dcf154e4`: add `tests/alpha_isolated_permissions_readonly.sql`.
- The SQL performs **read-only** inspection of RLS flags and column/table grants. It includes checks for 14 public tables, anonymous SELECT restrictions on five owner-private tables, and tightly scoped update permissions for messages, notifications, and friend requests.
- The script contains no fixture creation, INSERT/UPDATE/DELETE, DDL, tokens or passwords. Use only in the designated isolated project and treat any false/missing check as a static security blocker.

## Verification
- The exact committed SQL file (Git blob `3fe28923f28573763646081d3126bfbc63f1c0f6`) was fetched from GitHub and executed using a read-only Supabase SQL request against the isolated project. Result: **34/34 permission checks passed**.
- Supabase `list_tables` showed 14 public tables with RLS enabled and zero rows.
- Supabase security advisors returned no notices at inspection time. These checks do not prove RLS enforcement with real verified Auth JWTs.
- Previous Recovery254 code/mock tests, full CI of this branch, real email-confirmed account flows, network uploads/messages and physical Android/iPhone testing are **not verified by Recovery255**.
- A Vercel READY preview was seen for the preceding `alpha-two-user-rls-probe-20261027` branch; no Recovery255 preview or functional native release is claimed.

## Next release blockers
1. Verify actual isolated email signup settings and two authorized synthetic confirmed users, then run account A/B login, logout, session restore and cross-account tests with real JWTs.
2. Seed isolated synthetic fixtures to run `native/scripts/verify-two-user-rls.mjs`. The read-only SQL audit is complementary, not a replacement.
3. Verify private media, DMs, feeds, Reels/Channels and teen safety on actual Android and iOS test devices.
4. Produce functional isolated-backend Android/iOS builds and obtain explicit owner approval for any production/store release or any nonzero-cost resource.

Do not merge into production based solely on the 34 static checks.

## Follow-on mobile signup and regression work in this checkpoint
- `a811de6360310226878906d8610770ca83d136e0`: update older native-backend security test fixtures for the designated isolated Supabase project, preserve rejection of other backends. Subsequent Node suites passed.
- `a8c559e73a61ee8d8627f7c0cc0de812cb7b16a8`: correct invalid-length synthetic confirmation password in Recovery218 browser test.
- `3a575c19c893eaf8b3d7058af3729110422ab2de`: add actionable signup-retry diagnostics to Recovery133.
- `ac3ad8daa367d590725a45358ec722fef1c900ab`: render pending-email verification panel synchronously on signup success instead of relying only on a later observer callback.
- `eb5ce5020f5ea687b5ac0e0b0bc0e7c8946b07df`: upgrade three synthetic Node DOM fixtures to support the verification panel without faking authenticated accounts.
- `7468a130df4150f73d18a42f834890892cbc91d4`: instrument Recovery221 browser test and locate a fast-mobile form mismatch: browser validity passed, but the two password input values differed; Auth was correctly not called.
- `1e9673c8d78232b3939ec2a41010f3e701757240`: ensure the reused signup password field receives 12–128 character limits as soon as the signup gate mounts. Password minimum and age protections remain unchanged.
- `03bd75a856f90b89e5fc09de78c2021e6bef0967`: assert those bounds are ready before synthetic Recovery221 signup.
- `5f0b06315434ea43591934165a3462d750ff86c6`: make Recovery129 synthetic age-gate test wait for both mounted password inputs and compare their values before submit. Recovery129 passed in CI run `40494175850`.
- `e2e844f2956fb19a4cc9d79679a11bd61eb9a458`: apply corresponding readiness guard to Recovery133 synthetic signup, age and retry tests.

## Actual CI limitations
- Multiple GitHub Actions rounds exposed previously masked fixture and timing failures. The Node regression suite passed at the latest checked code round before this note, but the **full workflow has not passed**.
- CI run `40494175850` passed Node and Recovery129 browser scenarios, then failed in Recovery133 at an underage assertion. Recovery133 now waits for the password limits and verifies field equality, but this latest code requires a fresh CI result.
- Real email delivery, confirmed two-account JWT RLS tests, native functional APK/IPA, device QA, signup and social media end-to-end tests are **still outstanding**.
- The changes have not been approved for merge, production, paid use, or store submission.
