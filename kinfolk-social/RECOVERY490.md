# Recovery490 | Compile isolated Android debug APK in CI

Date: 2026-11-06. Continued main Kinfolk Social from Recovery489 (`b7c4758f3f1497ecd5c75acd1b02d3945ffd3357`). No Kinfolksworld or production changes.

## Implemented
Added an `android-debug-offline` job to the existing Recovery-branch GitHub Actions workflow. It installs pinned native dependencies, packages and verifies the complete Kinfolk web app, generates a temporary Capacitor Android project, syncs assets, and runs Gradle `assembleDebug` with Java 21 and the Android SDK. The debug APK is uploaded with SHA-256 evidence and an explicit `OFFLINE-NOT-FUNCTIONAL` label. Artifacts expire after three days.

The backend is an unreachable synthetic CI placeholder with `KINFOLK_ALPHA_PACKAGING_ONLY=1`; therefore signup, login, email verification, media, messaging and RLS cannot function in this APK. This job verifies compilation only if its actual Actions run succeeds. It does not produce a release-signed APK, AAB, iOS IPA or an app-store candidate. The checked-in app ID remains unconfirmed. No backend resources, paid projects or production aliases were changed.

## Evidence and blockers
- Workflow commit: `2c0195f1330110fb6763aa564ce55f0cbbd27dc6`.
- Recovery489 final-head Vercel preview `dpl_BgeCr25jaFEK2Nvi331WafVGNaa4` was READY when inspected.
- The CI job and APK artifact must be verified by inspecting actual GitHub Actions output. Workflow YAML and Vercel READY are not evidence of a successful native build.
- Real synthetic-account Auth, email delivery, RLS, private media, and physical Android/iPhone QA remain unverified. Separate Supabase organization selection and any nonzero cost still require owner approval.

## Next
Inspect the new Android CI job logs, fix any Gradle/Capacitor errors, retrieve the APK artifact for authorized offline navigation testing, and continue isolated functional backend preparation without changing shared live Supabase. iOS device signing and testing remain separate gates.
