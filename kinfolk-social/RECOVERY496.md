# Recovery496 | Android APK archive entry hardening

Date: 2026-11-06. Main Kinfolk Social only; based on Recovery495.

## Code changes
- The compiled APK auditor rejects Windows drive-prefixed archive entries (e.g. `C:/private/config.json`) and UNIX symlink entries, in addition to existing duplicate, traversal, backslash, absolute path and shared-live backend checks.
- Added two synthetic regression cases for those archive structures in the existing native unittest suite. No new CI workflow was created.

## Verified evidence
- GitHub accepted the source and regression-test commits on this isolated branch.
- Recovery495 final-head Vercel preview was READY at inspection: https://kinfolk-social-demo-8sv82xzqu-alstoda59-9779.vercel.app
- GitHub commit workflow-run lookup for Recovery495 returned no qualifying pull-request workflow runs. This is not evidence of CI success or failure.
- Tests added here were not executed in this run. No Gradle APK artifact or physical-device test was verified.

## Remaining gates
Verify Android CI and downloadable APK; real signup/email confirmation, login/logout/session restoration, two-account RLS, private media, posts, messaging and notifications on an approved isolated Supabase project; iOS compilation and physical-device QA. Organization choice and any nonzero project cost still require owner approval. No live shared Supabase, production aliases, Kinfolksworld, or store submissions changed.
