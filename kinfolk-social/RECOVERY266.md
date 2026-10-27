# Recovery266 | Repair native startup integrity gate

Date: 2026-10-27. Scope: full main Kinfolk Social only, `kinfolk-social/`; Kinfolksworld excluded.

## Baseline inspected
- Recovery265 branch/report and Recovery264 report; native package verifier, packager, package scripts, signup regression tests and native README.
- Library Recovery226 and Recovery232 notes, including previously successful **older** Android debug APK and iOS Simulator builds, which do not validate current Recovery266 binaries.
- Vercel deployments: latest Recovery264 code/docs were READY, but no Recovery265 branch deployment was returned.
- Root main app `index.html` contains 24 external script tags: 23 local Kinfolk modules and one jsDelivr Supabase SDK script, which native packaging replaces with the bundled local SDK.

## Verified defect and repair
- Recovery265's new `verify-alpha-package.mjs` script scanner used a **double-escaped regex literal** (`\\b` and `\\s`), so it found **zero** real `<script src>` tags and rejected valid native packages at its 20-script assertion. This blocked current alpha verification.
- `e1951aeb09a67ea1f58ba79ff494d9fab05eacb7`: add `native/scripts/native-startup-scripts.mjs` to discover every script source and fail closed on unquoted, remote, protocol-relative, traversal, encoded, query/fragment, or missing JavaScript paths.
- `4b207d107c21624194401a0c190f353cd5a1b2a2`: replace the broken regex scanner in `native/scripts/verify-alpha-package.mjs` with the tested helper; preserve isolated backend, local SDK and full-module checks.
- `a083481754baf7375417f35a200d33fa27d09f12`: add five Node regression cases for real script discovery, remote URLs, missing/unsafe paths, unquoted src and future nested modules.
- `ea79b3baa47528749ad23626476af5da9449d078`: include the new regression suite in `native/package.json`'s `alpha:verify`, and add `alpha:startup:test`.

## Test evidence and limitations
- Re-fetched exact committed helper blob `69af58d30ea17a085f49876f51af0d32a39cda49` and test blob `f26f558fcfab755c5b11c1475d44b0577d29e819`. Verified their exact text against local Node 22 test files by matching 32-bit FNV-1a content fingerprints (`db860aed` and `988ec495`).
- **Node 22 `node --test`: 5/5 tests passed** on those exact matching source files. This is real local Node execution, not GitHub Actions CI or a generated native package run.
- Evaluated the committed helper against the exact main app `index.html` in a separate V8 check: discovered 24 script sources including the expected remote CDN source that native packaging replaces.
- Vercel nonproduction target `null`: **READY** for commit `ea79b3ba`, deployment `dpl_Ads38dP1Vso6dr62Vb8QS5zZqPYB`, URL https://kinfolk-social-demo-ikgyw3eu5-alstoda59-9779.vercel.app/ . READY is not evidence of functional auth or mobile-device behavior.
- Full `npm run alpha:verify` on generated `native/www`, GitHub Actions CI, fresh Android debug APK, fresh iOS Simulator build, physical device tests, real isolated Supabase email delivery/signup/login/session and two-user RLS **not yet verified**.

## Boundaries
No production deployment/alias, shared live Supabase schema/data/auth/security, Kinfolksworld, paid infrastructure or app-store submission changed. No new nonproduction project created. Keep all existing mobile features and dark design.

## Next
Run the full isolated native asset packager/verification with approved alpha publishable credentials; build current-branch Android/iOS test artifacts and conduct real synthetic-account Auth/RLS and device QA before any launch claim.
