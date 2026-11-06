# Recovery495 | Scan entire compiled APK for shared-live backend references

Date: 2026-11-06. Main Kinfolk Social only. Based on Recovery494.

## Code change
The compiled APK auditor previously inspected only `assets/public/` entries for the shared-live Supabase project reference. It now scans every ZIP entry, including native manifest, resource and metadata entries, in streaming chunks. Existing archive path/duplicate validation, required module checks, and offline synthetic backend checks remain intact. Two new synthetic regressions assert rejection when the reference occurs in `AndroidManifest.xml` or `META-INF/kinfolk-config`. Existing Recovery-branch Android CI invokes this unittest suite before Gradle compilation.

## Evidence and boundaries
GitHub accepted source and test commits. These changes are not proof that the new tests passed in GitHub Actions, that Gradle compiled an APK, or that an APK was installed. Vercel READY proves deployment build status only. No real Supabase signup/email/RLS, private media, Android physical-device or iPhone QA occurred in this change. Do not distribute an offline synthetic-backend APK as functional.

## Next
Verify actual GitHub Actions execution and artifacts; resolve any failures. Then pursue connected tests against an approved separate Supabase project and physical-device QA. No live shared Supabase, production aliases, Kinfolksworld, or paid resources changed.
