# Recovery501: confirmed-session sign-out race and auth regression fixtures (2026-11-06)

Base: Recovery500 at 5676e086b499873b02025939c1b88572accadddf. Scope: main Kinfolk Social only.

## Verified CI evidence
Recovery500 push workflow run 42288270936 failed: Android and iOS both stopped at native package verification. The initial native 77 tests passed 77/77 and the next 15 passed 15/15. The larger auth source suite failed 10 of 299, notably tests 54 and 68-77. Source checks run 42288270943 failed 19 of 1273. Security regression run 42288270965 also failed. These are real CI failures, not APK or device evidence.

## Code changes
The delayed SIGNED_OUT handler now retains a confirmed currently active Supabase session even while its profile is still hydrating, instead of relying on kf129ReadyUid being set. It still clears private UI on no session, unconfirmed session, failed verification, or timeout. Updated the synthetic confirmed-session fixtures in account-switch tests to include access tokens, which the existing kf338ConfirmedSession gate requires. Updated the delayed sign-out test with a verified replacement session and a matching gate stub.

## Evidence boundary and remaining work
Changes are committed but a new successful CI run is not yet established. Other source-check failures remain to be diagnosed from logs. No Gradle APK or iOS Simulator artifact, real isolated backend auth/RLS, or physical device QA is established. No production, shared Supabase, Kinfolksworld, store or paid resource changes.
