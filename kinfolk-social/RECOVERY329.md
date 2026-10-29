# Recovery329 | Native auth regression suite integrity

Date: 2026-10-29. Scope: **full main Kinfolk Social only**, `kinfolk-social/`. Continuation from Recovery328 commit `174ca0e1d27bf4149ef1d58159537c298d179836`. Isolated branch only; no production changes.

## Inspected first
- GitHub Recovery327 and Recovery324 reports, current Recovery328 native package script, Recovery323 and Recovery325 regression files.
- Library prelaunch audit: private-media storage, real auth, RLS, teen safety, signed builds and device QA remain launch blockers. Older Library findings describe the shared production project and are **not** permission to change it.
- Vercel recent READY previews are Recovery327 intermediate commits, not Recovery328/329 functional backend verification. The preview intentionally fails closed against the shared live Supabase backend.
- Recovery328's native auth command included `../tests/recovery324-password-reset-overlap.test.cjs`, a nonexistent file. Recovery324's report confirms its overlap regression was added to the **existing** `recovery323-password-reset-form-isolation.test.cjs`.

## Committed changes
1. Removed the nonexistent Recovery324 test path from `native/package.json`; retained the existing Recovery323 test containing the overlap regression and the Recovery325 password-change session regression under the native authentication suite.
2. Added `native/tests/alpha-source-suite-paths.test.mjs` to verify all source-suite test file paths exist, reject duplicate or malformed test arguments, guard against silently reduced coverage, and assert the auth regression suite includes the real reset/change test files.
3. Wired the new integrity test into `npm run alpha:verify`, so missing test files fail the native alpha gate before later source suites.

## Evidence and limits
- GitHub confirmed the Recovery323 and Recovery325 source test files exist; the nonexistent Recovery324 file returned 404.
- Changes are committed on an isolated branch. The new full CI result and native compilation must be checked at the final head; no local full test pass is claimed here.
- This repairs test execution reliability; it is **not** proof of live signup, email verification, session restoration, RLS, upload, messaging or device functionality.

## Next gates
- Run source CI and native Android/iOS offline compilation on the exact branch head, fix failures, then establish isolated-backend two-account synthetic auth/RLS evidence.
- Keep missing Communities/Channels/Video tables, HTTPS verification/reset callback approval, private media, teen server enforcement and physical-device testing as explicit blockers.
- Do not change shared live Supabase schema/data/auth/security, production Vercel deployment/aliases, Kinfolksworld, paid resources or app stores.
