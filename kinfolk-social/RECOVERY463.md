# Recovery463 | Friendship account and receiver isolation
Date: 2026-11-04. Based on Recovery462 branch and its final commit 7ae704272c22104703f0707fefb7244069a84e20.
Branch: kinfolk-social/recovery463-friend-request-ownership-20261104

Application commits: 44099b369ffedbd471a04a6ae0a658245ef542b3 and 0e6101c1f3398a1eecc50304f4d43bb932e746e8.
Friend request send/accept now capture the initiating authentication epoch and user ID, guard asynchronous private refreshes, suppress duplicate writes, and reject accepting requests not pending for the active recipient. Accept update also filters receiver_id and pending status, and requires exactly one acknowledged row. Uncertain mutations block blind retries until reload. These are client-side defenses; backend RLS is still mandatory.

Synthetic test: node kinfolk-social/tests/recovery463-friend-request-ownership.test.cjs (commit d78eff01165b12a0f353d956aaa42ca0b1bc1718). Test execution not independently confirmed; do not claim a pass without Node output. No physical device or real Supabase testing.

Recovery462 final Vercel deployment dpl_BnJs6AAdm6TmUvzFNZPkHTxjaZGw was confirmed READY before edits. Recovery463 deployment must be checked separately.
No shared live Supabase, production deployment or aliases, Kinfolksworld, paid infrastructure, or stores modified. Isolated Supabase organization and nonzero cost require approval. Android/iOS builds and end-to-end tests remain outstanding.
