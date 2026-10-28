# Recovery293 | Account-scoped reaction writes and stale UI protection

Date: 2026-10-28 (America/Los_Angeles). Scope: full main Kinfolk Social under `kinfolk-social/` only; Kinfolksworld excluded.

## Baseline
- Inspected latest Recovery292 report and source, Recovery291 Reels source, existing Recovery292 reaction-loader regression, current Recovery29x branches, prior Recovery226/232 Library notes, GitHub commit statuses and nonproduction Vercel deployments.
- Recovery292 final commit `89853d17ca4b22ce7ef731a2eb1265fbb52dea28` has a READY nonproduction preview. Its GitHub Actions run was not established by the available commit-run lookup.

## Implemented
- `c81c5815aa4ec2976a22a5e30ff33bffd6b89a10`: video reaction mutation captures the initiating user ID and auth-session epoch. Writes always target that captured user. Pending mutation keys are session/account scoped rather than global video IDs, so an old account's delayed write cannot block the new account's reaction. Stale completions/errors do not reload reaction counters, rerender controls, emit reaction events or show outdated error toasts after account switching or logout/login.
- `80f5cd08c367d55fa7add4735e6d17a2fd343ebf`: five synthetic Node regression tests for success, account switching, simultaneous distinct-account mutations, same-account new session, and duplicate same-session suppression.

## Verification
- Re-fetched committed `index.html` blob `9013c34cf23f332f9580e3d5e080ca08e66e0f0b`; extracted the actual 2,123-character mutation handler and executed five synthetic V8 scenarios against it: **5/5 passed**. This is not an execution of the committed Node test file, GitHub Actions, browser/device testing, or a real Supabase mutation.
- Vercel reported READY for code commit `c81c5815` and test commit `80f5cd08`. Latest tested-code preview: https://kinfolk-social-demo-hhtekvxu2-alstoda59-9779.vercel.app/ . READY indicates deployment only, not functional proof.
- Real synthetic-account signup/email confirmation/login/logout/session restoration, cross-account RLS, current Android/iOS builds, integrated mobile features and physical-device QA remain unverified.

## Boundaries
All writes isolated to this development branch under `kinfolk-social/`. No shared live Supabase schema/data/auth/security, production deployments or aliases, Kinfolksworld, paid infrastructure or app-store submission changed.
