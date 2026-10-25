# Kinfolk Social Recovery181 | signup account-switch protection

Date: 2026-10-25. Full MAIN Kinfolk Social app only. Kinfolksworld excluded.

## Inspected source of truth and prior evidence
- Continued from `kinfolk-social/recovery180-signup-storage-atomic` (not Recovery133 or a guest demo). Read `README.md`, `validation.json`, `INTEGRATION.md`, `RECOVERY180.md`, Phase79 signup, Phase95 login, index session restoration, Recovery179/180 tests, Recovery133 and Recovery175 Library continuation notes, and Vercel deployment history.
- Previous Recovery180 READY preview: `dpl_3cedAWQGgoHito1LadgrzRh7M4of`. Prior tests: 9/9 synthetic V8-harness checks; no verified real backend or device tests.
- Live Supabase project `zojajuzmfjpvubzibzgg` is NOT an authorized isolated test backend.

## Change
- A delayed successful signup response could overwrite the Stay Logged In choice of another account that became active while signup was pending.
- Phase79 now checks `sb.auth.getSession()` (when available) against the signup session's user ID before writing preference storage. If the account changed, it stops without changing the other account's preference.
- On storage failure, Phase79 rechecks which account is active before attempting local sign-out. It does not sign out a different account.
- If local sign-out fails, the form explicitly warns that the session may remain active and instructs manual sign-out rather than implying cleanup succeeded.
- For test harnesses without `getSession()`, existing behavior is preserved; real Supabase clients support `getSession()`.
- Existing dark UI, age 13+ validation, teen protections, Home/Reels, settings/music, uploads, messaging, and native scaffold remain unchanged.

## Commits and verification
- Source: `4ce9e6083839573398dececc119adcb25b4f1fc4` (`kinfolk-phase79.js`).
- Five new Node regression scenarios: `038e0cf3e1bf9a8bf9f883c390cd40198c7e991b` (`tests/recovery181-signup-account-switch.test.cjs`).
- GitHub Actions workflow: `7635f711157536c309d31c898af76c1aff497af9` (`.github/workflows/kinfolk-recovery181-auth.yml`), configured to run Recovery179, Recovery180 and Recovery181 suites on Node 22.
- Exact committed source and all three committed test files were exercised in a synthetic V8 harness with mocked Node test/assert/fs/vm APIs: **14/14 scenarios passed** (5 Recovery179 + 4 Recovery180 + 5 Recovery181). This is NOT a real Node process or a confirmed GitHub Actions run.
- Isolated preview `dpl_6xWXjoYwfY7mPSF56EJzSeq2mXwD`, `https://kinfolk-social-demo-f9pj1ky5k-alstoda59-9779.vercel.app/`, READY, target null, source commit `7635f711157536c309d31c898af76c1aff497af9`.
- Authenticated Vercel fetch returned HTTP 200 for `/` and `/kinfolk-phase79.js`; deployed Phase79 contains `signupSessionIsCurrent` and the manual sign-out warning. HTTP 200 is not rendered browser, authentication, or device QA.

## Blockers / next work
1. Confirm GitHub Actions Node test conclusion; run browser race tests and real signup/login/logout/session restoration against an authorized isolated nonproduction Supabase project with synthetic test accounts.
2. Test signup account switching, storage denial and failed local sign-out in a real browser. Verify Supabase auth event ordering and avoid logging out unrelated accounts.
3. Validate server-side age, privacy, content, RLS and storage policies only in isolated nonproduction; do not change shared live schema/data/auth/security without explicit owner approval.
4. Complete Android/iOS Capacitor builds, native email callback, safe-area/keyboard, accessibility, media/messaging QA, store policy review and owner-approved release steps.

No merge, production deployment/promotion/alias change, Kinfolksworld modification, shared Supabase mutation, real-user messaging, payment commitment, or store submission.
