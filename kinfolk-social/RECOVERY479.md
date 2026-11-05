# Recovery479 | Native Capacitor configuration object integrity

Date: 2026-11-05. Based on Recovery478 (29fcc6c7e39bca3429a0fc6d498590c796c239ec), main Kinfolk Social only.

## Implemented
- Verify Capacitor config and server settings are plain objects, rejecting inherited properties and accessor descriptors, including nonenumerable accessors. This closes a bypass of Object.keys-based allowlisting and avoids invoking getters while validating the server object.
- Add synthetic regression tests for inherited server URL, inherited top-level config, hidden getter URL, and top-level server getter; assert getters are never invoked.
- Preserve dark UI, existing features, and current native package verification suite.

## Evidence
- GitHub accepted code and regression commits on isolated branch recovery479-native-config-plain-object-20261105.
- Local Git clone/test execution unavailable: github.com DNS resolution failed. CI, Vercel READY, real backend, APK/IPA compilation and physical-device QA are not independently confirmed.

## Next alpha gates
- Run native alpha verifier and tests in CI, inspect failure logs.
- Separate Supabase organization and any nonzero cost require owner approval; do not alter shared live backend.
- Verify synthetic email-confirmed signup, login/session restoration, two-account RLS, private media, uploads, messaging and notifications.
- Build and install Android/iOS packages, then test on physical devices. No production or store release without approval.
