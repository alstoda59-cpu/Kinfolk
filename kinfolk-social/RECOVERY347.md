# Recovery347 | Account deletion authentication and modal isolation

Date: 2026-10-30 (America/Los_Angeles). Scope: full main Kinfolk Social, `kinfolk-social/` only. Base: Recovery346 `e4a7ed282f821e0d8f99147a09f53ba8ca96730a`. Isolated draft branch `kinfolk-social/recovery347-account-deletion-session-guard-20261030`. No merge or production release.

## Inspected before changes

- GitHub Recovery346 branch, PR #44, `RECOVERY346.md`, `RECOVERY345.md`, README, actual Phase115 deletion UI, synthetic source/native test configuration, Library audit/continuation notes, Actions and Vercel.
- Recovery346 exact-head source CI [41090993295](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41090993295): **SUCCESS**.
- Recovery346 native workflow [41090983686](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41090983686): **FAILURE** as a workflow; Android debug APK job succeeded, iOS Simulator job cancelled. Do not report both native platforms as passed.
- Vercel showed intermediate Recovery346 previews READY; no deployment for Recovery346 final commit `e4a7ed2` in SHA-filtered read. READY is not browser/auth/backend proof.
- Supabase read-only project listing showed existing `Kinfolk Social Alpha Test` (`viantpfagtbgyyzavmtv`) ACTIVE_HEALTHY, distinct from shared live `Kinfolk`. No backend writes or schema changes.

## Application fix

- `kinfolk-phase115.js`: the **effective** account deletion handler previously checked Auth only once, then asynchronously enumerated and removed private media across three buckets before issuing the final DELETE RPC. Logout, relogin, token refresh, account switching or replacing the modal while those requests were pending could leave the old destructive workflow continuing.
- Recovery347 pins deletion to the initiating account, auth epoch, access/refresh tokens and exact confirmation dialog. Revalidates Auth after CHECK, before/after media listing, before/after each 100-file removal chunk, and before the final DELETE RPC. Prevents overlapping delete taps and closing/reopening the modal mid-request.
- If an account switches while the final DELETE RPC is in flight, the old completion cannot sign out or redirect the new account. Existing dark mobile UI and deletion service contract remain intact.
- This reduces stale-client deletion risk but cannot roll back a storage removal or RPC already sent before the account changed. Backend-side authorization and deletion atomicity still need isolated integration tests.

## Regression coverage

- `tests/recovery347-account-deletion-session-guard.test.mjs`: 12 source-extracted synthetic VM cases covering successful same-session deletion, stale dialog, account switch, same-user relogin, token refresh, replaced dialog, delayed listing/removal, duplicate taps, backend denial, account switch during final DELETE and Auth identity mismatch.
- `native/package.json`: adds the suite to `alpha:safety:source:test`.
- `.github/workflows/kinfolk-alpha-native.yml`: adds this isolated branch for offline Android/iOS compilation with intentionally unreachable CI-only backend.

## Verification boundaries

- The test source and code are committed. Verify the **final exact-head** source CI, Android job, iOS Simulator job and Vercel SHA separately. A queued, pending, cancelled or failed run is not a pass.
- Synthetic tests do not prove real Supabase Auth, email confirmation, RLS, private Storage, backend deletion RPC, device behavior or a signed iPhone IPA.
- No shared live Supabase schema/data/auth/security, production Vercel deployment/aliases, Kinfolksworld, paid resources or app stores were modified.

## Next priorities

1. Resolve any exact-head CI failures, preserve source-backed regression integrity.
2. Isolated-backend synthetic-account signup/email/session and two-user RLS/private-media verification when properly configured and authorized.
3. Physical Android/iPhone QA, approved iPhone signing, and a functional alpha backed only by the isolated project.
