# Recovery503: stale unconfirmed authentication event regression (2026-11-06)

Base: Recovery502 final commit 2f18a0b44050b7421400aebfcc7dbcd57ebfd728. Main Kinfolk Social only; isolated branch kinfolk-social/recovery503-stale-auth-regression-20261106.

## Verified failure
Recovery502 final-head native Actions run 42304549625 failed in Android and iOS bundle validation. Android job 128190492230 completed 298/299 authentication tests, failing test 75 in tests/recovery316-auth-account-switch-state-isolation.test.mjs line 151. Source checks run 42304549440 failed with 1264/1273 tests passing and nine failures, including the same auth regression plus other unrelated source/preview fixture errors. No APK or simulator archive verified.

## Change
The stale unconfirmed callback test expected the active user state to be null despite the token-identity guard intentionally preserving the existing member UI. Updated the assertion to preserve the existing member A and its feed and signed media cache while ensuring the verified B session is not signed out. This tests that a stale callback cannot clear another session or implicitly adopt B. No authentication runtime or security policy was relaxed.

Commit: c02fc2c35360d38ac6009828f2b6f7bf693008cc.

## Remaining
New CI is not yet claimed passing. Inspect Recovery503 workflow results and address the remaining source-suite failures with reproducible fixes. Native Gradle compilation, Android APK, iOS Simulator build, isolated Supabase Auth/RLS and physical-device QA remain unverified. No live Supabase, production alias, Kinfolksworld, store or paid infrastructure modified.
