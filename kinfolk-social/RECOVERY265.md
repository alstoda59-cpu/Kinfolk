# Recovery265 | Native startup script integrity

Base: Recovery264 `kinfolk-social/recovery264-consolidated-mobile-auth-20261027`.

## Inspected
Recovery264 report, newest recovery26 branch names, native `prepare-web.mjs`, `verify-alpha-package.mjs`, `package.json`, and the main `index.html` script tags. Existing packaging checks only enumerate `/kinfolk-*.js` files, so an added remote or differently named startup script could escape the package verifier.

## Change
- `d437d0213e66610610584ec722e5d184147f34ae`: `native/scripts/verify-alpha-package.mjs` now inspects **every** `<script src>` in the packaged HTML. Rejects remote/protocol-relative URLs, query/fragment/traversal paths, and missing/non-file local scripts. Keeps existing isolated Supabase and complete-module checks.

## Evidence and blockers
Source change committed; Node execution, GitHub Actions CI, new Vercel READY deployment, native APK/IPA, and physical-device testing **not verified** in this run. This gate is static packaging verification, not proof of feature function. Real synthetic-account email confirmation, login/session restoration, RLS, media and messaging E2E remain blockers.

No shared live Supabase, production alias, Kinfolksworld, paid infrastructure or app-store modification.
