# Recovery489 | Reproducible offline native asset evidence

Date: 2026-11-06. Continued from Recovery488 exact-head `28def3b3db83257214904f12ab7155ab683cc9ab`. Full main Kinfolk Social only.

## Implementation
Extended the existing native-package-offline GitHub Actions job, after `npm run alpha:verify`, to:
- Assert the CI packaging-only marker and bundled entry/SDK are present.
- Reject any known shared-live Supabase project reference in generated JavaScript or HTML.
- Record SHA-256 hashes for all generated `native/www` assets.
- Upload generated offline web assets and hash manifest as a short-lived artifact explicitly named `kinfolk-native-web-assets-OFFLINE-NOT-FUNCTIONAL` with a warning text file.

This is a reproducible asset bundle for native build review, **not** an APK, IPA, working backend, or a launch candidate. The original application, features and dark design are unchanged. No new paid resources or production actions.

## Evidence boundaries
Source workflow commit `d5f0c4d8b59c9e2e7c1d520f524fd5afb3cb5d78` accepted. CI execution and artifact availability must be checked independently; source commit alone is not a passing run. Recovery488 final-head Vercel preview was READY before changes. The isolated Supabase project organization/cost, real synthetic account Auth/RLS, and physical device tests remain unverified.

## Next
Inspect the native-package-offline Actions job output and artifact manifest, then prioritize functional isolated backend and fresh Android/iOS installable builds with real-device tests after required approvals. No production changes, shared live Supabase edits, or Kinfolksworld work.
