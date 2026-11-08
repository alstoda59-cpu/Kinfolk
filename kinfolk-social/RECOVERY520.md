# Recovery520: fix native Gradle regression workflow lookup (2026-11-08)

Base: Recovery519 `eacdc027b219aead82bf331a8644649bb426c2e0`.
Branch: `kinfolk-social/recovery520-gradle-test-root-20261108`.

## Reproduced from source
`kinfolk-social/native/scripts/test_gradle_retry_guard.py` set `ROOT = Path(__file__).resolve().parents[2]`. For this file, `parents[2]` is `kinfolk-social/`, not the repository root. The test then searched for `.github/workflows/...` under `kinfolk-social/`, where neither workflow exists. The test's workflow-presence assertion therefore raised FileNotFoundError on a correctly checked-out repository and blocked the Android security job before Gradle compilation.

## Changes
Set `ROOT` to `parents[3]`, the repository root. Added a regression assertion that both expected workflow fixture paths exist, so future fixture-path drift produces a clear error. Existing transient-error/compilation-failure retry classification tests remain intact. This is a CI test harness correction, not an application feature or a functional alpha proof.

## Evidence and boundaries
The two GitHub workflow files were fetched from Recovery519 and their locations verified. The original test file was fetched and inspected. Changes were committed on this isolated branch. Full GitHub Actions results, Android APK compilation and compiled APK audit for Recovery520 are not yet verified. Vercel READY for Recovery519 was observed on deployment `dpl_HuLbnDFyiqwJMQQM5Vxe2zgcSZp3`, commit `eacdc027`; Recovery520 preview readiness is not claimed. Real backend signup/email confirmation, two-account RLS, private media and physical-device QA remain unverified. The Library prelaunch audit flags public media and teen/privacy access controls. No shared Supabase schema/data/auth/security, production alias/deployment, Kinfolksworld or app-store submission was modified. No paid resources were created.

## Next
Check Recovery520 CI job logs for the repaired fixture lookup, Android Gradle compilation and APK audit; inspect artifact checksum before UI-only installation tests. Continue connected authentication/RLS only after separate nonproduction Supabase organization and nonzero cost are approved.
