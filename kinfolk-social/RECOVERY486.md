# Recovery486 | Complete offline native package verification in CI

Date: 2026-11-05. Continued from Recovery485 final head `68a65a2513cfc27d7ca125c857ef0479a8974f1e`, main Kinfolk Social only.

## Implemented
- Added an independent `native-package-offline` job to the existing recovery-branch GitHub Actions workflow. This job installs the locked Capacitor/Supabase/esbuild dependencies with `npm ci --ignore-scripts`, packages the complete main app into native web assets with `npm run prepare:web`, and runs `npm run alpha:verify`.
- `alpha:verify` checks packaged local SDK/startup scripts and preserves broad source regression coverage for signup, session handling, profiles/music, Reels, messaging, notifications, media, communities, channels, safety and preview isolation.
- Uses only explicit offline CI Supabase markers and `KINFOLK_ALPHA_PACKAGING_ONLY=1`; no real Supabase URL/key, synthetic account provisioning, database writes or paid resources.
- The prior targeted security workflow remains unchanged. No UI redesign or production/Kinfolksworld edits.

## Evidence boundaries
- CI workflow commit `db86e51e265f97d4026f8ce3598902460515af12` accepted by GitHub.
- This is a package and test runner, NOT an APK/IPA build, functional Supabase Auth/RLS pass or physical-device QA.
- Confirm actual GitHub Actions job conclusion/logs before claiming tests passed; a Vercel READY preview is not proof of native package success.
- The isolated Supabase organization choice and any nonzero cost still need owner confirmation.

## Next
Inspect exact-head GitHub Actions runs and fix failures. Then run approved isolated backend synthetic email-confirmed signup, session restore, read-only two-account RLS, private media and messaging checks; compile and install current Android/iPhone builds on devices. Do not release production or stores without owner approval.
