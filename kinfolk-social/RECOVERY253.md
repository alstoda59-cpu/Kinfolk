# Recovery253 | Read-only two-synthetic-account RLS probe

Date: 2026-10-27 (America/Los_Angeles). Scope: full main Kinfolk Social only, `kinfolk-social/`. No Kinfolksworld or production changes.

## Starting checkpoint
- Branched from Recovery252 `kinfolk-social/alpha-auth-signup-readiness-20261027` after inspecting Recovery252, native scripts/tests, current alpha branches, Library Recovery226/232 notes, Vercel previews and isolated Supabase metadata.
- Isolated project `viantpfagtbgyyzavmtv` is ACTIVE_HEALTHY. Read-only list_tables shows 14 public RLS-enabled tables with zero rows. RLS enabled alone is not a two-user enforcement test.
- The existing functional native gate checks Auth reachability and email-confirmation configuration, but does not verify private-row isolation.

## Implemented
- `5f1cd3e166f8fe0e7322f1b9ebce7db10ca8cf09`: `native/scripts/verify-two-user-rls.mjs`, a fail-closed, read-only PostgREST GET probe pinned to the isolated alpha project. Requires two distinct, explicitly designated synthetic authenticated JWT subjects and checks five owner-private tables: `kinfolk_safety_settings`, `user_settings`, `kinfolk_user_preferences`, `notification_preferences`, `kinfolk_profile_extras`. It requires one actual owner fixture per account, denies both cross-account directions and anonymous visibility, and accepts HTTP 401/403 only for non-owner requests. Only `user_id` is selected. No account creation or data mutation.
- `e5536193cb4d717440798041450581996c0c82b3`: seven regression scenarios covering owner/cross/anon checks, missing fixtures, exposure, denied access, backend pinning and account identity.
- `4c604fa9a16446f1191374bf4813affe37e0972d`: `native/package.json` integrates offline regression tests into `alpha:verify` and adds explicit opt-in `alpha:verify:rls` for real synthetic JWTs. The real probe is intentionally NOT run in ordinary offline CI or against real users.

## Evidence
- Exact committed probe source Git blob `e85a8facdac966c12cfee7c59ff511d7f0dac014` passed 7/7 focused synthetic V8 scenarios with mocked fetch, JWT decoding, URL and AbortController. This is not a Node CI result.
- An earlier local Node 22.16.0 draft of the same probe design passed 7/7 tests; that draft is not byte-identical to the committed source and must not be described as a committed-source Node pass.
- Full GitHub Actions CI and real two-user Supabase REST requests are unverified. Zero-row tables mean real RLS tests cannot yet pass without authorized synthetic accounts and seeded owner fixtures.
- Existing Vercel READY for Recovery252 code/test integration does not establish this branch deployed, backend tested, or native-device ready.

## How to run after creating two isolated synthetic fixtures
Set `KINFOLK_ALPHA_SUPABASE_URL`, `KINFOLK_ALPHA_SUPABASE_PUBLISHABLE_KEY`, `KINFOLK_ALPHA_TEST_USER_A_JWT`, `KINFOLK_ALPHA_TEST_USER_B_JWT`, `KINFOLK_ALPHA_TEST_USER_A_ID`, `KINFOLK_ALPHA_TEST_USER_B_ID`, and `KINFOLK_ALPHA_SYNTHETIC_ACCOUNTS_ONLY=1` in a secure local/CI environment. Then run `cd kinfolk-social/native && npm run alpha:verify:rls`. Never commit tokens, passwords, or private rows. JWT payloads are decoded locally only to check expected IDs; the Supabase API verifies token signatures.

## Remaining alpha blockers
Real synthetic signup/email confirmation/session restore, owner-fixture provisioning and two-user RLS execution, Reels/Channels and storage/media/backend integration, complete native Android/iOS packaging, physical device QA, and release approval. No shared live Supabase schema/data/auth/security, production deployment or aliases, paid resources, Kinfolksworld, or app-store submissions were changed.
