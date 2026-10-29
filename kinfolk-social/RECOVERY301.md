# Recovery301 | Notification account isolation and mark-read integrity

Date: 2026-10-28 (America/Los_Angeles). Scope: full MAIN Kinfolk Social in `kinfolk-social/`; Kinfolksworld excluded.

## Inspected baseline
- Recovery300 final commit `dc50a2c47e29f975fe43f7b1915f9e4023c3c424`, Recovery300 report, main `index.html` notifications, native `package.json`, Library Recovery232 notes, recent branch search and nonproduction Vercel deployment history.
- The Recovery300 README commit `f18a773e` has a READY nonproduction preview. No functional device or real-backend E2E proof.
- Read-only inspection of the existing isolated `Kinfolk Social Alpha Test` database confirmed `public.notifications.recipient_id` is a UUID column. No SQL changes were made.

## Actual code fixes
- `861d5cd9b9705a0bc88e14e7ad33f85f98b4069b`: explicitly constrain notification reads to `recipient_id = initiating user`, filter any overbroad response, and prevent older same-session/account-switch responses from overwriting the active user's notification list or loading stale actor profiles. Previously the query was unscoped at the client layer and relied solely on RLS.
- The same commit binds Mark All Read to the initiating session and recipient, updates only that recipient's unread IDs, prevents duplicate pending writes, reports update errors without silently pretending success, and avoids reopening Notifications if the user navigates away while the write is pending.
- `98546b4420d3c0b8830f1b2a40d7059a97c89759`: add nine source-backed Node regression cases.
- `fc1d3caea0eaa1cc742c001fb9d116071fe69b63`: normalize cross-VM arrays in Node assertions.
- `23a4204a03f4e613f472429c7b3cce1ef11e6dcc`: include `alpha:notifications:source:test` in native `alpha:verify`.

## Verification
- Re-fetched committed `index.html` blob `0fc4c91434a4b85fe862fbc9fae51d469c65f18b` and executed nine synthetic V8 behavioral checks against the actual extracted notification handlers: **9/9 passed**. These covered recipient-scoped read, overbroad response filtering, stale-account and same-account read races, recipient-scoped update, stale write, duplicate write, update error, and navigation during update.
- Parsed committed regression file `647f55fc7e296d3f21cbdd1936f422df3f30d361` using V8 after removing Node imports and substituting `import.meta`: parse passed; **the committed Node tests have not been executed by Node or GitHub Actions in this run**.
- GitHub comparison against Recovery300 showed four commits ahead and zero behind, all changes under `kinfolk-social/` before this report.
- Vercel status for integration commit `23a4204a` was **failure due to build-rate limit**. No Recovery301 READY preview confirmed; no paid upgrade authorized.

## Still blocking alpha
- Real isolated-backend synthetic signup/email confirmation, login/logout/session restoration, cross-account notifications/messages/teen RLS, and missing alpha schema tables remain unverified or incomplete.
- Current Android APK/iOS app builds, native email callback, integrated media/uploads/messaging and physical-device QA not established.
- Do not claim launch readiness. No shared live Supabase schema/data/auth/security, production aliases, Kinfolksworld, paid infrastructure or store submission touched.
