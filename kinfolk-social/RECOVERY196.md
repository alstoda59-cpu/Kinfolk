# Recovery196 | Shorts viewport sizing

Date: 2026-10-25. Full main Kinfolk Social only, Kinfolksworld excluded.

Inspected Recovery195 committed source and notes, and Vercel deployment history. Recovery195 app commit e2b672f4932a0c7c0a645a29ebc6761ba4762177 is READY on isolated preview dpl_HUrJfobmt4d4rnvAG5AL6rRSZYuA at https://kinfolk-social-demo-5si9seupl-alstoda59-9779.vercel.app/ (target null). READY is not browser/device QA.

Adjusted Shorts feed height to measure available viewport space from the player top to a visible fixed bottom navigation (if present), rather than relying solely on an estimated header offset. Added a resize listener with AbortController cleanup on teardown, preserving existing swipe, reactions, playback and safety filters. Application commit 21788c11533be1565977b31d03818901e8ac0b1b.

Limitations: not yet verified in rendered browser or physical Android/iPhone; selectors may miss nonstandard navigation containers; no Recovery196 READY preview verified; no automated test execution. No production deployment/promotion, live Supabase writes, or Kinfolksworld edits.
