# Recovery326 | Blocked-account privacy across sessions

Date: 2026-10-29. Scope: **full main Kinfolk Social** in `kinfolk-social/` only. Based on Recovery325 final commit `33a80c7bd020a7ada60a690cd02cd9983b684237`. Draft nonproduction branch, no merge.

## Inspected before edits
- Recovery325 draft PR #24 and report; latest Recovery325 source CI #40949520605 and native workflow #40949485024.
- Both Recovery325 source CI and Android/iOS Simulator compilation completed successfully, but they are **offline synthetic builds**, not functional device QA.
- Latest Vercel preview found READY at Recovery325 intermediate commit `0ae4d0dc`, not at the Recovery325 final commit. It remains protected from the shared live backend.
- Library Kinfolk prelaunch and continuation notes, native alpha test scripts, main app blocked-account handlers, and read-only isolated Supabase Alpha Test tables.
- Isolated Supabase project `viantpfagtbgyyzavmtv` is ACTIVE_HEALTHY; 14 public tables with RLS enabled, no rows. Community, membership, Channel and Video tables are absent. No backend changes.

## Actual application fix
- Previous blocked-account list queries referenced `state.user.id` across awaited calls and wrote results to a globally queried element. An old response could paint the wrong account's screen.
- Previous inline Unblock buttons invoked a global delete using whichever user was signed in at click time.
- `kinfolk-phase76.js` now pins the opening user ID, authentication activation epoch and exact screen. It ignores delayed block/profile responses after account changes or screen replacement.
- Unblock is permitted only for an ID returned in the current account's blocked list. Buttons use delegated data-bound clicks, not inline JavaScript. Duplicate taps cannot start overlapping deletes. Delete filters use the pinned owner, and late results cannot refresh a newer account's screen or display stale success.
- RLS remains the security boundary. A request already sent to Supabase cannot be cancelled by this client-side guard.

## Synthetic tests and packaging
- Added `tests/recovery326-blocked-accounts-session-guard.test.cjs`: eight synthetic Node cases for signed-out access, account-pinned reads, stale list/profile results, screen replacement, same-account reactivation, duplicate deletes, success refresh and failed delete retry.
- Wired the new test into `native/package.json` alpha safety source suite.
- Updated `.github/workflows/kinfolk-alpha-native.yml` to compile offline Android debug and unsigned iOS Simulator artifacts on this isolated branch.
- Local isolated handler harness: eight tests passed under Node 22 before commit. **Full GitHub CI and native build must be checked at the final commit; no real backend or physical-device tests performed.**

## Remaining blockers
- Real synthetic-account signup, email confirmation, login/logout/session restoration and two-account RLS testing on a separately approved isolated backend.
- Communities/Channels/Videos backend schema, uploads, notifications, messaging, teen-safety server enforcement, and signed-media end-to-end checks.
- Native HTTPS callback approval, physical Android/iPhone testing, signed iPhone IPA and store review.
- No production, shared live Supabase, paid infrastructure, Kinfolksworld, aliases or app stores were changed.
