# Recovery432 | Restore legacy message lock test coverage

Date: 2026-11-03. FULL MAIN Kinfolk Social only, kinfolk-social/. Isolated from Recovery431 head 0f9eeec46977e1bbc1e401f5527a49d36fb71d37; not merged.

## Verified CI failure
Recovery431 source run https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41590248769 failed in Complete Node regression suite: 1234 passed, 3 failed. The three failures were tests 264-266 in tests/recovery239-message-submit-guard.test.cjs. Recovery431's two new source-executed tests (1236-1237) passed.

## Fix
Commit e0ea9614965c5e8e1cef92c0b2a668840b8101bf updates only the legacy test fixture to supply a connected, enabled Send control and form containment, as required by Recovery431's safeRun guard. Existing request-lock, async rejection, duplicate-send, and detached-form assertions remain. No application code or security guard was weakened.

## Boundaries
A successful new CI run is not yet verified. No connected Supabase Auth, email confirmation, two-account RLS, physical-device QA, or Android/iOS final-head compilation was performed. No production, shared Supabase, Kinfolksworld, paid resources or app-store changes. Next: confirm CI, then prioritize isolated synthetic-account authentication and connected alpha testing. Not launch-ready.
