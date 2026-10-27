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
