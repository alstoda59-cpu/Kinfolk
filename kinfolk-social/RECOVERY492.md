# Recovery492 | Compiled Android web-asset isolation

Date: 2026-11-06. Based on Recovery491 branch and exact checkpoint 7f68545bb820da558f9ddef9997b31354fd40c14. Main Kinfolk Social only.

## Code
- Expanded native/scripts/audit-compiled-apk.py to scan **every** assets/public/ file in the compiled APK, not just JavaScript and HTML. A shared live Supabase reference in config JSON, maps, manifests, CSS or other bundled assets now fails the offline build gate.
- Reads packaged assets in 1 MiB chunks, preserving overlap to catch a reference crossing chunk boundaries.
- Added native/scripts/test_audit_compiled_apk.py with synthetic ZIP fixtures: valid offline package, JSON reference leak, cross-chunk reference leak, and missing module.
- Existing CI invokes the APK audit after Gradle assembleDebug. No additional workflow job was created.

## Evidence limits
GitHub accepted code and regression commits. Tests are committed but not independently executed in this run. GitHub's workflow-run lookup exposes only pull-request-triggered runs and returned none, so push CI, Gradle compilation, APK artifact and installability are **unverified**. Vercel READY does not establish APK success. The audit is an offline artifact inspection, not real signup, email verification, RLS, messaging, or physical-device QA.

## Next
Verify CI and APK artifact, run synthetic tests and Android installation, then complete isolated Supabase backend setup after owner confirms organization and any nonzero cost. No shared live Supabase, production alias, Kinfolksworld, or store changes.
