# Kinfolk Social main app | Recovery133

This branch now contains the **full main Kinfolk Social Recovery133 source**, separate from `kinfolksworld/`. Do not merge to main or deploy to production without owner approval.

- Source ZIP: `Kinfolk_Social_Full_Preview_Recovery133_2026-10-24.zip` (ChatGPT Library ID `libfile_e6a06a81fd688191a02e04f1aedefbc3`), SHA-256 `43f20af3d25624a08ebdfeb00df5831b120409161437109fea27f2445d58d4c3`.
- Tests: 27 JavaScript syntax checks, native prepare:web (22 modules), mocked mobile login/navigation/profile/settings/signup regressions passed. See `validation.json`. No real backend or device tests.
- GitHub branch root `vercel.json` routes branch preview traffic to this folder. This is not a production release.
- Native packaging scaffold: `native/`. Run `npm run prepare:web` to generate untracked `native/www`.
- Outstanding: real Supabase auth/session, backend age/permission enforcement, uploads, messaging, Android/iOS builds and physical device QA, store content policy review.
- This repository is PUBLIC. Never commit private keys, service-role credentials or real user data.
