# Recovery499 | Native package integrity and provenance

Date: 2026-11-06. Continued main Kinfolk Social from Recovery498 on an isolated branch.

## Code change
Extended existing `.github/workflows/kinfolk-alpha-native.yml` without creating another build job. After Gradle APK compilation and the existing whole-APK backend isolation audit, CI now verifies ZIP integrity, writes the APK SHA-256 checksum, records exact GitHub commit/ref and the synthetic offline backend limitation, and uploads short-lived evidence. The iOS Simulator archive also receives a ZIP integrity check, SHA-256 checksum and short-lived evidence. GitHub job summaries expose checksums and warn that neither archive proves connected functionality or physical-device installation.

## Evidence boundary
Commit acceptance proves only that source was written. No Actions run, Gradle APK compilation, iOS Xcode build, APK download, Vercel READY preview, real Auth/RLS test, or physical-device QA has been observed in this recovery. The evidence artifacts are produced only if their respective jobs reach and pass the added steps. The existing GitHub workflow-run lookup is PR-only and cannot rule out push runs.

## Next work
Inspect push-triggered Actions jobs and actual artifact contents, resolve any failures, then install on Android and test an iOS Simulator build. Separately confirm organization and any nonzero cost before creating the authorized isolated Supabase test backend. No live Supabase, production aliases, Kinfolksworld or stores were touched.
