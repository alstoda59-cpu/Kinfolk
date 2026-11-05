# Recovery478 | Fail closed on native WebView origin/navigation overrides

Date: 2026-11-05. Continued from Recovery477 on isolated branch `kinfolk-social/recovery478-native-navigation-guard-20261105`.

## Implementation
- Hardened `native/scripts/verify-local-capacitor-config.mjs` to reject unreviewed `server` fields rather than only `url` and `cleartext`. This prevents configuration drift through `hostname`, `allowNavigation`, `iosScheme`, `errorPath`, or other future server overrides while allowing the existing reviewed `androidScheme: "https"`.
- Added negative regression cases to the existing `native/tests/alpha-local-capacitor-config.test.mjs`. The test already runs through `npm run alpha:verify`; no duplicate CI workflow was added.
- Preserved the current local bundled webDir, app ID, dark UI, modules, backend isolation and Kinfolksworld.
- No production, shared Supabase, store, aliases, or paid project changes.

## Evidence and limitations
- Application guard commit: `35a3523359cd3c5be207fe483e495591efe992b6`.
- Regression commit: `e9b61a79886d0ce23fbc18869e66e37cd0ed78c5`.
- GitHub accepted the commits. Local repository test execution was unavailable because the execution container could not resolve github.com; no passing CI, preview READY, real backend, signed native build or physical-device evidence is claimed.

## Remaining alpha gates
Isolated nonproduction Supabase organization and any nonzero cost require owner approval. Then test synthetic confirmed-email signup/login/session restoration and two-user RLS/private storage; verify real uploads, messaging and notifications; build and install Android/iOS packages and run physical-device QA. Preview deployment status alone does not establish functionality.
