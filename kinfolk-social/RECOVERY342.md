# Recovery342 | Effective disappearing-DM overlay account and privacy isolation

Date: 2026-10-30 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social only, `kinfolk-social/`. Base: Recovery341 `e02b810948e416a2d589a2c7f49645a0ddab7e17`. Isolated branch; no production merge or release.

## Verified starting state
- Recovery341 draft PR #39 and continuation report reviewed. Its source and native workflows previously reported SUCCESS at the final Recovery341 commit; those are not Recovery342 results.
- Recovery341 Vercel previews were READY for intermediate commits; no real backend signup, cross-account RLS or physical-device test is implied.
- Library prelaunch audit reviewed. Separate `Kinfolk Social Alpha Test` Supabase project `viantpfagtbgyyzavmtv` was ACTIVE_HEALTHY during read-only inspection; the shared `Kinfolk` project `zojajuzmfjpvubzibzgg` was not modified.
- Existing Recovery300 DM handler filtered pair-specific rows and isolated modal/account lifecycles, but the later effective `window.openDm` disappearing-message override replaced it at runtime. That override rendered unfiltered returned message rows and did not pin requests to the auth activation epoch or modal generation. Its submit handler allowed repeated taps while a write was pending.

## Actual code changes
- `index.html`: preserve disappearing-message defaults and read receipts while filtering initial and refreshed DM results to the captured sender/receiver pair. Only mark matching incoming messages read.
- Capture `kf129Epoch` and `kf300MessageRequest` in the effective override. Reject stale results after logout/login even for the same user ID, or after a modal is replaced. Do not reopen private DM UI from stale callbacks.
- Lock the active DM form while a message insert is pending; reject duplicate taps; only re-enable a still-owned form. Preserve the original sender ID and selected disappearing-message preference for the write.
- `tests/recovery342-effective-dm-overlay.test.mjs`: seven source-extracted synthetic regressions for overbroad reads, same-account relogin, replaced modal, filtered read receipts, duplicate submits, stale sends and successful refresh.
- Include the regression in native `alpha:messages:source:test` and enable offline-only Android/iOS compilation on the isolated branch.

## Verification and safety boundaries
- GitHub source CI and Android/iOS native workflow results must be checked at the exact final commit; a committed test alone is not a passing test.
- Vercel READY is only deployment status, not authenticated UI QA. No real two-user Supabase/RLS tests or physical-device tests were performed.
- This client-side filtering is defense in depth, not proof of RLS correctness. Real cross-account isolation still requires separate authorized synthetic test accounts against the isolated backend.
- No shared live Supabase schema/data/auth/security, production Vercel deployments/aliases, Kinfolksworld files, paid resources or app stores changed. Native CI uses an unreachable backend.
