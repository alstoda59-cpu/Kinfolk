# Recovery517: Android Gradle wrapper download timeout (2026-11-08)

Base: Recovery516 commit 76d5eef9ab275b2b4bd25095c822934a7ed877ed. Isolated branch: kinfolk-social/recovery517-gradle-wrapper-timeout-20261108.

## Reproduced CI failure
Recovery516 source checks succeeded (run 42467470718). Both Android build workflows failed before compilation: security workflow run 42467470582, job 128690218460; native workflow run 42467470603, Android job 128690226274. Security job logs show the generated Gradle wrapper timed out downloading gradle-8.11.1-all.zip from services.gradle.org after 10000ms. Synthetic auth/security tests and offline native web asset packaging passed; the native iOS Simulator job passed. This is a CI network/bootstrap failure, not evidence of a source compilation defect.

## Change
In both Android CI workflows, after Capacitor generates the temporary native Android project, append networkTimeout=120000 to android/gradle/wrapper/gradle-wrapper.properties before invoking ./gradlew assembleDebug. No native app source, design, shared backend, production deployment or store settings changed. This applies to generated CI projects only and does not weaken the APK security audit.

## Verification boundaries
The source changes were committed. Recovery517 GitHub Actions and compiled APK audit must be checked after workflows complete. Vercel READY is not evidence of backend functionality. The offline synthetic backend cannot validate signup, email confirmation, messaging, media, RLS or physical device behavior. No connected Supabase project was created.

## Next
Confirm both Android workflows complete and audit the compiled APK. If Gradle distribution download still fails, inspect the new logs rather than changing application code blindly. Real connected tests remain gated on an explicitly selected nonproduction Supabase organization and cost approval.
