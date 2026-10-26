# Recovery233 | Native alpha backend isolation (2026-10-26)

Scope: **full main Kinfolk Social only**. Branch `kinfolk-social/recovery233-native-backend-isolation`, based on Recovery232. No Kinfolksworld, production deployment, production alias, or shared live Supabase schema/data/auth changes.

## Verified starting checkpoint
- Recovery232 latest code/test/fixture commit `d338b49521f114a007e10070c9a466fa0836ac0c`; isolated READY preview `dpl_H6ksS6mxp2iqN8ZnZTsTzWRGn1jg`.
- GitHub Actions Recovery232 source-check run `40315229810` completed **successfully** (Node, mocked Chromium/WebKit browser regressions, JavaScript syntax, native web asset prep).
- Library Recovery232 continuation notes and earlier Recovery133 source/notes reviewed; Recovery133 is superseded by the later branches.
- Native README documents older successful Android debug APK and unsigned iOS Simulator build from commit `624c0945de75cede1beb66b15465d36f52019000`. They predate Recovery232 and do not establish real backend/device functionality.

## Actual changes
1. `dd4e052bed32250a6847fa55915aff720cee65b1`: new `native/scripts/alpha-backend-config.mjs` requires an explicitly supplied **separate** Supabase project URL and publishable key for native packaging. Refuses the known live Kinfolk project and key. CI-only offline placeholder requires `KINFOLK_ALPHA_PACKAGING_ONLY=1`.
2. `be6748528d4fa27324c1c8ca7b28d2857273ca91`: native `prepare-web.mjs` substitutes backend URL, key and auth-storage project ref **in generated native assets only**. It verifies the shared live identifiers are absent and disables website service-worker registration in Capacitor to avoid stale packaged assets. Original web preview source and dark design remain unchanged.
3. `79074c0f23338472143b7f57a2018ce21ab4c381`, `3109e35a5ddff90ff9833229d17621cc7a9a8eb7`: native verifier checks isolated backend, local SDK, full script set, and absence of live identifiers.
4. `b9d0e6a25ed6f6ce1d09a482785ea6325488a1e6`: Recovery221 native regression updated to compare full source modules after expected native-only backend substitutions.
5. `b2a24cdf078e35573a9f4a9a4764642f9d498c81`: four synthetic Node regression tests cover missing/invalid config, live project/key refusal, CI placeholder restrictions, and project/auth storage-key substitution.
6. `e471aed96ba4401b9fc4a0f0fcde4b37583de34c`: source CI uses explicit unreachable offline test configuration.
7. `7a5604bcddfe5348748a7a1d6cd036bd332cf793`: Android/iOS CI compiles from Recovery233 branch with **offline-only** backend markers. Resulting artifacts, even if compilation succeeds, cannot log in or use Supabase.
8. `4a7de6723edd32ba91d029b0168e52d5f95440d9`: updated native README with configuration, limits, and next steps.

## Evidence and outstanding verification
- At note creation, latest GitHub Actions source run `40331972257` and Android/iOS build run `40331972216` were pending. Do **not** mark them passed without checking final conclusions.
- READY preview `dpl_G8xkEJWsvskrnuXSbtr9jLmv6tRP`, URL `https://kinfolk-social-demo-l40jzkt78-alstoda59-9779.vercel.app/`, target null, from README commit. **Web preview still references the shared live project** and must not be used for synthetic-account testing. READY does not verify application behavior.
- A nonproduction Supabase project is authorized in principle, but its organization and any nonzero cost still need user confirmation. No project created.
- Real signup/email/login/logout, teen RLS, profile persistence, uploads, messaging, native callbacks, real-device QA, and signed store artifacts remain unverified. Offline CI artifacts are compilation-only and cannot support those tests.
