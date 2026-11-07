# Recovery505: synthetic delete and friendship regression accuracy (2026-11-07)

Base: Recovery504 on main Kinfolk Social only. Changes restricted to two existing synthetic tests; no runtime, production, backend, or Kinfolksworld modifications.

## Source evidence
Recovery502 source workflow 42304549440, job 128190482512, reported 9 failures among 1,273 tests. The logs show recovery461-delete-post-isolation.test.cjs expected one write but performed a second delete after a confirmed successful deletion, producing two writes and two success refreshes. The runtime's uncertainty lock only intentionally suppresses ambiguous outcomes. Recovery463 friend-request test failed at line 33 with undefined calls[2] because the test advanced its local epoch without advancing ctx.kf129Epoch, so acceptFriend failed its current-session guard before issuing the update.

## Committed corrections
- Recovery461 synthetic fixture now retries only ambiguous outcomes, verifying the uncertain-write lock, and models the confirmed-success path as a refreshed feed where the deleted post is no longer clickable.
- Recovery463 synthetic fixture synchronizes the VM authentication epoch with each simulated account switch, permitting the authorized receiver's acceptance scenario to reach its RLS-scoped update while still testing rejection of a nonrecipient.

## Verification boundaries
GitHub accepted two fixture commits: 691b4eff96a1876ac3b153ff5877c538db5e5a25 and 6adac72b4a72972df6d02947aaf3f0f6b8947c05. A passing Recovery505 test run, native build, installable APK, iOS Simulator archive, physical device test, isolated Supabase Auth/RLS verification and READY preview have NOT been established. Investigate remaining failures and rerun CI; do not infer runtime readiness from corrected fixtures. No paid environment or shared live resources were touched.
