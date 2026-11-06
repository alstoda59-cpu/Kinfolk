# Recovery482 | Execute functional alpha gate regressions in CI

Date: 2026-11-05. Based on Recovery481 exact-head commit `718bf1201a6657022dd2b30f53932c0bb15186d9`. Main Kinfolk Social only.

## Change
The existing recovery-branch GitHub Actions workflow now executes four already-committed native functional-gate suites: backend configuration, two-user RLS gate, Auth reachability, and email-signup readiness. This is offline synthetic verification, with no real accounts, Supabase writes, service-role credentials, or live backend access. Existing preview isolation and confirmed-session checks remain in place. No app UI or native packaging configuration changed.

## Evidence boundaries
- Workflow source commit: `a7181130e1726548a20de33e76d59e1e2133df2c`.
- Recovery481 final-head Vercel deployment `dpl_JASE3J4L8m9B94ZRSNTEDzbT1mdr` was READY before this change.
- A committed workflow is not a successful Actions run. Inspect the actual push-triggered job and test output before claiming a pass.
- These mock-backed tests do not establish real email delivery, two authenticated-user RLS, private storage, connected uploads/messages, Android/iPhone builds, or physical device QA.

## Next
Confirm CI execution and fix any actual test failures. Obtain owner approval for isolated Supabase organization and any nonzero cost before provisioning or changing resources. Then run synthetic real-account signup, confirmation, session restore and RLS checks on the designated isolated project. Finally compile current native binaries and test on devices. No production changes or app-store submissions.
