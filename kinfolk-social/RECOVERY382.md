# Recovery382 | Hard deadline for isolated native Auth readiness

Date: 2026-10-31 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social in `kinfolk-social/` only. Kinfolksworld excluded.

## Verified starting checkpoint
Continued from Recovery381 exact head `e992dd69992fd59c6fca30ed2f115532d3fa0ded`, draft PR #78, and GitHub Actions SUCCESS run `41257221240`. Inspected README, Recovery380/381, the effective Phase95/79 authentication handlers, Phase106 albums, native `prepare-web.mjs`, the existing functional Auth gate and its tests, Library prelaunch/Recovery226/232 notes, nonproduction Vercel deployments, and the existing isolated Supabase Alpha Test project. No restart, merge, or redesign.

## Substantive code and regression work
The native functional Auth readiness check in `native/scripts/verify-isolated-auth.mjs` previously relied solely on `AbortController`. An abort-ignoring fetch wrapper or stalled `response.json()` could hang indefinitely, preventing reliable Android/iPhone alpha readiness verification. It now races the complete settings fetch, body read and validation against a hard bounded timeout; rejects invalid deadline settings before making any request; and still aborts the network request on expiry. The probe remains read-only and restricted to the designated isolated Supabase project.

Three source-executed synthetic regressions were added to the **existing** `native/tests/alpha-auth-reachability.test.mjs` suite: stalled fetch, stalled JSON body, and invalid timeout values. This suite already runs under `native/package.json` `alpha:verify`; no duplicate runner was added.

Application/gate commit: `a34ee47283ddaae770f9af84a230f83a7f59e5dd`.
Test commit: `4a98251cacc2fc970ac4df864c3e2652548c8a34`.
Draft PR #79 targets Recovery381 only, unmerged.

## Verification and release boundaries
- GitHub Actions source run `41260900265` reached a successful **Complete Node regression suite (synthetic only)** step at inspection time; remaining browser/native workflow steps and the exact-final-documentation commit require independent completion checks. Do not treat in-progress CI as a pass.
- Vercel nonproduction deployment `dpl_3bMWFc89XArfjP969sFZY5Ud3vg5` was **READY** at test commit `4a98251cacc2fc970ac4df864c3e2652548c8a34`. This is build status only, not functional Auth, browser, or device proof. Web previews intentionally block live-backend access.
- Read-only isolated Supabase inspection: project `viantpfagtbgyyzavmtv` has 0 Auth users, 0 album/photo rows, 16/16 public tables with RLS enabled, and zero security advisor findings. RLS installation is not two-account enforcement.
- No shared/live Supabase schema/data/auth/security, production deployment or aliases, Kinfolksworld files, paid resources, or app-store submissions changed.

**Not launch-ready.** Real synthetic-account email confirmation, two-user JWT/RLS proof, backend-connected media/messaging, signed installable Android/iPhone builds, and physical-device QA remain outstanding.
