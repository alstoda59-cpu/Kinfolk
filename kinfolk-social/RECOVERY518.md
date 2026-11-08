# Recovery518: Retry transient Gradle distribution HTTP 504 (2026-11-08)

Base: Recovery517 commit 63189c8cf00df4be1e09c53009e26d2cb4dbdf4c.
Branch: kinfolk-social/recovery518-gradle-504-retry-20261108.

## Verified failure
Recovery517 Android security workflow 42471274634, job 128702346682, and native workflow 42471274687, Android job 128702373884, both failed before compilation. Their logs show an HTTP 504 response from GitHub's Gradle 8.11.1 distribution redirect despite the Recovery517 120-second timeout. This is an upstream HTTP response, not a client timeout. Recovery517's 24 compiled-APK auditor synthetic unit tests passed in the native job, and its source checks and unsigned iOS Simulator build passed. No compiled APK was produced by either Android job.

## Change
Both Android workflow Gradle steps now retry up to three attempts only when the failed Gradle invocation's output matches transient HTTP 429/500/502/503/504 or timeout signatures. The original nonzero exit code is preserved for all other failures, and the third failure exits nonzero. Delay is 15 seconds after attempt one, 30 after attempt two. No changes to app source, user data, native security checks, production, shared Supabase, or Kinfolksworld.

Commits: 150b435406387f55c6081976d9c62038b5e2e5d1 and e0744f2d75f7adff05f85f2cf5a3bc640c8cff31.

## Verification boundary
Workflow changes are committed; Recovery518 CI must complete before claiming an APK build or compiled archive audit. Vercel READY means preview deployment only. No real Supabase account or RLS tests and no physical-device tests were performed. Synthetic packaging credentials remain nonfunctional.

## Next
Inspect Recovery518 Android jobs and their compiled APK audit/artifacts. If repeated 504 persists, investigate a trusted distribution mirror or cache strategy rather than weakening checks. Connected Auth/RLS requires approved isolated Supabase organization and cost confirmation.
