# Recovery409 | Scope mobile Group Chats invitations to the active member

Date: 2026-11-01 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social only, `kinfolk-social/`; Kinfolksworld excluded.

## Verified starting checkpoint
- Continued from Recovery408 draft PR #105 at `57f5ef73c30e7a1884d92102ca332d545f7cd773`, on new isolated branch `kinfolk-social/recovery409-group-invite-friend-scope-20261101`. No merge or restart.
- Recovery408 **final-head source CI** run [41389086923](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41389086923): completed SUCCESS, 47/47 job steps. Its [native run 41389086900](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41389086900) completed SUCCESS for Android debug APK and unsigned iOS Simulator zip. Both are deliberately offline with an unreachable CI-only Supabase URL; they do not prove real login or physical-device behavior.
- Recovery408 exact-final-head [Vercel preview](https://kinfolk-social-demo-6ni6duvrp-alstoda59-9779.vercel.app/) READY, nonproduction.
- Reviewed latest Recovery408/407 notes, current effective group picker and submit handler, existing source-executed Recovery405 suite, native test runner, isolated Supabase project, and prior Library continuation notes.

## Actual application change
- `5c542f890de8aad6d8caa26db6ae36b89b7101de`: `index.html` Group Chats `openGroupCreate()` now limits invitation options to accepted friend requests involving the currently signed-in account. It deduplicates recipients and rejects empty/self IDs.
- Previously, if a stale/overbroad `state.friendRequests` cache contained an accepted request between two unrelated accounts, the picker could expose that unrelated account and offer it as an invitee. Server RLS still rejects unauthorized invitations, but the client should not show or submit them. The existing submit whitelist now receives only correctly scoped IDs.
- The dark mobile design and other app modules remain unchanged.

## Regression and native verification
- `98e7a0f6e786afccb56392e72771f53b24238d1a`: three additional source-executed synthetic cases in existing `tests/recovery405-group-create-session.test.cjs`: overbroad/mixed cache, incoming accepted friendship, forged checkbox unrelated invite. No duplicate runner; `native/package.json` already includes this test in `alpha:messages:source:test`.
- `fdbd53e7bcae115ab3350522d3651f0e15f20f31`: opt isolated Recovery409 branch into existing offline-only Android/iOS native workflow, with no real backend credentials or signing.
- [Draft PR #106](https://github.com/alstoda59-cpu/Kinfolk/pull/106), unmerged.
- Nonproduction [Vercel preview](https://kinfolk-social-demo-kfdp0jrmv-alstoda59-9779.vercel.app/) READY at `fdbd53e7`, which includes application fix, tests and workflow. This confirms deployment only, not functional/browser/backend/device QA.
- Recovery409 source CI and native compilation must be independently checked on final head. **Do not claim passed tests before those jobs complete.**

## Isolated backend read-only verification
- Existing **Kinfolk Social Alpha Test** project `viantpfagtbgyyzavmtv` ACTIVE_HEALTHY; **shared live** project `zojajuzmfjpvubzibzgg` untouched.
- 0 Auth users, 0 group conversations, 0 members, 0 messages. All three group tables have RLS enabled, no anon SELECT grant, and 4/3/3 policies respectively. Security advisor returned 0 findings.
- These metadata checks are not authenticated two-user RLS enforcement or email delivery proof.

## Remaining release blockers
Real isolated synthetic-account signup/email confirmation, login/logout/restoration, role-separated authenticated RLS, backend-connected group/media/posts/notifications, physical Android/iPhone QA, and signed physical-iPhone installation remain unverified. No production deployment/aliases, shared live Supabase schema/data/Auth/security, Kinfolksworld, paid resources, store submission or PR merge was performed.

**Status:** Actual application privacy fix and synthetic tests committed; exact-head nonproduction preview READY. Kinfolk mobile alpha remains **not launch-ready**.
