# Recovery527: profile save retry safety (2026-11-09)

Base: Recovery526 d058bb91d7f3d645b4e5d95554efc30c9281bf1a.
Branch: kinfolk-social/recovery527-profile-save-retry-20261109.

Fixed the existing kinfolk-phase103.js Save Profile handler: a synchronous exception previously left the module-level running lock set forever, preventing subsequent profile saves. Rejected promises previously produced unhandled rejections. The handler now releases the lock after both synchronous and asynchronous failures, logs errors, and retains duplicate-submission protection while a save is pending.

Added recovery527-profile-save.test.cjs using Node's VM to execute the actual application script with a synthetic DOM. Independently ran three scenarios locally: synchronous exception followed by retry, rejected promise followed by retry, and pending save duplicate suppression followed by successful retry. All three passed. Also ran node --check on the edited application script successfully.

These are local source tests, not GitHub Actions results or backend E2E evidence. No live Supabase changes, production deployment, Kinfolksworld edits, store submissions or costs. Recovery526 Vercel preview was READY before this branch; Recovery527 deployment readiness is not verified. Functional mobile alpha still blocked on connected isolated backend, complete RLS/media/messaging verification, and physical-device tests. Do not release publicly based on these tests.
