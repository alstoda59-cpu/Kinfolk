# Recovery339 | Nonpersistent startup session race guard

Date: 2026-10-30 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social only, `kinfolk-social/`, excluding Kinfolksworld. Continued from Recovery338 final commit `9f161f446f7bc406b936add37b8918bbb19ff599`. Draft PR #37 targets Recovery338, not production.

## Inspected first
- Recovery338 report and README, open Recovery338 PR #36, latest branch heads, source CI run [41026195174](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41026195174) SUCCESS and offline native run [41026175641](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41026175641) SUCCESS.
- Existing `kf129RestorableSession`, startup/Retry caller, Phase95 login preference writes, Recovery149 legacy tests, Recovery338 confirmed-email activation, native source gate and Vercel preview history.
- Library prelaunch audit: shared live media/privacy and RLS are not validated for public launch. The separate `Kinfolk Social Alpha Test` project is ACTIVE_HEALTHY; no database or Auth writes were made.
- Recovery338 Vercel previews are READY at intermediate commits, but preview isolation deliberately blocks live Supabase access; READY is not functional login evidence.

## Application change
- Commit `452485d5121afeafd9f75508377c7ce4d75785e0`: before signing out a nonpersistent session on startup or Retry, re-read the active Supabase session and re-evaluate Stay Logged In and same-tab permission.
- If the account changes or either session token rotates during the pending read, fail closed by returning no restorable session **without signing out the newer session**. If the preference becomes allowed during the read, return the latest session. A stable disallowed session is still signed out with `scope:'local'`.
- This narrows a real async race, but Supabase signOut is not an atomic compare-and-swap; a final race after the second read cannot be completely ruled out without server-side coordination.

## Tests and packaging
- Commit `3402f6140601e9fb310e24a9f9aab9e5ca899c5e`: 11 synthetic runtime cases covering stable denial, same-tab and persistent restore, account switch, token rotation, preference change, disappearing session, read errors and signout errors.
- Commit `3e450ae3ff7e67ce793d3be2d0f3d359c6d6ff6f`: include these tests in native `alpha:auth:source:test`.
- Commit `9b74abf2c21f58d032a10884b44b638d1fe6cf2f`: enable offline-only Android/iOS compilation on this branch.
- Commit `2b18996453a0bcfa28ced165b1460f6434b6dc4a`: update Recovery149 legacy VM fixture to extract the new shared restore-policy helper.
- Source CI and native builds must be independently checked at the final documentation commit; do not infer pass from commits or earlier runs.

## Boundaries and blockers
- No real isolated Supabase signup, email delivery, cross-account RLS, private media, missing Community/Channel schema, messaging or teen safety has been proven end-to-end.
- No physical Android/iPhone QA or signed iPhone distribution. Native CI packages use an unreachable CI-only backend; they cannot authenticate.
- No shared live Supabase schema/data/auth/security, production deployment/aliases, Kinfolksworld, paid infrastructure or store submission was changed. Do not claim launch readiness.
