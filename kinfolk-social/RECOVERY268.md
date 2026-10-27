# Recovery268 | Native module inventory parity

Baseline: Recovery267 `kinfolk-social/recovery267-native-script-attribute-guard-20261027`. Reviewed Recovery267 report, native verifier, packaging script, backend pin, functional alpha gate and main HTML script references.

## Implemented
- `d67797d3033d0f46a76b0a1a9c06f67309078812`: native package verifier compares the full ordered set of main-app Kinfolk modules against the packaged HTML, excluding the separately bundled Supabase SDK. It also rejects duplicate module entries. Previous checks used only a minimum count and the Reels module, which could miss another removed module.

## Verification and limits
Committed source only; no executed Node test, full native package, GitHub Actions CI, Vercel READY for this branch, backend account E2E, APK/IPA, or physical-device QA is established by this checkpoint. Source and package comparison executes when `npm run alpha:verify` is run with valid isolated-backend configuration.

The change does not modify app design, feature modules, shared live Supabase, production deployments, Kinfolksworld, paid resources or stores. Remaining critical blockers: real synthetic-account email verification/session restoration, cross-user RLS, functional mobile flows and native builds/device QA.
