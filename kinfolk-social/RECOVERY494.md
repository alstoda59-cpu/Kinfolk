# Recovery494 | Execute compiled APK regressions in Android CI

Date: 2026-11-06. Main Kinfolk Social only; based on Recovery493.

## Actual change
Added a pre-Gradle step to the existing `.github/workflows/kinfolk-alpha-security-regressions.yml` Android debug job. It executes `python3 -m unittest discover -s scripts -p 'test_audit_compiled_apk.py' -v` from `kinfolk-social/native`. This exercises the already-committed synthetic valid package, live-reference-in-JSON, streaming boundary, missing-module, duplicate ZIP entry and traversal regression cases on every Recovery branch push. No duplicate CI job or production workflow was created.

## Verification boundaries
GitHub accepted the workflow commit 2d16bcf065a22c20ffb9ab4f17857a4642e3fbdf. This confirms repository source changes only, not successful CI execution. The test suite, Gradle build, APK output, actual Android installation, iPhone build, Supabase signup/email/RLS and physical device tests have not been independently verified in this continuation. An offline synthetic APK cannot establish a functional alpha.

## Next
Inspect GitHub Actions job results for this branch and fix failures. Obtain a real debug APK artifact and test on an Android device. Do not use shared-live Supabase; connected synthetic-account testing requires an isolated project with organization/cost approval. Preserve Kinfolksworld, production aliases and shared live data.
