# Recovery498 | Native CI branch coverage

Date: 2026-11-06. Main Kinfolk Social only; continued from Recovery497.

## Implemented
The existing .github/workflows/kinfolk-alpha-native.yml now includes the quoted push branch glob 'kinfolk-social/recovery*'. Previously each recovery branch needed a manually added trigger; without that, new isolated branches could receive READY Vercel previews while never running the Android/iOS native workflow. The existing source-path filter remains restricted to kinfolk-social/** and the native workflow file. Removed a duplicated workflow path entry. No production workflow, app source, Supabase, Kinfolksworld or store release was changed.

## Verified and unverified
Recovery497 final-head Vercel deployment dpl_AX5PmUeR5iUFp453GJs7q63tC982 was READY; its Vercel commit status succeeded. The commit-associated workflow lookup returned zero PR-triggered runs, which does not establish that no push-triggered workflow exists. The new branch's native build status and artifact availability require a subsequent Actions inspection. No successful Gradle build, iOS simulator compile, APK download, connected backend test or physical-device test is claimed.

## Next execution gate
Inspect the actual Actions jobs/logs for this branch, fix compilation or source-test failures, obtain APK and iOS simulator artifacts. Connected synthetic-account Auth/email/RLS/media tests require a separately approved nonproduction Supabase organization and cost approval if nonzero. Preserve the full dark mobile app and all existing features.
