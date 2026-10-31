# Recovery355 | Fail-closed account deletion backend acknowledgments

Date: 2026-10-30 America/Los_Angeles. Scope: FULL MAIN Kinfolk Social under `kinfolk-social/`, excluding Kinfolksworld. Isolated branch `kinfolk-social/recovery355-delete-rpc-ack-20261030` based on verified Recovery354 head `6937bce9db03b67e1d61e9b9d784d6969d9f3d37`. No merge or production release.

## Inspected first

- Recovery354 report and README, draft PR #52, existing Phase115 account deletion implementation and Recovery347 source-extracted test harness, native packaging/test workflow, latest isolated Vercel READY intermediate previews, historical Library notes.
- Read-only isolated Supabase project `viantpfagtbgyyzavmtv` is ACTIVE_HEALTHY with 14 empty RLS-enabled public tables and 38 RLS policies. SQL inspection found **zero** `public.kinfolk_delete_my_account` functions and no `communities`, `channels`, or `group_chats` tables. The shared live project `zojajuzmfjpvubzibzgg` was not accessed or modified.

## Actual runtime fix

In `kinfolk-phase115.js`, deletion previously treated an HTTP-successful `CHECK` RPC response with null, empty or malformed data as permission to start removing private media, because only explicit `ready:false` was rejected. Likewise, a null/empty `DELETE` response could be reported as successful account deletion, triggering local sign-out/redirect.

- Require `check.data?.ready === true` **before** listing or removing any private media.
- Require `del.data?.deleted === true` before displaying success, signing out or redirecting.
- On missing/malformed acknowledgments, show an actionable error and allow retry. Do not claim account deletion succeeded.
- Pre-enumerate all three configured storage buckets before deleting the first object. A missing or inaccessible later bucket can no longer cause partial deletion of earlier buckets during enumeration. Existing exact account/session/token/modal guards and dark mobile UI are preserved. This still does not make client-side deletion atomic: a later removal or final RPC failure can leave partial effects.

## Tests and packaging

- Extended `tests/recovery347-account-deletion-session-guard.test.mjs` with **ten** source-executed synthetic cases: null, empty, explicit false and truthy string for each of `CHECK` and `DELETE`. Eight acknowledgment tests assert no media enumeration/removal for rejected CHECK and no sign-out/redirect for rejected DELETE. Two additional tests cover missing later storage buckets and successful all-bucket preflight before the first removal.
- Existing source CI runs all `*.test.mjs` tests. Existing `native/package.json` safety source gate already includes this test file; no duplicated runner.
- Added this isolated branch to `.github/workflows/kinfolk-alpha-native.yml` for offline-only Android debug APK and unsigned iOS Simulator compilation. Native CI still uses unreachable packaging-only backend markers, **not** a functional connected alpha.

## Verification and blockers

At documentation time, source/native CI must be checked at the exact final commit. Intermediate Vercel READY is a deployment state, not a backend test; final-commit READY is not assumed. No real synthetic account signup/email verification, two-account RLS, uploads, messaging, teen-safety or physical Android/iPhone QA has been completed.

The isolated alpha backend lacks the deletion RPC and the optional `kinfolk-wallpapers` storage bucket (read-only inspection found only `kinfolk-media` and `kinfolk-video`). Functional deletion remains blocked. The missing wallpaper bucket now fails before any media is removed, rather than after earlier buckets have been emptied. Real account deletion must be tested with synthetic accounts only after a reviewed backend implementation is separately authorized. No shared live Supabase schema/data/auth/security, production deployment/alias, Kinfolksworld, paid infrastructure or app stores changed. Kinfolk is **not launch-ready**.
