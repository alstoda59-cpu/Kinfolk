# Recovery349 | Removed profile music stays removed

Date: 2026-10-30 (America/Los_Angeles). Scope: full main Kinfolk Social in `kinfolk-social/` only. Based on Recovery348 `4fcdf6d0395519410ae1fb349ec05ffdd6e3976a`. Isolated branch `kinfolk-social/recovery349-profile-music-null-authority-20261030`; no merge or production release.

## Inspected before changes

- Recovery348 README, RECOVERY348.md, effective Phase81 appearance and music code, source-extracted regression suite, native test gate and CI workflow.
- Recovery348 source CI run `41107615671` succeeded (747+ source regressions plus Recovery348 suite as recorded in its report); exact Recovery349 CI must be checked separately.
- Nonproduction Vercel preview `dpl_6i54KoP5CgZZ2kch5BubEFcw27tc` was READY for an intermediate Recovery348 commit `6273cd240a4fd83db3200044a34ee826d97a0d69`, **not** proof of Recovery349 or real backend QA.
- Library Kinfolk continuation notes and Supabase project listing were inspected read-only. Separate alpha project `viantpfagtbgyyzavmtv` was ACTIVE_HEALTHY. No schema, data, auth, RLS or storage writes were made.

## Application fix

- `kinfolk-phase81.js`: the profile music reader previously used `if(data?.music_url)` and fell back to the stale public `profile_music_url` when private extras explicitly contained `music_url: null`. As a result, removing music could make the old track play again.
- An existing private extras row is now authoritative even for `null` or empty music, both in playback and in the Settings input, while missing/error extras rows retain the public-profile fallback. Other members' public music still works.
- Opening a profile no longer performs an implicit `profiles.update` write to reconcile a different extras URL. This avoids unrequested background writes during navigation and same-account activation races.
- An async extras lookup invalidated by account switch or same-user reactivation returns no URL, while the existing `ensureMusic` guard still checks the active profile and hero element before rendering.
- This does not make the two sequential saveMusic writes atomic. If extras succeeds but public profile update fails, the backend may remain temporarily inconsistent; explicit reconciliation needs isolated-backend testing.

## Tests and packaging

- `tests/recovery349-profile-music-null-authority.test.mjs` adds ten source-extracted synthetic cases for explicit removal, empty values, private override, missing/error fallback, public other-member view, account switch and same-user activation change.
- `native/package.json` adds the suite to `alpha:profile:source:test`, which is part of `alpha:verify`.
- `.github/workflows/kinfolk-alpha-native.yml` includes the Recovery349 branch, retaining its unreachable CI-only Supabase backend and packaging-only mode.
- New exact-head CI, Vercel preview, real Supabase authentication/RLS and physical Android/iPhone tests must be independently verified. Compilation or READY status does not prove an end-to-end working alpha.

## Safety and remaining blockers

No shared live Supabase project, production Vercel deployment or aliases, Kinfolksworld, paid resources or app stores were changed. No real accounts were created; synthetic fixtures only.

Still blocked: real isolated signup/email confirmation/login/logout/session restoration, role-separated RLS and storage, missing Community/Channel/group tables, functional uploads/messaging/teen enforcement, backend-connected native alpha, signed physical iPhone IPA and physical-device QA. Do not claim launch readiness.
