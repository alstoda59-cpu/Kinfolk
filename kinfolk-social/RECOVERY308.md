# Recovery308 | Community membership UI, fail-closed backend and RLS proposal

Date: 2026-10-28 (America/Los_Angeles). Scope: MAIN Kinfolk Social only, folder `kinfolk-social/`. Based on Recovery307. No production or Kinfolksworld changes.

## Inspected
- GitHub Recovery307 branch, RECOVERY307.md, Communities module, Recovery307 tests, native package verification, read-only Library Recovery226/232 notes, and Vercel deployments.
- Recovery307 application preview at commit `7f620dfe` is READY. That is deployment status only.
- Existing isolated Supabase alpha project was reported ACTIVE_HEALTHY but missing `kinfolk_communities`. No schema/auth/security/data was changed in this recovery.
- Official Supabase RLS guidance: https://supabase.com/docs/guides/database/postgres/row-level-security

## Implemented
- `a3952b89`: new `kinfolk-community-membership.js` to show Join/Leave for public communities when an authenticated membership table is available. Scoped reads/writes to the active user, prevented duplicate pending writes, discarded stale account/navigation results, and failed closed on missing backend.
- `4cd9aa84`: add escaped community IDs to rendered public cards.
- `69c6024a`: load membership module after Communities in web/native entry.
- `41503bed`: unexecuted, review-only `review-only/communities-membership-rls.sql` for community and membership tables with authenticated grants, RLS and owner/public access. NOT applied anywhere.
- `e574c3e5`, `57007f95`: six Node synthetic regression cases for join/leave, missing backend, account races, write errors and owner self-join.
- `1d831414`: include tests in native alpha verification.
- `d43e1460`: require membership module in native package verification.
- `acbd0ef8`, `62b982af`: suppress owner self-join controls for their own public communities.

## Evidence categories
- Source committed through GitHub Contents API. Draft PR #8 targets Recovery307, not main.
- Focused synthetic in-tool V8 execution: public join/leave, missing backend, stale account read, owner self-join passed against authored/committed source. Six committed Node tests must be distinguished from CI execution.
- GitHub Actions PR run 40817786544 was IN_PROGRESS at inspection; no full CI success claimed.
- Vercel READY nonproduction preview at commit `41503bed` (before latest self-join guard and tests): https://kinfolk-social-demo-akci0s8jc-alstoda59-9779.vercel.app/ . This is not a real feature test and later commits are not confirmed deployed.
- No real Supabase community table/membership, signup/email delivery, two-account RLS, Android/iPhone build or physical device QA was performed.

## Blocking issues
- Community backend tables missing, so join/leave and create remain unavailable end to end. Review-only RLS SQL must not be applied to shared live Supabase. Isolated organization and any nonzero cost require owner confirmation before provisioning.
- Private invitation, community posting, moderation, bans, teen safety and blocked-user enforcement are not complete. The review-only SQL does not implement them.
- Full alpha requires actual isolated auth/email, backend schema, storage, messaging, privacy and native-device tests. Do not claim launch readiness.
- No shared live Supabase schema/data/auth/security, production deployment/aliases, Kinfolksworld, paid services or app-store submission modified.
