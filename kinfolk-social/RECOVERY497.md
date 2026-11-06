# Recovery497 | Android CI audit gate wired

Date: 2026-11-06. Main Kinfolk Social only; continuation of Recovery496.

## Actual code change
The existing `.github/workflows/kinfolk-alpha-native.yml` now triggers on this isolated Recovery497 branch (with Kinfolk source or workflow path changes). Before Gradle, the Android job runs `python3 -m unittest discover -s scripts -p 'test_audit_compiled_apk.py' -v`. After `assembleDebug`, it runs `python3 scripts/audit-compiled-apk.py android/app/build/outputs/apk/debug/app-debug.apk`. Artifact publication is conditional on both commands passing. This fixes a missing execution gate: the auditor and tests existed in Recovery496, but the actual native workflow did not call them.

## Evidence limits
GitHub accepted the workflow edit. No successful Actions run, Gradle compilation, APK artifact, iOS build, real backend auth/RLS or physical device test is claimed here. The audit checks only offline packaging, not functional connectivity. The branch is nonproduction; no production alias, shared live Supabase, Kinfolksworld or store release was changed.

## Remaining blockers
Confirm Actions job execution and downloadable debug APK. Then synthetic two-account signup/email verification/session and RLS testing requires an isolated Supabase project; organization and any nonzero cost need owner approval. iOS simulator compilation is distinct from a physical iPhone IPA and device QA.
