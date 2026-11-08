# Recovery523: repair Android Gradle retry shell syntax (2026-11-08)

Base: Recovery522 `073e950a79644bc571c14c878369be3b4bdb2e8e`.
Branch: `kinfolk-social/recovery523-gradle-shell-quote-20261108`.

## Reproduced source defect
Both Android workflows had an unterminated single-quoted `grep -Eq` pattern in the Gradle retry conditional. The path `/tmp/kinfolk-gradle-build.log` was swallowed into the regex and the shell block could fail to parse before the Gradle retry classifier could execute. This was introduced with Recovery522's additional task-exception guard.

## Change
Closed the shell regex quote before the log path in both `.github/workflows/kinfolk-alpha-security-regressions.yml` and `.github/workflows/kinfolk-alpha-native.yml`. Extended the terminal task-exception matcher to cover Gradle's common `> Execution failed for task` output, in addition to the unprefixed form. Updated `kinfolk-social/native/scripts/test_gradle_retry_guard.py` to assert the complete correctly quoted command in both workflow fixtures and to reject a mixed HTTP 504 plus prefixed task exception.

## Verification boundary
Source changes and regression fixture are committed. Actual GitHub Actions execution, Android APK compilation and compiled-APK auditing have not yet been verified. Vercel preview READY is unrelated to functional backend or device QA. Offline synthetic CI uses an unreachable backend, so it cannot prove signup, RLS, media or messaging. No production resources, shared Supabase, Kinfolksworld, paid infrastructure or store submissions were changed.
