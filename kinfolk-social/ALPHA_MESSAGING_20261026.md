# Isolated Alpha Messaging / Friend Requests (2026-10-26)

Scope: **only** isolated Supabase project `viantpfagtbgyyzavmtv`. Do not run these changes against the shared live Supabase project or deploy to production without approval.

## Applied database migrations

1. `alpha_friend_requests_participant_rls`: participant-only friend requests, sender-only pending creation, receiver-only acceptance/decline, sender-only cancellation, reciprocal duplicate prevention and block-aware inserts.
2. `alpha_private_friend_only_messages_rls`: participant-only messages, accepted-friend-only sending, block-aware inserts, 2,000-character body bound, optional disappear-after-read visibility (30 seconds), and recipient-only `kinfolk_mark_message_read` RPC.
3. `alpha_fix_message_friend_policy_correlation`: **critical correction** to qualify the outer `messages.sender_id` / `messages.receiver_id` references in the friend lookup. The original policy had unqualified subquery column references and was immediately replaced before user testing.
4. `alpha_recipient_notifications_and_event_triggers`: recipient-only notifications and read-status update, server-side generic notifications for friend requests, accepted friendships and new messages. Trigger functions have fixed empty search paths and no direct execute grant to client roles.
5. `alpha_reciprocal_blocks_rls_contact_guard`, `alpha_blocked_friend_acceptance_guard`, `alpha_allow_decline_when_contact_blocked`: discovered that `blocks` SELECT RLS only reveals rows to blockers, so naive reciprocal block subqueries could miss a block placed by the other party. Replaced with a controlled definer helper; accepted requests and message sends are blocked in both directions, while declining remains allowed.
6. `alpha_private_schema_block_guard_no_rpc_exposure`: moved that helper into `kinfolk_internal` (not an exposed API schema) after the security advisor correctly flagged its initial placement in `public`. The public function was dropped. Security advisor returned **zero lints** after this correction.

## GitHub app changes

- Both legacy and enhanced `openDm` entry points now require an accepted friendship before opening the conversation. This mirrors the isolated backend's conservative alpha policy. The UI shows an actionable message otherwise.
- Regression tests in `tests/alpha-dm-friends.test.cjs`.

## Verification performed

- Confirmed all three new tables exist with RLS enabled.
- Confirmed `anon` lacks SELECT on all three; `authenticated` has SELECT with RLS.
- Inspected all nine RLS policies in `pg_policies`, including the corrected correlated message-friend policy.
- Confirmed two notification triggers exist and the read RPC is security invoker.
- Supabase security advisor returned zero lints after moving the reciprocal block helper to an internal schema.
- Parsed all five inline JavaScript scripts in `index.html` with a JS syntax compiler, with zero syntax errors. Parsed the new Node test file. Checked both DM guards statically. Executed the isolated `kfAlphaCanDm` helper against seven synthetic relationship states: 7/7 matched expected behavior (not a GitHub Actions run).
- **Not verified:** actual two-account signup/email verification, authenticated cross-account RLS, sending/reading/disappearing messages, trigger delivery, GitHub Actions CI, native builds, physical devices.

## Known blockers and follow-up

- The alpha is intentionally **friends-only for DMs** until teen/adult messaging permissions and age enforcement are validated.
- **Disappearing-message caveat:** the 30-second RLS visibility rule hides messages from client reads but does **not delete database rows**. A server-side retention/cleanup mechanism and privacy QA are required before representing this as permanent deletion or launching.
- Existing `loadNotifications` reads the recipient's notifications via RLS; generic friend/message notifications now have triggers, but live behavior is untested.
- Other app tables (`kinfolk_stories`, `kinfolk_videos`, `kinfolk_pages`, `kinfolk_channel_subscriptions` and others) remain missing from this isolated backend.
- Avoid using real user credentials or content in the preview. Continue synthetic-account RLS testing and isolated native packaging before launch claims.
