# Recovery519: Guard Gradle retry against build failures (2026-11-08)

Base: Recovery518 commit 8364c64059eec03ca7a009dd913811ebb46154f4.
Branch: kinfolk-social/recovery519-gradle-retry-failure-guard-20261108.

## Inspected
Recovery518 continuation report and both Android workflow implementations, recent Recovery branches, Vercel READY deployment dpl_4mTvN38Kd58NvvbpL33bEprfibAG, and Library prelaunch privacy/security audit. Recovery518 Android CI result remains unverified.

## Reproducible logic gap and change
Recovery518 retried whenever the combined Gradle output contained a transient HTTP/timeout signature. If a transient message was followed by an actual Gradle task/compilation failure, the combined log could still trigger a retry and mask the original failure classification. Both workflows now refuse retries when Gradle emits a terminal build failure marker (FAILURE: Build failed, > Task ... FAILED, Compilation failed), even if the log also contains a transient transport message. They retain the existing three-attempt cap and original nonzero exit code. This is a CI behavior hardening, not an application feature.

Added scripts/test_gradle_retry_guard.py with synthetic transport, mixed transport/compilation, nontransport, final-attempt, and both-workflow presence checks; wired it into the Recovery-branch security workflow before compilation.

## Verification limits
Changes committed, but full GitHub Actions results and Android APK artifact have not been verified in this run. No real backend tests, physical-device QA, production changes, shared Supabase changes, paid resources, or store submissions. Vercel READY applies only to Recovery518; no Recovery519 preview readiness claimed. Existing CI-only backend credentials remain nonfunctional.

## Next
Inspect Recovery519 security workflow tests and Recovery518/519 Android jobs/artifacts. Then pursue connected Auth and two-account RLS only in an owner-approved isolated Supabase organization with approved costs. Private media, teen safety, signup/email confirmation, and physical Android/iOS device tests remain release blockers.
