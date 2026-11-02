# Recovery424 | Exact Settings write acknowledgments and rejected-save recovery

Date: 2026-11-02 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social in `kinfolk-social/`, excluding Kinfolksworld. Continued from Recovery423 final commit `b2aa4ae60ac728d63632cf55e127b45a454ee748`. Isolated branch `kinfolk-social/recovery424-settings-write-ack-20261102`, draft PR #121, unmerged. No production release.

## Starting verification
- Inspected Recovery423/422 continuation reports, latest GitHub branches and draft PR #120, current source/native workflows, Settings code, synthetic tests, Library notes, and Vercel nonproduction deployments.
- Recovery423 exact-head source CI [41511203544](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41511203544) finished SUCCESS. Native run [41511190189](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41511190189) had a successful Android debug APK job and a CANCELLED iOS Simulator job.
- The latest previously verified READY Recovery423 nonproduction preview was at commit `0fa8d1155a2cdf8cb1247d8f3192934ad2e2797e`, not the Recovery423 documentation head.
- Read-only isolated Alpha Test Supabase inspection on this run confirmed `auth.users` count 0 and the six Settings tables' owner keys. The isolated project is `viantpfagtbgyyzavmtv`. Shared live project `zojajuzmfjpvubzibzgg` was not accessed or changed.

## Substantive application fix
- The effective Phase76 mobile Settings save previously treated a successful HTTP response with no affected-row acknowledgment as a successful save. It could also leave Save disabled on a rejected Promise.all request. This could mislead users about privacy, notification, safety and profile settings.
- Updated the `profiles` update to request `count:'exact'` and the five upserts (`kinfolk_profile_extras`, `kinfolk_safety_settings`, `user_settings`, `kinfolk_user_preferences`, `notification_preferences`) to request `count:'exact'`.
- Save success now requires exactly one affected row from all six writes **and** a returned profile row owned by the initiating account. Missing, zero, multiple, null, or wrong-owner acknowledgments fail closed with refresh guidance, never a false saved toast.
- Network rejection restores the Save control only for the still-active Settings screen and session. Old activations cannot show stale errors or apply results. Existing teen-private enforcement and duplicate-submission guards remain.
- Added six new source-executed synthetic behavior regressions to the existing Settings test, covering all six counts, zero/multi counts, foreign profile row, network rejection, stale rejection and null response, plus one source contract check.
- Updated the Recovery228 static test to recognize the new guarded write syntax without dropping its six-account-ID and post-save session checks.
- Added this isolated branch to offline Android/iOS workflow allowlist. Existing native `alpha:profile:source:test` already includes the expanded Settings regression.

## Verification boundaries
- Initial Recovery424 source CI run [41519728998](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41519728998) failed **one outdated Recovery228 source assertion**, while the new Recovery424 source-executed tests passed. The assertion was corrected in commit `348455e3`; final-head source and native CI must be independently checked after the last code/test/report commit.
- The native workflow uses an intentionally unreachable packaging-only backend. Android APK compilation is not proof of real backend-connected signup or upload; an unsigned iOS Simulator app is not a physical iPhone IPA.
- Settings writes are six independent concurrent PostgREST operations, **not a transaction**. A partial write remains possible if one fails; users are instructed to refresh. Real authenticated backend tests of the exact-count responses remain unperformed.
- Read-only isolated backend inspection is not two-account authenticated RLS proof. Zero Auth users and no approved deliverable synthetic inbox block real email confirmation and native callback verification.
- No shared live Supabase schema/data/auth/security, production Vercel/aliases, Kinfolksworld, paid resources, real user messages or app-store submissions were modified.

## Next
Check final-head CI and native job outcomes; inspect any READY nonproduction preview at its exact commit. Then prioritize owner-approved synthetic test inbox/authenticated two-account RLS and connected Android/iPhone QA. Do not claim launch readiness until end-to-end evidence exists.
