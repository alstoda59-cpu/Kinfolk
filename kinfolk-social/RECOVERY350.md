# Recovery350 | Session-safe profile settings hydration and legacy color saves

Date: 2026-10-30 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social in `kinfolk-social/` only. Base: Recovery349 `417be601ac5bf25c6c5fd80d13e1204303c2b0e5`. Isolated branch `kinfolk-social/recovery350-settings-hydration-session-guard-20261030`. No merge, production release or store submission.

## Inspected before changes

- GitHub latest Recovery349 branch, draft PR #47, `RECOVERY349.md`, README, effective `kinfolk-phase81.js`, Recovery348 and Recovery349 regression tests, native package verification scripts and offline native CI workflow.
- Recovery349 final source CI run `41115044588` succeeded. Its successful Node/browser/source steps are synthetic and not real Supabase or physical-device tests.
- Vercel latest nonproduction READY preview for Recovery349 was intermediate commit `c0f1e032a0336e0b3c4aad67aa06dba1803ee7b8`, not final Recovery349 head. Recovery350 intermediate previews must not be described as final until exact SHA is verified.
- Read-only Supabase project listing: separate `Kinfolk Social Alpha Test` project `viantpfagtbgyyzavmtv` is `ACTIVE_HEALTHY`; shared live `Kinfolk` project `zojajuzmfjpvubzibzgg` was not modified. Prior Recovery349 notes document absent Community/Channel/group schema and unverified two-account RLS.
- Library Kinfolk continuation notes reviewed, including prior mobile packaging and privacy gates. No nonzero resources were created.

## Actual application changes

- `kinfolk-phase81.js`: private appearance hydration now captures the initiating auth activation epoch. Pending `kinfolk_profile_extras` reads from an earlier activation of the *same* account are discarded instead of mounting stale settings after relogin.
- Owner settings now use a profile row whose `id` matches the signed-in user, rather than blindly using `state.profile` if it temporarily points at another member.
- The appearance-card mount rechecks the captured epoch after asynchronous hydration.
- The legacy `kfsForm` color submit handler now binds the write response to the initiating user, activation epoch and exact still-mounted form, and only applies a backend-confirmed matching owner/color row. Previously a delayed legacy response could overwrite the current theme after same-user relogin or account switch.
- Existing dark mobile design, explicit removed-music preference behavior, music player, profile color wheel and features remain preserved. No database migration or backend write was performed by this development run.

## Synthetic tests and native gate

- `tests/recovery350-settings-hydration-session-guard.test.mjs`: 13 source-extracted synthetic cases cover correct owner profile selection, cross-profile fallback protection, same-user relogin, account switching, failed extras reads, stale mount rejection, legacy form replacement, confirmed rows and mismatched values.
- `native/package.json`: suite added to `alpha:profile:source:test`, which is part of offline `alpha:verify`.
- `.github/workflows/kinfolk-alpha-native.yml`: isolated Recovery350 branch enabled for Android debug APK and unsigned iOS Simulator compilation. CI backend is an intentionally unreachable packaging-only placeholder.
- Exact-head CI, native jobs and Vercel status require independent verification after final commit. A READY preview or compiled APK does not demonstrate functional backend auth, private media or physical iPhone installation.

## Release blockers

- Real synthetic-account isolated Supabase signup/email confirmation/login/logout/session restoration, two-account RLS and private media/messaging tests, missing Community/Channel/group tables, functional teen-safety enforcement, backend-connected native builds, signed physical-iPhone IPA and physical-device QA remain unverified.
- Never modify shared live Supabase schema/data/auth/security, production Vercel/aliases, Kinfolksworld, paid resources or app stores without explicit owner approval.
