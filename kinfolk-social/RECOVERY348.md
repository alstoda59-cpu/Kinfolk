# Recovery348 | Account-scoped profile appearance saves

Date: 2026-10-30 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social only, `kinfolk-social/`; Kinfolksworld excluded. Base: Recovery347 `c211acc99f2fd5b97ae0f01351a188f039e80021`. Isolated draft PR #46 against the Recovery347 branch. No merge, production release or store submission.

## Inspected before changes

- GitHub Recovery347 branch, README, RECOVERY347.md, RECOVERY346.md, effective Phase81 appearance/music handlers, existing Recovery176 legacy regression and native profile source suite; Library Kinfolk continuation notes; Vercel previews and GitHub Actions.
- Recovery347 exact-head source CI `41098744236` was SUCCESS. Recovery347 native workflow `41098708335` had a successful Android APK job but a **cancelled** iOS Simulator job. Neither result establishes a functional backend-connected alpha.
- Read-only isolated Supabase project `viantpfagtbgyyzavmtv` was ACTIVE_HEALTHY. All 14 public tables were RLS-enabled; `kinfolk_profile_extras` has owner-only SELECT/INSERT/UPDATE policies, and `profiles` has an owner UPDATE policy. This is policy inspection, **not** two-account RLS proof.
- No shared live Supabase project, schema, auth, data, production Vercel or aliases was modified.

## Actual application fix

- Commit `43cf5a0b9fcb97ecc89325a11e4bb54d27bf8a7a`: `kinfolk-phase81.js` now pins the effective profile color and music save handlers to the initiating user, auth activation epoch and exact mounted Settings card. Late results after account switch, same-user relogin or Settings replacement cannot overwrite the current account's local profile, theme, music playback or success notice.
- Duplicate Save taps are ignored while each request is in flight. Color updates require a returned row with matching user and color before reporting success or applying a persisted theme.
- Music extras are written and verified first, followed by the public profile update; both returned rows must match the initiating user and requested URL. A failed or stale extras write no longer starts the second write. Audio is restarted only after both writes are confirmed and the original account/card remains current.
- The two database writes are **not atomic**. A failure after the first succeeds can leave extras and profile temporarily different; the app reports an error rather than claiming full success. Real isolated-backend reconciliation testing remains necessary.

## Synthetic regressions and CI

- Commit `78bfb24a8cd6d4a093233450e27b29e5e637e4e4`: 15 source-extracted synthetic VM cases for confirmed row values, wrong account, stale auth epoch, replaced Settings, duplicate taps, RLS denial, sequential music writes and stale audio restart.
- Commit `d8fada562d3fcc125433f715ebdaa255e1526427`: wire suite into `native/package.json` `alpha:profile:source:test`.
- Commit `6273cd240a4fd83db3200044a34ee826d97a0d69`: enable offline-only Android/iOS compilation for isolated Recovery348 branch.
- Initial source CI `41107262253` failed Node stage with **754 passed, 8 failed**. Four failures were older Recovery176 fixture assumptions about Settings DOM and the new sequential Supabase write; four were Recovery348 tests expecting a second async write after only one microtask.
- Commits `f804d8813655d4412fdff0472fea7b05fde4773f` and `81922a1c62852e28b16d84da575260393fda7aac` corrected those fixtures without relaxing the application guard. Verify subsequent exact-head source CI, native Android/iOS jobs and Vercel preview independently before calling them successful.

## Remaining release gates

- Real synthetic-account signup, confirmation email delivery, login/logout and restored sessions on the **isolated** backend; two-account RLS, private storage and messaging verification; missing Community/Channel/group schema; full video handling; native signed iPhone package and physical Android/iPhone QA.
- Offline APK/iOS Simulator compilation and Vercel READY previews do not prove real authentication, private media, RLS or installable signed iPhone behavior.
- No shared live backend, production deployment, aliases, Kinfolksworld, paid infrastructure or stores changed.
