# Recovery464 | Direct-message write acknowledgment
Date: 2026-11-04
Base: Recovery463 final commit 5f670ef877c8fd9f044fc4788470365417844de7.
Branch: kinfolk-social/recovery464-dm-write-ack-20261104

Application commit bc95876305daa4db86502ed3ec679d6bfd2427b2.
Synthetic source-contract test commit 86e3016fe29dfdd97165a30ab0e8d5a079e9a7ab.

The direct-message send form now requests exact one-row INSERT acknowledgment and checks returned message ID, sender, recipient and body. It leaves the form disabled after ambiguous database errors, missing acknowledgment or network failure so repeated taps cannot blindly send a duplicate. Reopening the conversation provides a deliberate retry path. Existing auth-epoch/request checks prevent cross-account UI refresh. This is client defense, not a replacement for Supabase RLS.

Run: node kinfolk-social/tests/recovery464-dm-write-ack.test.cjs
The source-contract test was committed but not executed independently. No real backend account tests, native builds or physical-device QA are claimed. Recovery463 final Vercel deployment dpl_6QoN896xKgLkxsxVAa62WX1GkuSm was confirmed READY before this change; Recovery464 preview and CI require separate verification.

Outstanding: isolated Supabase organization and any nonzero project cost need owner confirmation; private media bucket exposure remains a prelaunch blocker. Do not modify shared live Supabase, production aliases, Kinfolksworld or stores.
