# Kinfolk Social Recovery182 | login session identity guard

Date: 2026-10-25. Scope: FULL MAIN Kinfolk Social only; Kinfolksworld excluded.

## Source and evidence inspected first
- Continued from the existing `kinfolk-social/recovery181-signup-account-switch` branch, not the older Recovery133 archive or a guest demo.
- Read latest GitHub `kinfolk-social/README.md`, `RECOVERY181.md`, `RECOVERY180.md`, `INTEGRATION.md`, `validation.json`, Phase79 signup, Phase95 login, Recovery180/181 regression files and Recovery181 CI workflow.
- Reviewed Library Recovery133, Recovery139, Recovery142 and Recovery137 notes. Older Recovery133 source check passed; later Recovery181 checkpoint reports synthetic tests only.
- Verified Recovery181 Vercel preview `dpl_6xWXjoYwfY7mPSF56EJzSeq2mXwD` READY, target null, source `7635f711157536c309d31c898af76c1aff497af9`. No production promotion.

## Actual change
- Existing Phase95 password login could accept *any* non-null `getSession()` result after `setSession()`, even when it belonged to a different account. It also returned the original `setSession()` session after five unsuccessful verification reads. In those cases it could call `kf129ActivateSession` on a stale account.
- Added a read of the active account before and after the password request, refusing to adopt fetched credentials if the active account changed during the request.
- After `setSession`, require a nonempty user ID and an exact user-ID match from `getSession()`. A different account or an unverified session fails closed rather than activating a stale account.
- Recheck account identity immediately before `kf129ActivateSession`; on mismatch or error, restore the previous Stay Logged In preference and show an error.
- This narrows account-switch races but is not a substitute for real Supabase/browser race testing or an atomic auth transaction.
- No changes to dark UI, signup, age protections, Home, Reels, music, uploads, messages, native scaffold, or Kinfolksworld.

## Commits and tests
- Application fix: `ce4df65788382764e4816a8ea87a4211ce7be005` (`kinfolk-phase95.js`).
- Seven offline regression scenarios: `96aefab8c9c7251f123dc75546b7779660386297` (`tests/recovery182-login-session-identity.test.cjs`).
- DOM fixture correction: `4e5b3a36135ae79c31813cb851f8d454fceda732`.
- CI workflow: `1603e65f13a73a5b41c49237535361ca156adcd3` (`.github/workflows/kinfolk-recovery182-auth.yml`), configured to check Phase79/95 syntax and run Recovery179–182 offline tests on Node 22.
- Exact committed Phase95 and test source were evaluated in a synthetic V8 harness with mocked Node test/assert/fs/vm APIs: **7/7 Recovery182 scenarios PASS**. Cases cover valid login, account switch before token adoption, mismatched account after adoption, switch before activation, missing verified session, missing identity, and setSession error. This is **not** a real Node/GitHub Actions run or live browser/backend test.
- Vercel isolated preview `dpl_HrpVZgiFix1RFJZWVSpAiNU5nycP`, `https://kinfolk-social-demo-ijem2n6p7-alstoda59-9779.vercel.app/`, READY, target null, commit `4e5b3a36135ae79c31813cb851f8d454fceda732`. Authenticated HTTP GET returned 200 for `/` and `/kinfolk-phase95.js`; script contains `currentAccountId`. Newer workflow/documentation commits may be rate-limited; do not infer deployment from READY of older commit.
- CI conclusion and rendered browser behavior **not verified**. No real Supabase auth, physical Android/iPhone, signed AAB/IPA or store validation.

## Remaining launch blockers
1. Owner-approved isolated nonproduction Supabase project and authorized synthetic accounts for real signup, login, logout, session restoration, email confirmation and cross-account races.
2. Role-separated backend RLS and teen/content/privacy/media/messaging authorization tests. No writes to shared live Supabase.
3. Rendered browser Home/Reels/settings/media tests; Capacitor Android/iOS debug builds, deep links, keyboard/safe-area/accessibility/performance and physical-device QA.
4. App-store UGC/adult content policy, reporting, account deletion and privacy review. Owner approval required before release.

No production deployment/promotion/alias changes, Kinfolksworld modification, shared Supabase mutation, real-user messaging, secrets committed, payment commitment, or store submission.
