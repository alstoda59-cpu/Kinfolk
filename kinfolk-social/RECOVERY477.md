# Recovery477 | Fail closed on remote native entry points

Date: 2026-11-05. Based on Recovery476 final commit a39e449fe59b523f9a1988be75ce3a2f10678976. Isolated branch: `kinfolk-social/recovery477-native-local-origin-guard-20261105`.

## Implementation
- Added `native/scripts/verify-local-capacitor-config.mjs` to reject remote `server.url`, cleartext overrides, non-HTTPS Android schemes, invalid app IDs and a webDir other than `www`.
- Wired the guard into `native/scripts/verify-alpha-package.mjs`, so `npm run alpha:verify` fails before a packaged build can be mistaken for the local full-app alpha.
- Added synthetic negative tests and included them in the existing `alpha:verify` test suite.
- No shared live backend, deployment, Kinfolksworld, production or store operations were made. Dark UI and features remain unchanged.

## Evidence and limitations
GitHub accepted commits 900e41e795e6656e1db3c7f002835daa62a66e03, 63889b4dc0bc119883487e88d5d72fc9c825cdce, d882576c622eb91400d536046d32dd8d2d1e6f58 and 3564b15e835472458b71353d6f035b948e95d5fd. Tests were committed but their execution is not independently verified. No real Supabase, signed Android/iPhone packages or physical-device testing occurred. Vercel READY for this branch is not yet verified.

## Alpha blockers
Select and approve a separately isolated Supabase organization/project and any nonzero cost; use synthetic accounts to verify email confirmation, session restoration, RLS, private media, posts, uploads and messaging. Obtain device QA, verified deep links and signed installable artifacts before any launch claim. Existing October 26 Android debug APK and iOS simulator compilation evidence predates these changes and is not current physical-device proof.
