# Recovery524: parse Android Gradle retry loops with bash (2026-11-08)

Base: Recovery523 `98bf932ec3a0abeaeed33787eba826dbd3c0485d`.
Branch: `kinfolk-social/recovery524-gradle-shell-parser-test-20261108`.

## Change
Expanded `native/scripts/test_gradle_retry_guard.py` to extract the actual retry loop from both Android workflow files and pass each extracted script through `bash -n`. This guards against malformed shell quotes and syntax regressions that a substring assertion alone cannot detect. The test does not execute Gradle or contact a backend.

## Verification limits
Changes committed; GitHub Actions execution and Android APK compilation have not been verified in this continuation. A passing parser test would establish only shell syntax, not Gradle success or a functional installable alpha. No shared Supabase, production resources, Kinfolksworld, paid infrastructure, or store submissions changed.
