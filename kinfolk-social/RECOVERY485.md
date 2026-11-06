# Recovery485 | Functional RLS proof requires expiring Auth tokens

Date: 2026-11-05. Based on Recovery484 final head `95ca5a4cd489a3e101e425d2d13492048dcf2807`.

## Implemented
- The functional alpha RLS release gate now requires an `exp` claim in both synthetic-account JWTs, in addition to the existing valid/future expiry check. An unexpiring handcrafted fixture can no longer qualify as functional backend privacy evidence.
- Offline mock-based `verifyTwoUserRls` calls retain optional expiry for existing test fixtures, but the functional release path opts into strict expiry.
- Updated functional RLS mock JWTs to carry a future expiry and added a regression proving the gate rejects a missing expiry before network access.
- No changes to shared live Supabase, production, Kinfolksworld, or app appearance.

## Commits
- `1c7d4c26fb930dbe7ccb6fd17356a20c9d1ff2b5`: JWT validation option.
- `aaa6a95ce9d9dea65191fecf31697294a68a158c`: enforce functional gate requirement.
- `2ff123507039c6f1d82dd9e43b19b583f0d1142d`: regression.

## Evidence and blockers
- GitHub accepted all source/test commits. Test execution and GitHub Actions success require independent evidence.
- Recovery484 final-head nonproduction Vercel preview was READY.
- This validation is not proof of a real signed-in session, email delivery, connected media, or two-account RLS behavior. Isolated Supabase organization and any nonzero cost still need approval.
- Local repository cloning for independent tests remains blocked by GitHub DNS resolution.
- Fresh Android/iPhone binaries and physical-device QA remain unverified.

## Next
Verify exact-head Actions logs; execute synthetic real-account email-confirmed Auth and read-only RLS on the approved isolated project; then compile and install native builds. Never promote packaging-only or preview READY to functional alpha.
