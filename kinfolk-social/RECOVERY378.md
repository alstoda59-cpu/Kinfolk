# Recovery378 | Private-default albums and signed-photo viewer isolation

Date: 2026-10-31. Scope: full MAIN Kinfolk Social under `kinfolk-social/` only. Kinfolksworld excluded.

## Starting checkpoint
- Continued from exact Recovery377 final commit `0d42d55988d803be5a7d85644fc801c114232ca5`, draft PR #74, without merging or restarting.
- Inspected Recovery377, album RLS migration, Phase106 effective upload/create handlers, original and enhanced album viewer in `index.html`, native test gate, Library prelaunch privacy audit, Vercel preview history, and existing isolated Supabase project.
- Existing isolated project `viantpfagtbgyyzavmtv` is ACTIVE_HEALTHY; read-only checks this run: 16/16 public tables RLS-enabled, zero Auth users, zero album/photo rows, zero security advisor lints. Shared/live project `zojajuzmfjpvubzibzgg` was not touched.

## Implemented application changes
- `kinfolk-phase106.js` now installs the effective `window.viewAlbum` handler. It rejects stale album/photo results after account switching, same-user reactivation, a newer album request or modal replacement. It rechecks ownership and the album/photo relationship before asking for private-media signed URLs.
- Signed photo URLs are rendered via DOM nodes and click handlers rather than interpolated into inline JavaScript. Existing Add Photos and photo comment/reply controls are preserved. The modal refuses unsafe URL schemes and cannot open old media from a replaced or stale viewer.
- `index.html` now selects Private by default in Create Album. The effective Phase106 submission fallback also uses Private unless the member explicitly selects Public. This matches the isolated album schema's private default.
- Added nine source-executed synthetic regressions at `tests/recovery378-album-view-session-isolation.test.mjs` and wired them into `native/package.json` `alpha:media:source:test`, so the offline Android/iPhone source gate includes them.

## Evidence and boundaries
- Isolated draft PR #75: https://github.com/alstoda59-cpu/Kinfolk/pull/75
- Application fix commit `6e047b38b3f04d0778db141f7c74de89be892165`; private-default UI commit `80a238a89cacc2a032630b58d1fe0571a1ad4ef8`; synthetic test commit `cf2ba04741eb7c5ecdd101deb0d6a2037b763a07`; native gate commit `ef4909926f1ea7b8b753390a00bfa1c8ff3cdbf3`.
- Nonproduction Vercel preview for `ef490992` reported READY at https://kinfolk-social-demo-keo25lf0o-alstoda59-9779.vercel.app/ . READY is deployment state, not functional proof. Check the exact final documentation commit separately.
- GitHub Actions run https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41243834601 was in progress when this note was first written. Do not claim CI passed until verified at the exact head.
- No real two-account JWT/RLS test, email confirmation, backend-connected upload/messaging test, signed APK/IPA, or physical Android/iPhone device QA was completed in this change.
- No shared live Supabase schema/data/Auth/security, production Vercel deployment/alias, Kinfolksworld, paid resource or app-store submission was modified.

**Status:** Source fix committed, synthetic tests added, native source gate wired. Not launch-ready.
