# Recovery270 | Native module parity parser repair

Date: 2026-10-27. Scope: full main Kinfolk Social `kinfolk-social/` only. No Kinfolksworld changes.

## Baseline inspected
Recovery269 and its new module-parity validator/tests, Recovery267 robust startup parser, native package verifier and configuration, main index.html, recent GitHub branches/commit comparison, Recovery226/232 Library notes, and Vercel nonproduction deployments.

## Defect and changes
Recovery269's new `native-module-parity.mjs` accidentally committed a double-escaped regular expression (`\\s` inside a JavaScript regex literal). It matched **zero** normal `<script src>` tags and therefore failed its own minimum 20-module assertion, blocking native package verification.

- `06279bdcd78fd78f6348c2dac5b0429af04f2418`: replace fragile regex with the existing robust `nativeStartupScripts` parser, retaining ordered source-to-package module parity and duplicate detection.
- `5066488697126716d91b765a1acef799a21efe48`: add three regression tests for non-leading `src`, missing modules with `async`, and deceptive `data-src` (eight tests total).
- `edc05d3f568a49925b9e88733b1a491732953362`: align package verifier module enumeration with the same robust parser.

## Verification evidence
- **8/8 actual Node.js tests passed** in a local isolated fixture. Re-fetched exact GitHub helper and test files, and compared their FNV-1a fingerprints and lengths to the tested local files: helper 1,037 chars / `32622600`; tests 1,897 chars / `5963ce0a`. The dependency `native-startup-scripts.mjs` also matched its GitHub source: 1,688 chars / `cafeab3d`.
- Exact branch main `index.html` contains 23 local Kinfolk script references. This is static inventory evidence, not a complete native build.
- Vercel preview **READY** for test commit `50664886` (nonproduction, target null): https://kinfolk-social-demo-qbijebi4y-alstoda59-9779.vercel.app/ . Latest verifier commit `edc05d3f` has Vercel combined status **failure due to build-rate limit**, not an application compile/test failure. Do not claim latest commit READY.
- Full `npm run alpha:verify`, GitHub Actions CI, isolated Supabase synthetic-account E2E, RLS, Android APK/iOS app, and physical-device tests were **not executed or verified**.

## Restrictions and next
No production alias, shared live Supabase schema/data/auth/security, Kinfolksworld, paid infrastructure or app-store changes. Next priorities: execute the full native alpha verification/build jobs, then real synthetic-account auth/session and cross-account RLS tests against the owner-approved isolated backend, followed by physical Android/iPhone QA. No launch-ready claim.
