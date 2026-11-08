# Recovery525: verify workflow retry classifiers against synthetic failures (2026-11-08)

Base: Recovery524 `8c05fa882593fbc1d10c6e9bc3438c2330456df2`.
Branch: `kinfolk-social/recovery525-gradle-workflow-parity-20261108`.

Added `test_workflow_retry_patterns_match_synthetic_classifier` to `native/scripts/test_gradle_retry_guard.py`. The test extracts the actual failure and transport grep expressions from both Android workflow files and checks them against synthetic HTTP 504, generic Gradle header, task failures, compilation failure, and nontransport failure logs. It also checks parity with the Python classifier. This guards against future drift between workflow shell conditions and the existing synthetic test helper.

Verification: source committed; automated test execution, GitHub Actions, compiled APK audit, backend integration and physical-device QA not independently verified in this continuation. No live Supabase, production deployment, Kinfolksworld or paid infrastructure modified.
