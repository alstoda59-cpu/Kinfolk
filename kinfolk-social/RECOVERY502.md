# Recovery502: unconfirmed session regression alignment (2026-11-06)

Base: Recovery501 at 3828d98fbc8b2dfa8a9b57be750330682fe00125. Scope: main Kinfolk Social only. Branch: kinfolk-social/recovery502-unconfirmed-session-fixtures-20261106.

## Verified CI failures
Recovery501 final-head runs: source checks 42296234282 FAILED; auth/preview isolation 42296234254 FAILED; native Android/iOS 42296234313 FAILED. Native Android job 128162118243 failed during prepare/alpha verification with unconfirmed-session fixture tests 74-76 failing; no Gradle compilation or APK. Auth isolation job 128162080070 failed on recovery456 assertion for a newer same-member token. iOS native prepare also failed. These are synthetic tests, not backend or physical-device evidence.

## Changes
1. Account-switch synthetic unconfirmed-session tests now supply access tokens, so they reach the real kf338RejectUnconfirmedSession same-session cleanup path rather than being treated as an unverifiable stale callback. Stale rejected event retains its own distinct token.
2. Recovery456 synthetic cleanup expectations now explicitly preserve the newer account/session UI when an old unconfirmed event arrives. Same rejected active session and no-active-session still clear private UI. This matches the existing token-identity guard and avoids weakening runtime fail-closed behavior.

## Evidence and blockers
Both test changes committed; no local Node execution or new CI pass claimed. Inspect Recovery502 push workflows and remaining failures before further changes. No verified Android APK, iOS Simulator package, connected isolated Supabase Auth/RLS, or physical-device QA. No live Supabase, production deployment/alias, Kinfolksworld, store submission, or paid infrastructure modified. Nonproduction Supabase organization/cost selection still requires approval.
