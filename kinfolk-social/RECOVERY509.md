# Recovery509: hosted Android SDK CI repair (2026-11-07)

Base: Recovery508 commit ad886434cd47c4857889e1a791710fce394fa3fc.
Branch: kinfolk-social/recovery509-hosted-android-sdk-20261107.

## Newly verified CI evidence
- Recovery508 native workflow run 42355477278 **passed**, including Android debug APK compilation/audit/artifact upload and unsigned iOS Simulator compilation/artifact upload. The Android and iOS packages are explicitly OFFLINE, not functional backend-connected alpha builds. Neither proves physical device installation.
- Recovery508 security workflow run 42355477259: synthetic auth and preview isolation passed; offline native web assets passed; separate offline Android debug job failed at android-actions/setup-android@v3 before Gradle or APK auditing.
- The successful native workflow already documents that the hosted Ubuntu SDK should be used instead of setup-android@v3, which attempts to install a removed legacy SDK tools package.

## Code change
Replaced the failing setup-android action in .github/workflows/kinfolk-alpha-security-regressions.yml with the same hosted SDK manager installation pattern already used by the successful native workflow. Targets Android platform 35, build-tools 35.0.0 and platform-tools. No runtime app code or backend configuration changed.

## Verification boundaries
Workflow change committed as 30da6ed34d1574141f4c008ca5bf449417c09e51. A passing Recovery509 workflow has not yet been established. The separate native workflow already produces a verified compiled offline debug APK and unsigned Simulator artifact for Recovery508, not an authenticated connected app. Isolated Supabase org/cost confirmation, connected Auth/RLS tests, physical-device Android/iPhone QA and iPhone-installable signed IPA remain outstanding.

No production deployments/aliases, live Supabase resources, Kinfolksworld, paid infrastructure or store submissions changed.
