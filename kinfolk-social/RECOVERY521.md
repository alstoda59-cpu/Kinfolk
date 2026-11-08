# Recovery521: preserve transient Gradle retry after generic failure header (2026-11-08)

Base: Recovery520 `734e96238e336eb8f775136c69c063e408e635a1`.
Branch: `kinfolk-social/recovery521-gradle-transport-retry-20261108`.

## Reproduced source defect
Both Android workflows rejected retries whenever the Gradle log contained `FAILURE: Build failed`. Gradle prints that generic header for distribution download failures, including HTTP 504, so Recovery519's failure guard could prevent the transport retries introduced by Recovery518. This is a source-level reproduction, not an observed Recovery520 CI log.

## Changes
- `4a80271e49ebe921f2fbf6a9a3728eaa436a3944`: remove generic header from the terminal-failure check in the security workflow.
- `511e3e84123b16e6a3f96e3146f2197cd79db5b9`: same correction in the native workflow.
- `66aaeb86412d0d02c86f39236f3c995ad3604702`: synthetic test checks that a 504 with the generic Gradle failure header retries, while explicit failed task or compilation errors do not.
- Retain three-attempt limit, exit-status capture, and transport-signature requirement.

## Verification boundaries
Changes are committed. Full GitHub Actions, Android APK compilation, compiled APK audit, real Supabase Auth/RLS, and physical Android/iPhone testing are not yet verified. Recovery520 nonproduction Vercel preview was independently READY at `734e9623`; Recovery521 preview status not verified at time of this note. Preview READY is not a connected functional test.

Library prelaunch audit flags public media bucket and incomplete privacy/teen RLS checks. No live Supabase resources, production deployment/aliases, Kinfolksworld, paid resources, or app-store submission changed.

## Next
Check Recovery521 GitHub Actions and artifacts. Continue real signup and role-separated RLS only in an approved isolated Supabase project after organization and any nonzero cost confirmation.
