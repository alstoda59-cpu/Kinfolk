# Recovery269 | Testable native module inventory

Baseline Recovery268. Extracted source-to-native module parity into `native/scripts/native-module-parity.mjs` and wired it into `verify-alpha-package.mjs`. Added five Node regression tests for valid ordered modules, missing modules, reordered modules and duplicates on both sides. `native/package.json` includes the tests in `alpha:verify`.

Commits: `bf2a883f`, `109ef1d8`, `1abef598`, `3ed60813`.

The tests are committed but were **not executed** in this turn; no Node pass, CI pass, Vercel READY, native APK/iOS build, real backend E2E or physical QA is claimed. No shared live backend, production, Kinfolksworld or store changes.
